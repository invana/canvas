# Splitting `@invana/canvas` → orchestrator + `canvas-pixijs` renderer

> **Status: PLAN.** Concrete decomposition of today's `@invana/canvas` into an
> **orchestrator** (renderer-agnostic) and a **pixi renderer**, on top of the
> already-built `@invana/canvas-store` kernel. Grounded in a file census of
> `packages/canvas/src` (**49 of 117 `.ts` files import `pixi.js`/`pixi-viewport`**).
> Companion to [`canvas-3-package-architecture.md`](./canvas-3-package-architecture.md)
> (the direction) and [`canvas-store-data-event-flow.md`](./canvas-store-data-event-flow.md)
> (the state/event substrate).
>
> **Naming:** the 3-package doc calls the renderer `@invana/canvas-pixijs`; the ask
> phrased it `renderers-pixijs`. Used `canvas-pixijs` below for consistency — **a
> naming decision to confirm** (`@invana/canvas-pixijs` vs `@invana/renderer-pixijs`).

---

## 1. Target: three packages, one seam

| Package | Owns | pixi? |
|---|---|---|
| `@invana/canvas-store` | **state + events** — `view` · `data` (`DataStore`s) · `events` · telemetry · history | ✅ leaf (built) |
| `@invana/canvas` | **orchestration** — `Canvas` lifecycle + registries · behaviours (input→state) · layouts (data→positions) · abstract camera · binds store ↔ renderer through `IRenderer` | ✅ agnostic |
| `@invana/canvas-pixijs` | **rendering** — implements `IRenderer`: projects store → pixi (the whole `primitives/` library, `Application`, viewport). Pure projection, holds no source-of-truth state | ❌ pixi |

```
canvas-store  (state+events; leaf)
   ▲ update / subscribe / tap          ▲ IRenderer (pure types live in the store)
   │                                     │
canvas        (orchestrator) ───────────┘ drives whichever renderer is injected
   │  new Canvas({ store, renderer })
   ▼
canvas-pixijs (implements IRenderer → pixi)
```

The seam is **`IRenderer`** — pure types in `canvas-store`, implemented by
`canvas-pixijs`, consumed by `canvas`. The orchestrator never imports pixi, so a
second renderer (`canvas-2d`, `canvas-webgpu`) is a drop-in.

```ts
// @invana/canvas-store — the renderer contract (types only, renderer-free)
export interface IRenderer {
  mount(container: HTMLElement | string): void;
  applyView(view: CanvasView): void;                                   // restyle on config/theme change
  applyData(sourceId: string, source: DataStore, flush: FlushEvent): void; // re-project a delta (targeted)
  destroy(): void;
  readonly input: { on(type: string, fn: (e: unknown) => void): () => void }; // pixi input → orchestrator
}
```

---

## 2. The substrate that already exists — `DataStore`

The renderer reacts to **this**, per source, via `applyData`. It's domain-free
(`R extends {id}` — no `node`/`edge`), the fast path (dirty sets + coalesced flush,
no immer), and owns *when* it fires (`FlushMode`). The split is built around it being
the only thing both sides share for bulk data.

```ts
import { scheduleFlush, type FlushMode } from './flush';

export interface FlushEvent { added: string[]; changed: string[]; removed: string[]; version: number; }
export interface Record_ { id: string; }

export class DataStore<R extends Record_ = Record_> {
  private readonly records = new Map<string, R>();
  private readonly added = new Set<string>();
  private readonly changed = new Set<string>();
  private readonly removed = new Set<string>();
  private readonly listeners = new Set<(e: FlushEvent) => void>();
  private version = 0;
  private scheduled = false;
  private flushMode: FlushMode = 'microtask';
  private cancel: (() => void) | undefined;

  on(event: 'flush', listener: (e: FlushEvent) => void): () => void {
    void event; this.listeners.add(listener); return () => this.listeners.delete(listener);
  }

  /** Choose WHEN a flush fires. `'manual'` disarms auto-flush (engine drives it). */
  setFlushMode(mode: FlushMode): void {
    this.flushMode = mode;
    if (mode === 'manual' && this.scheduled) { this.cancel?.(); this.scheduled = false; }
  }

  read(id: string): R | undefined { return this.records.get(id); }
  all(): R[] { return [...this.records.values()]; }
  get size(): number { return this.records.size; }

  setData(records: readonly R[]): void {
    const next = new Set(records.map((r) => r.id));
    for (const id of this.records.keys()) if (!next.has(id)) this.markRemoved(id);
    for (const r of records) this.upsert(r);
  }

  upsert(record: R): void {
    const existed = this.records.has(record.id);
    this.records.set(record.id, record);
    if (existed) { this.removed.delete(record.id); if (!this.added.has(record.id)) this.changed.add(record.id); }
    else { this.added.add(record.id); this.removed.delete(record.id); }
    this.schedule();
  }

  update(id: string, patch: Partial<R>): void {
    const cur = this.records.get(id);
    if (!cur) return;
    this.records.set(id, { ...cur, ...patch });
    if (!this.added.has(id)) this.changed.add(id);
    this.schedule();
  }

  remove(id: string): void {
    if (!this.records.has(id)) return;
    this.records.delete(id); this.markRemoved(id); this.schedule();
  }

  private markRemoved(id: string): void {
    this.records.delete(id);
    if (this.added.delete(id)) { /* added-then-removed before flush → net no-op */ } else this.removed.add(id);
    this.changed.delete(id);
  }

  private schedule(): void {
    if (this.scheduled || this.flushMode === 'manual') return;
    this.scheduled = true;
    this.cancel = scheduleFlush(this.flushMode, () => this.flush());
  }

  flush(): void {
    this.scheduled = false;
    if (this.added.size === 0 && this.changed.size === 0 && this.removed.size === 0) return;
    const event: FlushEvent = {
      added: [...this.added], changed: [...this.changed], removed: [...this.removed], version: ++this.version,
    };
    this.added.clear(); this.changed.clear(); this.removed.clear();
    for (const l of this.listeners) l(event);
  }
}
```

