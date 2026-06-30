# Canvas — 3-Package Architecture (draft)

> **Status: DRAFT / EXPLORATION.** A target decomposition into **three packages** —
> `store` (state + events), `canvas` (orchestrator), `canvas-pixijs` (renderer) — with
> a single end-to-end example showing state + events + telemetry + history + rendering
> + layout updates flowing across them. `@invana/canvas-store` is **built**; the
> orchestrator + renderer split is **proposed** and gated (see Phasing). Companion to
> [`canvas-state-plan.md`](./canvas-state-plan.md).

## 1. The three packages

| Package | Owns (one verb) | Renderer-free? | Notes |
|---|---|---|---|
| **`@invana/canvas-store`** | *state + events* — "what is true / what happened" | ✅ leaf | `view` (ReactiveStore<CanvasView>) · `data` (DataStores) · `events` (bus) · telemetry · history. Also what `invana-backend` materializes for collaboration (no orchestration, no render). **Built.** |
| **`@invana/canvas`** | *orchestration* — "the conductor" | ✅ (via `IRenderer`) | `Canvas` lifecycle + registries · **behaviours** (input→state) · **layouts** (data→positions) · camera control · **binds store ↔ renderer**. Knows the renderer only through the `IRenderer` interface. |
| **`@invana/canvas-pixijs`** | *rendering* — "how it's drawn" | ❌ pixi | Implements `IRenderer`: projects store state → pixi (`ShapesRenderer`, primitives, `Application`, viewport). Pure projection — subscribes to store, draws; holds no source-of-truth state. |

```
@invana/canvas-store   (state + events; leaf; also the collab backend's peer)
   ▲ update / subscribe / tap            ▲ IRenderer (pure types live here)
   │                                      │
@invana/canvas        (orchestrator) ─────┘ drives whichever renderer is injected
   │  new Canvas({ store, renderer })
   ▼
@invana/canvas-pixijs (implements IRenderer → pixi)
```

The `IRenderer` contract is **pure types in `store`** (renderer-free), implemented by
`canvas-pixijs`, consumed by `canvas` — so the orchestrator never imports pixi and a
second renderer (`canvas-2d`, `canvas-webgpu`) is a drop-in.

```ts
// @invana/canvas-store — the renderer contract (types only)
export interface IRenderer {
  mount(container: HTMLElement | string): void;
  /** Restyle when view config changes (layers/behaviours options, theme). */
  applyView(view: CanvasView): void;
  /** Re-project a data delta (added/changed/removed + new positions) — targeted. */
  applyData(sourceId: string, source: DataStore, flush: FlushEvent): void;
  destroy(): void;
  /** Pointer/input the renderer produces, fed back to the orchestrator. */
  readonly input: { on(type: string, fn: (e: unknown) => void): () => void };
}
```

## 2. The unidirectional loop

```
input (pixi) ─► canvas: behaviours ─► store.update ─► store: events fire ─► canvas-pixijs: applyView/applyData
               canvas: layouts     ─► store.data (positions) ─► flush  ─► canvas-pixijs: applyData (targeted)
```

Producers (behaviours, layouts) live in **canvas**; the source of truth is **store**;
the projection is **canvas-pixijs**. Nothing draws except the renderer; nothing owns
state except store.

## 3. End-to-end example — every concern in one flow

A 3-node graph: load data → configure view → run a layout → render → interact →
telemetry → undo. (`store` is real today; `Canvas`/`PixiRenderer` are the proposed
orchestrator/renderer.)

```ts
import { createCanvasStore, createHistory, type TelemetryEvent } from '@invana/canvas-store';
import { Canvas } from '@invana/canvas';            // orchestrator (proposed)
import { PixiRenderer } from '@invana/canvas-pixijs'; // renderer (proposed)

// ── 1. CORE — single source of truth: state + events (renderer-free) ──────────
const sink = { emit: (e: TelemetryEvent) => console.log('[otel]', e.action, e.changedPaths) };
const store = createCanvasStore({ telemetry: sink });   // telemetry tap on the view store
const history = createHistory(store.view);             // undo/redo over the same store

// ── 2. RENDERER + ORCHESTRATOR — pixi draws; canvas conducts ─────────────────
const renderer = new PixiRenderer();                  // implements IRenderer; holds no truth
const canvas = new Canvas({ store, renderer, container: '#app' });
//   Canvas internally: renderer.mount('#app'); binds store → renderer
//   (store.view.subscribe → renderer.applyView; store.data flush → renderer.applyData);
//   routes pixi pointer input → store.events; owns the layout + behaviour runtimes.

// ── 3. STATE · data write (→ store.data, typed-array path; NOT the reactive store) ─
store.source('graph').setData([
  { id: 'a' }, { id: 'b' }, { id: 'c' },
]);
store.source('edges').setData([
  { id: 'e1', source: 'a', target: 'b' }, { id: 'e2', source: 'b', target: 'c' },
]);
//   → one coalesced `flush` per frame → renderer.applyData draws 3 nodes (no positions yet)

// ── 4. STATE · view write (→ reactive store; telemetry + bus fire) ───────────
store.view.update((s) => {
  s.definition.layers.graph = { type: 'graph', source: 'graph', node: { shape: 'circle', radius: 8 } };
  s.definition.layouts.force = { type: 'force', source: 'graph', charge: -160 };
  s.definition.activeLayout = 'force';
}, 'scene:init');
//   → store.view emits 'state:change' on the bus
//   → telemetry sink logs { action: 'scene:init', changedPaths: ['definition'] }
//   → renderer.applyView restyles; Canvas sees activeLayout → runs the layout (step 5)

// ── 5. LAYOUT UPDATE · orchestrator runs the layout → positions into store.data ─
//   Canvas' layout runtime (renderer-free): reads store.source('graph'), computes x/y,
//   BULK-writes them back to the data store (typed-array, silent), one frame flush.
//   Equivalent explicit call: canvas.runLayout('force'); (auto-runs here on activeLayout)

// ── 6. RENDERING · pure projection — no draw calls in user code ──────────────
//   store.source('graph').on('flush', …) → PixiRenderer.applyData repositions ONLY moved nodes
//   store.view.subscribe(…)              → PixiRenderer.applyView restyles on config change
//   Rendering is a projection of store; the engine never imperatively repaints.

// ── 7. EVENTS · one tap sees the whole loop ──────────────────────────────────
store.events.tap((e) => console.log('[event]', e.type, e.source.kind));
//   logs: state:change(store) · pointer:move(canvas) · flush(data) · …  — telemetry/collab read here

// ── 8. INTERACTION · input → state → render (highlight a node's neighbours) ──
canvas.behaviours.enable('hover');   // a behaviour: pixi pointer → store.view.update(interaction)
//   hover over 'b' → Canvas writes store.view.interaction.focus = { ids: ['b','a','c'], dim: true }
//   → renderer projects the highlight (others dimmed) — O(focus) write, layer-level dim (no O(N) repaint)

// ── 9. TELEMETRY + HISTORY · both fall out of the one update seam ────────────
store.view.update((s) => { s.definition.layouts.force.charge = -400; }, 'force.tune');
//   → sink logs { action: 'force.tune', changedPaths: ['definition'] }; layout re-runs → renderer repositions
history.undo();   // charge → -160 (inverse patch) → layout re-runs → renderer repositions
history.redo();   // charge → -400 again
```

