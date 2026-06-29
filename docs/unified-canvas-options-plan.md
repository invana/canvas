# Unified `GraphCanvas` Options — Design & Implementation Plan

> Status: design, reviewed. `Canvas` stays **theme-agnostic**; the whole graph-canvas is configured by one
> declarative, spec-driven options object addressed by instance id. Theming lives **outside** and is pushed
> in as concrete patches. Config changes are observable through the standard event bus.

---

## 1. Context — why we're doing this

Today there is **no single source of truth for the canvas's visual configuration**. Style and options are
scattered across:

- `GraphLayer.options.node/edge` (node/edge templates),
- the hardcoded canonical interaction states in `packages/graph/src/layer/types.ts`
  (`DEFAULT_NODE_STATES` / `DEFAULT_EDGE_STATES` — hover `0xffffff`, selected `0xfacc15`, …),
- `MiniMapLayer` chrome options, `BackgroundLayer` options,
- per-behaviour constructor colours (lasso/brush `0x1677ff`, draw-edge `0x60a5fa`, resize `0x6b7fff`),
- dev overlays (`DevInfoLayer` / `LayersPanelLayer`).

On top of that there are **three independent "mode" engines** — `BackgroundLayer`, `MiniMapLayer`, and
`ResponsiveThemeBehaviour` — each carrying its own `mode: auto|light|dark`, its own `{light,dark}` colour pairs,
and its own `prefers-color-scheme` listener, kept in lockstep only because `useTheme` calls `setMode()` on each.

**Goal:** the canvas holds **one concrete configuration at a time** and knows nothing about themes. "It's dark now"
/ "switch to forest" is decided by **external app components** that compute concrete values and push them in via a
single `update()` entry point. Every layer/behaviour is addressable by id, configurable through one object, can
read any sibling's resolved styling through the context it already receives, and emits a scoped event when its
config changes so dependents (e.g. the minimap) stay in sync.

---

## 2. Core decisions (locked with the user)

| # | Decision |
|---|---|
| D1 | **Spec-driven instantiation.** `GraphCanvas` reads `layers` / `behaviours` from the options object and builds them. |
| D2 | **Keyed by instance id**, loosely typed. `behaviours['hover-primary']`, `layers['minimap']`. No `BehaviourOptionsRegistry` interface to augment. |
| D3 | **`type` is the constructor class itself**, referenced inline (`type: HoverActivateBehaviour`). No name→constructor registry map. Custom behaviours work with zero ceremony. |
| D4 | **No separate `style` concept.** Style is just the GraphLayer's `node`/`edge` options. A "theme" is a `Partial<GraphCanvasOptions>`. No style store, no facade. |
| D5 | **`update()` is patch-only.** Construction builds the instance set; `update()` deep-merges options into **existing** instances by id. Add/remove is explicit, not spec-diff. |
| D6 | **`enabled` never defaults to `true`.** Spec-driven instantiation still honours "every behaviour is explicitly registered AND enabled by the developer" — you write `enabled: true` per behaviour; nothing auto-enables. |
| D7 | **Theme-agnostic.** All in-engine theme machinery (`mode`, `{light,dark}`, media-query wiring, `ResponsiveThemeBehaviour`, `ThemedBackgroundLayer`, `useTheme`) is **removed**; OS-responsiveness relocates to an external example hook. |
| D8 | **Shared context + scoped events.** Layers/behaviours reach siblings through the `CanvasContext` they already receive (`ctx.layers.get(id)`), plus a generic `ctx.options` read handle; and each instance emits a scoped `style:changed` / `options:changed` event so dependents (e.g. `MiniMapLayer`) re-sync without polling. |

### Resolved open questions