---

## 3. File census — every subsystem's fate (grounded)

`pixi` column = files in the subsystem that import `pixi.js`/`pixi-viewport`.

### 3.1 → `@invana/canvas-pixijs` (renderer) — the bulk of the move

| Subsystem | pixi | Why it's the renderer |
|---|---|---|
| `primitives/shapes/` (Circle, Rect, Polygon, Star, Arc, Ellipse, RegularPolygon, **Composite**, _polyUtils) | 8/9 | the shape draw library — `Graphics` geometry |
| `primitives/decorations/{shape,connector}/` (17) | 17 | drawn-alongside geometry (glow, halo, ring, label, marching-ants…) |
| `primitives/effects/{shape,connector}/` (4) | — | host modulation — travel with the renderer (sole consumer) |
| `primitives/paint/` (applyFillStroke, dashedStroke, label*, insetContentLayer) | 5 | pixi paint helpers |
| `primitives/base/` (ShapeBase, ConnectorBase, EffectBase, decoration bases…) | 3/7 | render base classes |
| `primitives/markers/`, `primitives/connectors/Connector.ts`, `primitives/PrimitivesRenderer.ts`, `primitives/types.ts` | yes | connector draw + the renderer entrypoint |
| `primitives/connectors/{pathStyles,routers,anchors}/` (24), `pathSampling`, `badges/`, `animation/`, `instancing/` | **0** | **pure geometry/math** — agnostic, but the renderer is their only consumer → travel with it (or a shared `canvas-geometry` leaf if a 2nd renderer ever needs them) |
| `textures/TextureRegistry.ts`, `fonts/loadIconFont.ts` | 1/asset | GPU textures + font assets |
| `layers/WorldLayer.ts`, `layers/ScreenLayer.ts`, `layers/BackgroundLayer.ts` | 3 | pixi `Container` roots / render bodies |
| `engine/rendererSupport.ts` | — | WebGPU/WebGL2 capability detection — a renderer concern |

### 3.2 Stays in `@invana/canvas` (orchestrator) — agnostic

| Subsystem | pixi | Role |
|---|---|---|
| `registries/` (Layer/Behaviour/Layout) | 0 | id-keyed composition — pure orchestration |
| `layouts/` (Layout base, animatePositions) | 0 | data → positions; writes `store.data[id].applyPositions` |
| `behaviours/Behaviour.ts`, `DragShapeBehaviour.ts`, `KeyboardCameraInputBehaviour.ts` | 0 | input → `store.view.update` (no pixi) |
| `hit/HitIndex.ts` (rbush) | 0 | spatial index — agnostic geometry |
| `layers/DevInfoLayer.ts`, `layers/LayersPanelLayer.ts` | 0 | overlay/DOM layers (no pixi draw) |
| `events/assertSerialisable.ts` | 0 | guard util |
| `theme/` (CanvasThemeState, types) | 0 | theme **state** → folds into `view`; helpers stay |

### 3.3 Straddlers — SPLIT across the `IRenderer` seam

These carry both an orchestration identity **and** a pixi body. Each splits:

| File | Agnostic half → `canvas` | Pixi half → `canvas-pixijs` |
|---|---|---|
| `engine/Canvas.ts` | lifecycle, registries, `update`/`get` API (re-backed by `store.view`), behaviour/layout wiring | creating the pixi `Application`, stage/world bootstrap, the rAF render loop driving `applyData` |
| `camera/Camera.ts` | abstract `{x,y,zoom}` transform + pan/zoom **commands** (already in `view.interaction.camera`) | the `pixi-viewport` binding that realises the transform |
| `context/CanvasContext.ts` | services: `store`, `events`, camera **commands**, peer registries, `self` | pixi handles (`world`/`stage` `Container`) → a renderer-side context |
| `layers/Layer.ts` (base) | identity: id, lifecycle, options, peer access, `dataLayerId` subscription | the render body (creating `Graphics`/`Container`) → behind `IRenderer.applyData` |
| `behaviours/DragPanBehaviour`, `PinchZoomBehaviour`, `WheelZoomBehaviour`, `ElementSizeLODBehaviour` | the gesture → camera **command** intent | **rewire**: they poke pixi/viewport directly today → must go through `Camera` commands / `IRenderer`, not raw pixi |