### How each concern flows (the same example, by concern)

| Concern | Where it happens | In the example |
|---|---|---|
| **State — view** | `store.view.update(recipe, action)` (reactive, immer, declarative patch) | steps 4, 9 |
| **State — data** | `store.source(id).setData / addNode` (typed-array, coarse flush) | step 3, and layout in 5 |
| **Events** | `store.events` bus + `tap`; `view` changes bridged as `state:change`; renderer/pointer events too | step 7 |
| **Telemetry** | `withTelemetry`/sink on `store.view` — one event per `update(action)`; the patch *is* the diff | steps 4, 9 (`[otel]` logs) |
| **History** | `createHistory(store.view)` — inverse patches from `produceWithPatches`; a `batch` = one step | step 9 (`undo`/`redo`) |
| **Rendering** | `canvas-pixijs` subscribes store → `applyView`/`applyData`; **targeted** (delta only) | step 6 |
| **Layout updates** | `canvas` layout runtime reads `store.data` → computes positions → **bulk-writes back** → flush → render | step 5 |

The point: **state, events, telemetry, history all hang off `store`'s one `update`
seam + bus**; **layouts are producers in `canvas`** that write positions into `store.data`;
**`canvas-pixijs` only ever reads** and draws. Swap the renderer → only box 3 changes.

## 4. Phasing (don't build the split speculatively)

```
Phase 1 (DONE)   @invana/canvas-store — state + events + telemetry + history (leaf, 33 tests).
Phase 2          @invana/canvas CONSUMES store (the M0–M2 migration); still renders via pixi inline.
                 → delivers all state/events/telemetry/collab value; IRenderer NOT yet needed.
Phase 3 (split)  ONLY when renderer-independence OR the headless backend peer is committed:
                 define IRenderer (in store) → extract pixi into @invana/canvas-pixijs →
                 @invana/canvas becomes the renderer-agnostic orchestrator (keeps its name).
```

Cost gate: **the `IRenderer` abstraction is the expensive, load-bearing work** (today
`canvas` has no abstract renderer — Layers/primitives *are* pixi). Pay it at Phase 3,
when a second renderer or the backend peer makes it concrete — not before.

## 5. Open questions

1. **Layer decomposition** — a `GraphLayer` splits: config → `store` (`view.definition.layers`),
   draw → `canvas-pixijs`, registration/binding → `canvas`. Confirm this is clean per layer
   type (the main over-complication risk).
2. **Camera** — abstract `{x,y,zoom}` → store; pan/zoom behaviours → canvas; the viewport that
   applies it → pixijs. Same 3-way split.
3. **`store` vs `canvas` boundary** — keep state/events (`store`) separate from orchestration
   (`canvas`) (recommended — the backend peer needs `store` alone), vs merge into one kernel.
4. **`IRenderer` granularity** — `applyView`/`applyData` (coarse) vs a richer per-primitive
   command API; and how pointer input flows back (renderer `input` channel vs the engine
   wiring pixi events straight onto `store.events`).
5. **Package naming** — `@invana/canvas-pixijs` vs `@invana/canvas-renderer-pixi`; whether
   `store` ever reclaims the `canvas` name.

## 6. Relationship to other docs

- [canvas-state-plan.md](./canvas-state-plan.md) — the store's state model, developer API, migration.
- [graph-canvas-apps-plan.md](./graph-canvas-apps-plan.md) — the app shell sitting above all three.
- [collaborative-state-plan.md](./collaborative-state-plan.md) — why `store` is a standalone leaf (backend peer).
</content>