- **Q1 — store package:** lives in **`@invana/graph`** with `GraphCanvas`; only a minimal generic options-store *type* goes in `@invana/canvas`.
- **Q2 — layout:** **singular** `layout`.
- **Q3 — context:** **extend the existing `CanvasContext`** with one generic `options` handle; no new `layer()/behaviour()` sugar — the existing `ctx.layers/behaviours` registries already serve sibling lookup.
- **Q4 — `update()` return:** **`void`**; read state via `get()`.
- **Q5 — canvas-react:** **thin `useGraphCanvasUpdate()` hook now**, over the existing JSX→instance path. Full JSX→spec desugaring is deferred to a later phase, *if* it earns its keep. (JSX-registered instances are still patchable by id via the same store, so the two paths don't drift on what matters.)

### Naming

- **`Canvas`** (`@invana/canvas`) — the domain-free root: pixi app, camera, registries, the `CanvasContext` handed to every layer/behaviour. The word "engine" is **not** used as an API term.
- **`GraphCanvas`** (`@invana/graph`) — the graph-domain facade that takes the spec and **composes** a `Canvas`, exposed as `graphCanvas.canvas`.

---

## 3. What the developer writes

### 3.1 Create a graph vis

```ts
import { GraphCanvas, GraphLayer, MiniMapLayer,
         HoverActivateBehaviour, ClickSelectBehaviour, LassoSelectBehaviour } from '@invana/graph';
import { BackgroundLayer } from '@invana/canvas';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';

const graph = new GraphCanvas({
  canvas: { container: document.querySelector('#app'), preference: 'webgpu', autoResize: true },

  layers: {
    background: {
      type: BackgroundLayer,              // ← the class, inline. No registry interface.
      patternType: 'grid',
      color: 0x334155,
      backgroundColor: 0x0f172a,
    },
    graph: {
      type: GraphLayer,
      // "style" is not a separate concept — it is the graph layer's options.
      node: {
        style: { bgFill: 0x1e293b, bgStrokeColor: 0x475569, labelColor: 0xe2e8f0 },
        state: { selected: { bgStrokeColor: 0x22d3ee,
                             decorations: [{ kind: 'ring', color: 0x22d3ee }] } },
      },
      edge: { style: { strokeColor: 0x475569, arrowTargetShape: 'triangle' } },
    },
    minimap: {
      type: MiniMapLayer,
      graphLayerId: 'graph',              // explicit cross-layer ref (unchanged rule)
      position: 'bottom-right',
      backgroundColor: 0x1a1a2e,
    },
  },

  behaviours: {
    hover:  { type: HoverActivateBehaviour, layerId: 'graph', enabled: true },
    select: { type: ClickSelectBehaviour,   layerId: 'graph', enabled: true, multiple: true },
    lasso:  { type: LassoSelectBehaviour,   layerId: 'graph', enabled: true,
              style: { stroke: 0x22d3ee, fill: 0x22d3ee, fillAlpha: 0.1 } },
  },

  layout: { type: D3ForceLayout, linkDistance: 80 },   // optional, singular
});

graph.layer('graph').setData({ nodes, edges });
```

`enabled: true` is written explicitly on every behaviour — nothing turns on by itself (D6).

### 3.2 Theming = an outside patch, by id

The canvas never knows "dark" / "forest". An external component holds concrete patches and pushes them:

```ts
const dark: Partial<GraphCanvasOptions> = {
  layers: {
    background: { color: 0x334155, backgroundColor: 0x0f172a },
    graph: { node: { style: { bgFill: 0x1e293b, labelColor: 0xe2e8f0 } },
             edge: { style: { strokeColor: 0x475569 } } },
    minimap: { backgroundColor: 0x1a1a2e },
  },
  behaviours: { lasso: { style: { stroke: 0x22d3ee } } },
};
const light: Partial<GraphCanvasOptions> = { /* concrete light values, same shape */ };

graph.update(prefersDark ? dark : light);   // deep-merge → patches existing instances by id
```

The minimap re-syncs automatically — it listens to the graph layer's `style:changed` event (§7.4).

### 3.3 A custom behaviour — zero ceremony

```ts
class PulseOnSelectBehaviour extends Behaviour {
  protected onRegister(ctx) { /* read ctx.layers.get('graph'), ctx.options, … */ }
}

behaviours: {
  pulse: { type: PulseOnSelectBehaviour, layerId: 'graph', enabled: true, color: 0xff5500 },
}
graph.update({ behaviours: { pulse: { color: 0x00ff88 } } });   // addressed by id
```

### 3.4 React (canvas-react) — thin hook now (Q5)

JSX keeps its current registration path; the new surface is just a hook over `update()`:

```tsx
function ThemeToggle() {
  const update = useGraphCanvasUpdate();
  useSystemTheme(update, lightPatch, darkPatch);   // OS-responsiveness, OUTSIDE the canvas
  return <button onClick={() => update(darkPatch)}>Dark</button>;
}
```

---

## 4. The options shape

```ts
import type { CanvasOptions, Layer, Behaviour } from '@invana/canvas';

// Each entry: the constructor class + its options. `enabled` is explicit, never defaulted true.
export type InstanceSpec<TClass, TOpts> = { type: TClass; enabled?: boolean } & Partial<TOpts>;

export interface GraphCanvasOptions {
  canvas?: CanvasOptions;                                 // forwarded to `new Canvas(...)` — container, preference, resolution, autoResize…
  layers?:     Record<string, InstanceSpec<new (o: any) => Layer,     any>>;   // keyed by instance id
  behaviours?: Record<string, InstanceSpec<new (o: any) => Behaviour, any>>;   // keyed by instance id
  layout?:     InstanceSpec<new (o: any) => unknown, any>;                     // singular (Q2)
}

export type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };
```

- **Concrete values only** — no tokens, no `{light,dark}`, no `mode`.
- Engine/renderer knobs reuse the existing `CanvasOptions` under `canvas` — no duplication.
- `update(patch: DeepPartial<GraphCanvasOptions>): void` — deep-merge; **structured fields** (`shape`,
  `decorations`, `state` entries) replaced wholesale, matching the shallow semantics of
  `GraphLayer.setNodeDefaults` (`packages/graph/src/layer/GraphLayer.ts:506`).
- `get(): GraphCanvasOptions`, plus the bus `options:change` event (§7.3) — observable for React.

---

## 5. The shared context (D8 / Q3)

Extend the existing `CanvasContext` (handed to every layer/behaviour per `Canvas.ts:13`,
`packages/canvas/src/context/CanvasContext.ts:22-62`) with **one** new field — a generic options read handle.
Sibling lookup uses the registries that already exist; no new `layer()/behaviour()` sugar.

```ts
// @invana/canvas — minimal generic interface so the engine doesn't import a graph type
export interface OptionsStore {
  get(): unknown;
  subscribe(fn: (s: unknown) => void): () => void;
}

interface CanvasContext {
  // …existing: layers, behaviours, camera, events, canvasElement…
  options?: OptionsStore;            // concrete GraphCanvasOptions store supplied by GraphCanvas; cast on read
}
```

**Worked example — MiniMapLayer reads the graph's resolved styling** (already the pattern at
`packages/graph/src/layer/MiniMapLayer.ts:418`):