### 3.4 Deleted / relocated (state machinery — already covered by the kernel)

| File | Fate |
|---|---|
| `state/Store.ts` (`createLayerStore`, zustand+immer wrapper) | **DELETE** — superseded by the kernel `ReactiveStore` port + zustand adapter (D2) |
| `state/ColumnStore.ts`, `state/DirtyBatcher.ts` | **RELOCATE → `canvas-store/data`** (D1); the dirty-coalescing is already re-implemented inside `DataStore.flush` |
| `events/CanvasEventBus.ts`, `CanvasEvent.ts`, `EventEmitter.ts`, `SourceEmitter.ts` | **DELETE (dup)** — the kernel now owns the bus; orchestrator + renderer import `@invana/canvas-store`'s events |
| `engine/CanvasConfig.ts` (`deepMerge`, `configurable`) | **RELOCATE** patch helpers → kernel `port/patch.ts` (`applyDeepPartial`/`computeChange` already there) |

---

## 4. The unidirectional loop after the split

```
input (pixi)  ─►  canvas-pixijs.input  ─►  canvas: behaviours  ─►  store.view.update
                                            canvas: layouts     ─►  store.data[id].applyPositions
store changes ─►  store: events / flush  ─►  canvas-pixijs: applyView (config/theme)
                                            canvas-pixijs: applyData (targeted delta)
```

Producers (behaviours, layouts) live in **canvas**; the source of truth is
**canvas-store**; the projection is **canvas-pixijs**. Nothing draws except the
renderer; nothing owns state except the store.

---

## 5. The hard parts (where the work actually is)

1. **`Canvas.ts` re-back + bootstrap split.** Today it owns `config` (plain object),
   `update`/`get`, `options:change`, *and* creates the pixi `Application`. M0 backs
   `config` with `store.view` (signatures unchanged); the split then lifts the pixi
   bootstrap + rAF loop into the renderer, leaving an orchestrator that holds a
   `store` + an injected `IRenderer`. **High blast radius, no tests in the package
   (rule 10) — must stay behaviour-identical.**
2. **`Layer` base bifurcation.** Its identity is orchestration; its draw body is pixi.
   The orchestrator `Layer` keeps id/lifecycle/options/subscription; the draw moves
   behind `applyData`. Every built-in layer that *draws* (World/Screen/Background)
   becomes a renderer concern; overlay layers (DevInfo/LayersPanel) stay.
3. **Camera duality.** Abstract transform (commands, in `view.interaction.camera`)
   vs the `pixi-viewport` realisation. The 4 camera/LOD behaviours that touch the
   viewport directly must be rewired to emit **commands**, not poke pixi.
4. **`CanvasContext` split.** Drop the pixi `Container` handles from the agnostic
   context; expose them only on a renderer-side context. Consumers that reach for
   `ctx.world`/`ctx.stage` today are the ones that move to the renderer.
5. **Geometry helpers (pathStyles/routers/anchors).** Agnostic but renderer-only
   consumed — ship them with `canvas-pixijs` now; promote to a shared `canvas-geometry`
   leaf only if a 2nd renderer appears (YAGNI until then).

---

## 6. Phasing (each step green + revertible)

- **P0 — state under the API** (the `canvas-state-plan` M0): back `Canvas.config` with
  `store.view`; relocate `ColumnStore`/`DirtyBatcher` to the kernel; delete the dup
  `events/`. No package split yet. *De-risks everything below.*
- **P1 — define `IRenderer`** in `canvas-store` (types only) and make `Canvas` route
  all drawing through an internal renderer object that still lives in-package. No new
  package — just the seam, in place.
- **P2 — extract `@invana/canvas-pixijs`**: move `primitives/*`, the drawing layers,
  `Application`/viewport bootstrap, `Camera`'s pixi binding, the renderer-side context.
  `canvas` now depends on `canvas-store` only; pixi leaves it.
- **P3 — rewire the 4 camera/LOD behaviours** to commands; drop `ctx.world`/`ctx.stage`
  from the agnostic context.
- **P4 — second renderer** (optional proof): `canvas-2d` or headless, validating the
  seam.

**Gate every phase:** orchestrator imports zero pixi (lint-enforced, like the kernel's
no-zustand rule); the hot path (data flush → `applyData`) shows no added per-frame cost;
`pnpm check-types` green.

---

## 7. One-paragraph summary

Of 117 files, **~70 move to `canvas-pixijs`** (all of `primitives/*` + drawing layers +
textures/fonts + the pixi bootstrap), **~25 stay in `canvas`** (registries, layouts,
input→state behaviours, hit index, overlay layers), **~10 are deleted** (the dup
`events/`, `Store.ts`) **or relocated to the kernel** (`ColumnStore`/`DirtyBatcher`,
patch helpers), and **~6 straddlers split** across the `IRenderer` seam (`Canvas`,
`Camera`, `CanvasContext`, `Layer` base, 4 camera behaviours). The kernel's `DataStore`
(§2) is what both sides share for bulk data; `IRenderer` (§1) is what keeps `canvas`
pixi-free.
</content>