```ts
const graph = this.ctx.layers.get(this.opts.graphLayerId) as GraphLayer;
const { bgFill, shape } = graph.resolveNodeStyle(node);   // RESOLVED colour + shape kind (existing)
```

The minimap doesn't need the raw options store for this — it reads the *resolved* style off the sibling instance.
*When* to re-read is driven by the graph layer's scoped events (§7.4).

---

## 6. How `update()` applies a patch (PUSH via a uniform `applyOptions`)

Every live-updatable layer/behaviour implements one method whose body just delegates to the setters that already
exist. `GraphCanvas.update()` deep-merges, then calls `applyOptions(slice)` on the instance with each patched id.

```ts
// @invana/canvas — generic contract
export interface Configurable<O = unknown> {
  applyOptions(patch: Partial<O>): void;
}
```

| Instance | `applyOptions(patch)` delegates to | setter status |
|---|---|---|
| `BackgroundLayer` | `this.setOptions(patch)` | exists — `BackgroundLayer.ts:205` |
| `GraphLayer` | `node.style`→`setNodeDefaults`; `edge.style`→`setEdgeDefaults`; `*.state`→`setStateConfigs` | first two exist (`:506`,`:523`); `setStateConfigs` is **NEW** (§8) |
| `MiniMapLayer` | `this.setOptions(patch)` | exists — `MiniMapLayer.ts:266` |
| `DevInfoLayer` / `LayersPanelLayer` | `this.setOptions(patch)` | exists — `:151` / `:148` |
| `LassoSelectBehaviour` / `BrushSelectBehaviour` | `this.setOptions(patch)` | exists — `:215` / `:251` |
| `DrawEdgeBehaviour` / `NodeResizeBehaviour` | `this.setStyle(patch)` | **NEW** (§8) |

Instances are resolved **lazily by id** on each `update()` (never cached) so late-mounting instances are tolerated;
unknown/absent ids no-op. The style-bearing setters emit scoped events (§7.2); `update()` also emits one coarse
`options:change` on the bus (§7.3).

---

## 7. Events

The event system is **largely unaffected**; the refactor touches it at three precise points and adds two new,
typed events. No dynamic / id-encoded event names are introduced — per-instance targeting comes from the event
**source** (the bus already stamps the emitting instance) and from **payload**, not from string-built names.

### 7.1 Instantiation events — free, no change

The registries already emit on add/register, so spec-driven construction produces the **same** event stream as
imperative/JSX:

```ts
LayerRegistry.add()          → bus.emit('layer:added', { id })          // LayerRegistry.ts:64
BehaviourRegistry.register() → bus.emit('behaviour:registered', { id }) // :53
                             → bus.emit('behaviour:enabled', { id })     // :56 (when enabled)
```

`GraphCanvas` builds via the same `layers.add()` / `behaviours.register()`. Devtools/telemetry keep working. Nothing to do.

### 7.2 NEW — scoped per-instance config events

Each live-updatable instance emits a scoped change event on its **own** `events` emitter (`SourceEmitter`). The id
is the **source** (`SourceEmitter.emit` publishes `makeCanvasEvent(this.source, …)` to the bus tap), so targeting
needs no `options:<id>:updated` dynamic key.

- **GraphLayer** — `setNodeDefaults` / `setEdgeDefaults` / `setStateConfigs` emit
  `style:changed { scope: 'node' | 'edge' | 'state' }`. **Emit at the setter level** (not only in `applyOptions`)
  so changes via `update()`, direct setter calls, *and* behaviours like `ColorByLabelBehaviour` (which writes
  `bgFill` straight to the template) all notify. Distinct from the existing `data:changed` (topology/positions).
- **Other layers/behaviours** — `applyOptions` emits `options:changed { patch }` on the instance.

Add `style:changed` to `GraphLayerEvents` (`packages/graph/src/layer/types.ts:1334`), which already carries the
`[event: string]: unknown` extension index.

### 7.3 NEW — coarse canvas-level event

`GraphCanvas.update()` emits **one** `options:change` on `canvas.events` carrying the changed ids in the *payload*
(not the name). React hooks + telemetry subscribe to this single event. Added via module augmentation of
`CanvasGlobalEvents` (the bus comment explicitly invites this — `CanvasEventBus.ts:51`):

```ts
declare module '@invana/canvas' {
  interface CanvasGlobalEvents {
    'options:change': {
      patch: DeepPartial<GraphCanvasOptions>;
      options: GraphCanvasOptions;
      changedLayerIds: readonly string[];
      changedBehaviourIds: readonly string[];
    };
  }
}
```

The store holds state (`get()`); the **bus event is the notification** — no side-channel `subscribe()`, one path.

### 7.4 Cross-layer mirroring — the MiniMap

The minimap mirrors the graph's resolved node/edge styling, so it must repaint when that styling changes. It already
holds `graphLayerId`, so it subscribes **by id** to the graph layer's scoped events (alongside its existing
`data:changed` + camera subscriptions):

```ts
// MiniMapLayer.onMount
const graph = ctx.layers.get(this.opts.graphLayerId) as GraphLayer;
graph.events.on('data:changed',  () => this.markDirty());   // topology / positions (existing)
graph.events.on('style:changed', () => this.markDirty());   // node/edge/state style template (NEW)
// camera pan/zoom → viewport indicator (existing)
```

**Coalesce repaints.** A single `update({ layers: { graph: { node, edge, states } } })` fires `style:changed` up to
3×. Route `markDirty()` through a dirty flag and repaint **once on the next frame**, never synchronously per event.
This makes the minimap track `update()`, direct setters, and behaviours (e.g. ColorByLabel) uniformly.

### 7.5 Teardown impact — harmless

`ThemedBackgroundLayer`'s `theme:switched` / `mode:updated` (`:217`, `:228`) vanish with the class — but their only
consumers are the two stories deleted alongside it (`ThemedBackgroundLayer.stories.ts`, `WithThemedBackground.stories.ts`).
`ResponsiveThemeBehaviour` never listened to them; `BackgroundLayer.setMode` / `MiniMapLayer.setMode` emit nothing.
**Interaction events are untouched** — `selection:change` (ClickSelect `:559`), `inspect:change` (ClickInspect),
`node:drag-start/end` (DragNode `:514/474`), and all renderer pointer events come from surviving behaviours/renderer.

---

## 8. New code required on existing classes

| File | Add | Notes |
|---|---|---|
| `packages/graph/src/layer/GraphLayer.ts` | `applyOptions`, `setStateConfigs({node?,edge?})`; emit `style:changed` from `setNodeDefaults`/`setEdgeDefaults`/`setStateConfigs` | No runtime state-config setter today — states merge only at construction (`:239`,`:1908`) and read per-render in `resolveNodeStyle` (`:623`). New setter mutates `nodeOption.state` / `edgeOption.state` then `redraw()` (`:472`). |
| `packages/canvas/src/layers/BackgroundLayer.ts` | `applyOptions` (→ `setOptions`) | one-liner |
| `packages/graph/src/layer/MiniMapLayer.ts` | `applyOptions` (→ `setOptions`); subscribe to graph `style:changed` in `onMount` (§7.4) | wiring for mirroring |
| `packages/canvas/src/layers/DevInfoLayer.ts`, `LayersPanelLayer.ts` | `applyOptions` (→ `setOptions`) | one-liner each |
| `packages/graph/src/behaviours/LassoSelectBehaviour.ts`, `BrushSelectBehaviour.ts` | `applyOptions` (→ `setOptions`) | one-liner each |
| `packages/graph/src/behaviours/DrawEdgeBehaviour.ts` | `setStyle` + `applyOptions` | `this.draft` private/once-assigned (`:99`); next preview repaint reads it (`:168`). |
| `packages/graph/src/behaviours/NodeResizeBehaviour.ts` | `setStyle` + `applyOptions` | `this.opts` `readonly` (`:154`); make mutable, then `refreshAllFrames()` (`:189`). |

---

## 9. Teardown — remove all in-engine theme machinery (D7)

**Delete files**

- `packages/canvas/src/layers/ThemedBackgroundLayer.ts` (+ stories `ThemedBackgroundLayer.stories.ts`, `WithThemedBackground.stories.ts`).
- `packages/graph/src/behaviours/ResponsiveThemeBehaviour.ts` and `packages/canvas-react/src/behaviours/ResponsiveThemeBehaviour.tsx`.
- `packages/canvas-react/src/hooks/useTheme.ts` (replaced in §10).

**Strip from `BackgroundLayer.ts`:** `BackgroundMode`/`BackgroundKind`, the `{light,dark}` arm of `BackgroundColor`
(→ `number | string`), `mode` option, `setMode`/`getMode`/`getResolvedKind`, media-query wiring; keep `setOptions`.

**Strip from `MiniMapLayer.ts`:** `MiniMapMode`/`MiniMapKind`, the `{light,dark}` arm of `MiniMapColor` (→ `number`),
`mode`, `setMode`/`getMode`/`getResolvedKind`, media-query wiring; keep `setOptions`.

**Index cleanups:** remove deleted exports from `packages/canvas/src/index.ts`, `packages/graph/src/index.ts`,
`packages/canvas-react/src/index.ts`.

---

## 10. React (`@invana/canvas-react`)

- `GraphCanvasContext` — holds the `GraphCanvas` instance; mirrors the existing `CanvasContext` pattern (`canvas-react/src/CanvasContext.ts:9`).
- `useGraphCanvasUpdate()` → `(patch) => void`; `useGraphCanvasOptions()` → `[options, update]` (subscribes to the `options:change` bus event, §7.3).
- `useSystemTheme(update, light, dark)` — **example hook shipped in app/story code, not the engine**: watches
  `matchMedia('(prefers-color-scheme: dark)')` and calls `update(prefersDark ? dark : light)`. Replaces every deleted
  `mode:'auto'` listener.
- JSX child→instance registration is left as-is for this cut (Q5).

---

## 11. Phasing (keep `pnpm check-types` green at every step)

1. **Additive foundation** — `Configurable`/`OptionsStore` interfaces + `options:change` augmentation (`@invana/canvas`), `setStateConfigs` + `style:changed`, the store, and `GraphCanvas` (`@invana/graph`). Nothing removed yet.
2. **Wire** existing layers/behaviours: add the one-line `applyOptions` to each (§8); subscribe the minimap to `style:changed` (§7.4).
3. **React** — `GraphCanvasContext` + `useGraphCanvasUpdate` (§10), `useSystemTheme` example.
4. **Migrate stories** to concrete colours + external patches (replace `{light,dark}`/`mode` with scalars; app shells
   swap `useTheme` + `<ResponsiveThemeBehaviour>` for `update()` + `useSystemTheme`). ~20 imperative stories + 3 app
   shells (`GraphVisualiserApp`, `GraphModeller`, `GraphVisualiser`).
5. **Teardown** (§9) — delete theme machinery **last**, after all consumers migrated, or the type-narrowing breaks
   every `{light,dark}` call site.

---

## 12. Verification

- `pnpm check-types` green after each phase.
- `pnpm --filter @canvas/storybook dev` → GraphVisualiser/GraphModeller: light/dark toggle flows through `update()`;
  OS dark-mode follow works via `useSystemTheme`; minimap chrome + node/edge colours change together.
- Patch only the graph node style via `update()` and confirm the **minimap repaints** (via `style:changed`), once per
  frame, not 3×.
- A custom behaviour referenced by inline `type:` instantiates, enables only with `enabled: true`, and is patchable by
  id via `update()`.
- Confirm spec-driven construction emits the same `layer:added` / `behaviour:enabled` stream as imperative setup.

---

## Appendix — Implementation sketch

```ts
// @invana/graph/src/canvas/GraphCanvasStore.ts
export class GraphCanvasStore {
  private state: GraphCanvasOptions;
  constructor(initial: GraphCanvasOptions) { this.state = initial; }
  get() { return this.state; }
  /** Deep-merge; returns the changed ids so GraphCanvas can fan out + emit. */
  patch(p: DeepPartial<GraphCanvasOptions>) {
    this.state = deepMerge(this.state, p);     // structured fields replaced wholesale
    return {
      layerIds: Object.keys(p.layers ?? {}),
      behaviourIds: Object.keys(p.behaviours ?? {}),
    };
  }
}
```

```ts
// @invana/graph/src/canvas/GraphCanvas.ts
import { Canvas } from '@invana/canvas';

export class GraphCanvas {
  readonly canvas: Canvas;
  private store: GraphCanvasStore;

  constructor(opts: GraphCanvasOptions) {
    this.canvas = new Canvas(opts.canvas ?? {});
    this.canvas.init();

    this.store = new GraphCanvasStore(opts);
    (this.canvas.context as any).options = { get: () => this.store.get(), subscribe: () => () => {} };

    for (const [id, { type: Ctor, ...rest }] of Object.entries(opts.layers ?? {}))
      this.canvas.layers.add(new Ctor({ id, ...rest }));          // fires 'layer:added'

    for (const [id, { type: Ctor, enabled, ...rest }] of Object.entries(opts.behaviours ?? {})) {
      const b = new Ctor({ id, ...rest });
      this.canvas.behaviours.register(b);                          // fires 'behaviour:registered'
      if (enabled) b.enable();                                     // D6 — never defaults true
    }
  }

  /** Single external entry point — deep-merge, fan-out by id, emit one coarse event. Returns void (Q4). */
  update(patch: DeepPartial<GraphCanvasOptions>): void {
    const { layerIds, behaviourIds } = this.store.patch(patch);
    for (const [id, slice] of Object.entries(patch.layers ?? {}))
      (this.canvas.layers.get(id) as any)?.applyOptions?.(slice);  // each setter emits scoped 'style:changed'/'options:changed'
    for (const [id, slice] of Object.entries(patch.behaviours ?? {}))
      (this.canvas.behaviours.get(id) as any)?.applyOptions?.(slice);
    this.canvas.events.emit('options:change', {
      patch, options: this.store.get(), changedLayerIds: layerIds, changedBehaviourIds: behaviourIds,
    });
  }

  get() { return this.store.get(); }
  layer<T extends Layer>(id: string) { return this.canvas.layers.get(id) as T | undefined; }
  behaviour<T extends Behaviour>(id: string) { return this.canvas.behaviours.get(id) as T | undefined; }
}
```

```ts
// GraphLayer — new methods; setters emit a scoped event so dependents (minimap) re-sync
applyOptions(patch: Partial<GraphLayerOptions>): void {
  if (patch.node?.style) this.setNodeDefaults(patch.node.style);          // :506 (exists)
  if (patch.edge?.style) this.setEdgeDefaults(patch.edge.style);          // :523 (exists)
  if (patch.node?.state || patch.edge?.state)
    this.setStateConfigs({ node: patch.node?.state, edge: patch.edge?.state });
}

setNodeDefaults(patch: Partial<NodeStyle>): void {
  this.nodeOption = { ...this.nodeOption, style: { ...this.nodeOption?.style, ...patch } };
  for (const n of this.store.nodes()) this.rerenderNode(n.id);
  this.events.emit('style:changed', { scope: 'node' });                  // ← NEW
}
// setEdgeDefaults → emit { scope: 'edge' };  setStateConfigs → redraw() then emit { scope: 'state' }

setStateConfigs(patch: { node?: Record<string, NodeStyle>; edge?: Record<string, EdgeStyle> }): void {
  if (patch.node) this.nodeOption = { ...this.nodeOption, state: { ...this.nodeOption?.state, ...patch.node } };
  if (patch.edge) this.edgeOption = { ...this.edgeOption, state: { ...this.edgeOption?.state, ...patch.edge } };
  this.redraw();                                                         // :472 — resolveNodeStyle reads state fresh (:623)
  this.events.emit('style:changed', { scope: 'state' });
}
```

```ts
// MiniMapLayer.onMount — mirror graph styling; coalesce repaints to once per frame
const graph = ctx.layers.get(this.opts.graphLayerId) as GraphLayer;
graph.events.on('data:changed',  () => this.markDirty());   // topology / positions (existing)
graph.events.on('style:changed', () => this.markDirty());   // style template (NEW) → repaint mirrors new resolved colours
```

```tsx
// @invana/canvas-react — thin React surface (Q5); subscribes to the bus event, not a side-channel
export function useGraphCanvasUpdate() {
  const gc = useContext(GraphCanvasContext);
  return useCallback((patch: DeepPartial<GraphCanvasOptions>) => gc.update(patch), [gc]);
}

export function useGraphCanvasOptions() {
  const gc = useContext(GraphCanvasContext);
  const [opts, setOpts] = useState(() => gc.get());
  useEffect(() => {
    const off = gc.canvas.events.on('options:change', (e) => setOpts(e.options));
    return off;
  }, [gc]);
  return [opts, useGraphCanvasUpdate()] as const;
}

// example hook — APP code, not the engine
export function useSystemTheme(update: (p: DeepPartial<GraphCanvasOptions>) => void,
                              light: DeepPartial<GraphCanvasOptions>,
                              dark:  DeepPartial<GraphCanvasOptions>) {
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const apply = () => update(mq.matches ? dark : light);
    apply(); mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [update, light, dark]);
}
```
