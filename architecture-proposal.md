# Architecture Proposal — Layers, Behaviours, Layouts

**Status:** Draft. Captures the mental model agreed during design discussion. Not yet implemented.
**Scope:** Target architecture for `@invana/canvas` and the `@invana/graph` family of packages.
**Predecessors:** [graph-plan.md](graph-plan.md), [refactor-shape-boundary.md](refactor-shape-boundary.md).

---

## 1. What this architecture is solving for

The current `Plugin` concept is doing too many jobs. A single interface covers things that:

- render content with their own data (`GraphDataPlugin`, `MiniMapPlugin`, `BackgroundPlugin`) and the renderer they sit on (`ShapesPlugin`)
- mutate data without rendering (`D3ForceLayoutPlugin`, `ElkLayoutPlugin`)
- respond to user input (`HoverActivatePlugin`, `ClickSelectPlugin`, `LassoSelectPlugin`, `BrushSelectPlugin` — all becoming `*Behaviour` classes)
- hook into lifecycle without doing either (`LabelResolutionPlugin` — turns out it's a layer policy, not a plugin)

These have genuinely different lifecycles, defaults, and conflict semantics. Lumping them together produces awkward defaults (should `enabled` start true or false?), no way to express mutual exclusion (lasso vs. pan both want `shift+drag`), and no clear teaching story for new contributors.

The proposal collapses this into **three concepts**, each with one job.

---

## 2. Core concepts

| Concept | Owns | Job | Examples |
|---|---|---|---|
| **Layer** | data + options + state + events + visible output + z-order | render | `GraphLayer`, `BackgroundLayer`, `MiniMapLayer`, `DevInfoLayer` |
| **Behaviour** | input subscriptions | input → mutate a layer's state | `HoverActivate`, `ClickSelect`, `LassoSelect`, `Pan`, `DragMove`, `CameraInput` |
| **Layout** | a position-projection function | data → positions | `D3ForceLayout`, `ElkLayout` |

Each has a base interface and registers with its own canvas-level system. Three concepts, three registries, no overlap.

#### Renderers — the primitive drawing API under Layers

A fourth concept exists, but only as a **building block** used internally by Layers — not a user-facing registration:

| Concept | Owns | User-facing? |
|---|---|---|
| **Renderer** | how to draw a class of things (shapes + connectors, tile pyramids, raster images) | no — used *by* Layers, never added to `canvas.layers` |

`ShapesRenderer` is a **fully generic, opinion-free drawing API** for shapes and connectors. It knows about pixels, hit-testing, and a camera. It knows nothing about data, semantics, interactions, LOD policy, or label policy. It's told what to draw, and draws it. Its events are raw, DOM-level, hit-tested — no domain meaning.

`GraphLayer` composes `ShapesRenderer` internally and supplies all the policy: which nodes/edges become which shapes/connectors, what LOD thresholds apply, when to bump label resolution, what hover/selection look like. A `ERDiagramLayer`, `FlowchartLayer`, or `SwimlaneLayer` would do the same — each adds its own data model, event vocabulary, state shape, and policy on top of the same renderer.

Because the renderer carries no domain knowledge, it's reusable across diagram types:

| Layer | Renderer it uses | Domain |
|---|---|---|
| `GraphLayer` | `ShapesRenderer` | nodes + edges with traversal |
| `ERDiagramLayer` (future) | `ShapesRenderer` | tables (header + column rows) + relationships |
| `FlowchartLayer` (future) | `ShapesRenderer` | steps, decisions, transitions |
| `SwimlaneLayer` (future) | `ShapesRenderer` | lanes + activities |
| `MapTilesLayer` (future) | a different tile renderer | map tile pyramids |

The boundary is sharp:
- A **Renderer** has no application-level data semantics. It's a primitive — drawing + hit-testing + raw events.
- A **Layer** has data + state + events + policy that mean something to the user. It drives the renderer.

Users add Layers. Renderers are tools Layer authors use.

### 2.1 Layer

A Layer is the unit of rendered output. **Its `state` is the single source of truth** — for data, interaction, and presentation runtime values. Everything the renderer draws is a *projection* of state, batched per frame. The Layer also owns its options (immutable config separate from runtime state), its events, its visibility, and its z-order. The canvas composites Layers in z-order.

```ts
abstract class Layer<TOptions = unknown, TState extends object = object> {
  readonly id: string;
  readonly options: TOptions;       // immutable config — how to render
  readonly state: Store<TState>;    // single source of truth — data + runtime state
  readonly events: EventEmitter;    // layer-scoped events
  visible: boolean;
  hittable: boolean;                // false → skipped during hit-test (default true)
  zIndex: number;

  mount(ctx: CanvasContext): void;
  unmount(): void;
  render(): void;                   // RAF-driven projection of state → renderer
}

abstract class WorldLayer<TData, TOptions, TState> extends Layer<TData, TOptions, TState> {
  hitTest(worldX: number, worldY: number): unknown | null;   // takes world coords
}

abstract class ScreenLayer<TData, TOptions, TState> extends Layer<TData, TOptions, TState> {
  hitTest(screenX: number, screenY: number): unknown | null; // takes screen coords
}
```

Concrete layers extend one or the other:

| Class | Base | Coords | Affected by camera? |
|---|---|---|---|
| `GraphLayer` | `WorldLayer` | world | yes |
| `BackgroundLayer`, `ThemedBackgroundLayer` | `WorldLayer` | world | yes (or fixed via `followCamera`) |
| `MiniMapLayer` | `ScreenLayer` | screen | no — fixed to viewport |
| `DevInfoLayer` | `ScreenLayer` | screen | no — fixed to viewport |

The two base classes mount onto different internal surface stacks (world container vs. screen container). The `hitTest` signatures differ so consumers can't accidentally pass world coords to a screen layer or vice versa — the type system catches it.

Every Layer has a `state` (the source of truth) and `events` (its semantic event bus). Even a "non-interactive" layer like `BackgroundLayer` has minimal state — its options-driven settings still live in state if they're observable, otherwise plain options suffice.

#### Options vs. state vs. data — bifurcated source of truth

Three fields, deliberately distinct:

| Field | Purpose | Mutated by | Backing | Notes |
|---|---|---|---|---|
| `options` | construction-time, mostly-immutable config — defaults, fixed style choices, layer ids it depends on | constructor; rare `setOptions()` | plain object | not observable; not in state |
| `state` | **UI / interaction / decoration intent** — hover, selection, drag, decoration overrides, view modes | `Layer.*` API, behaviours | `zustand + immer` | small, observable, time-travel-able, telemetry-tapped |
| `data` | **bulk hot data** — node/edge attributes, positions, large per-instance fields | `Layer.update*` API, layouts, external feeds | `ColumnStore` (typed-array columns + id↔slot index, version-bumped) | huge (up to millions of items), high-frequency mutations (1000s/sec), not deeply immutable |

The `data` slice exists separately from `state` because immutable Maps + immer don't scale: cloning a 500k-entry Map per mutation costs tens of milliseconds. A typed-array column store mutates in place at ~10 ns per write, holds millions of items in tens of MB instead of hundreds, and supports bulk writes in single-digit milliseconds for entire feeds.

Together, `state` and `data` are **the single source of truth for the layer**. The split is an implementation choice (small + observable vs. large + fast), not a semantic one — both are read by `flush()` to project to the renderer; both feed the same `DirtyBatcher` buckets.

A `GraphLayer`'s shape:

```ts
type GraphLayerState = {
  // interaction state — small, observable, immer-friendly
  hoveredId: string | null;
  hoveredNeighbours: ReadonlySet<string>;
  selectedIds: ReadonlySet<string>;        // even at 500k nodes, selection is rarely > a few k
  draggingId: string | null;

  // decoration intent — what should be decorated, not how it's drawn
  haloIds: ReadonlySet<string>;
  pulsedIds: ReadonlySet<string>;
};

// Data lives in a separate, typed-array-backed store. The Layer holds it as `data`.
class GraphNodeStore extends ColumnStore<{
  x: 'f32'; y: 'f32';
  color: 'u32'; size: 'f32';
  typeId: 'u16';
}> { /* implemented in @invana/graph */ }

class GraphLayer extends WorldLayer<GraphOptions, GraphLayerState> {
  readonly data: { nodes: GraphNodeStore; edges: GraphEdgeStore };
  // Layer.state inherited from base — zustand+immer
}
```

This replaces today's module-scoped [HoverStore](packages/plugins-graph-data/src/state/HoverStore.ts) and [SelectionStore](packages/plugins-graph-data/src/state/SelectionStore.ts), and also subsumes the data-management role of `GraphDataPlugin`.

#### `ColumnStore` — the hot-data primitive

Lives in `@invana/canvas` as a base class. Domain packages extend it to declare typed-array columns by name + numeric type (`'f32' | 'f64' | 'u8' | 'u16' | 'u32' | 'i8' | 'i16' | 'i32'`). The base class handles:

- **id ↔ slot index** via `Map<string, number>` (the only object-keyed lookup in the hot path)
- **growable column buffers** — capacity doubles on overflow; `TypedArray` reuses underlying ArrayBuffer where possible
- **slot recycling** — removed-id slots reused on next add
- **bulk operations** — `addBulk`, `setColumnBulk` for feed-style writes
- **version bumping** + per-bucket DirtyBatcher integration
- **subscription** via `subscribe(listener)` — handed a `DataDelta` (added / removed / changed buckets), not a full state diff

```ts
const nodes = new GraphNodeStore({ initialCapacity: 1024 });
nodes.add('n-42', { x: 100, y: 50, color: 0x3b82f6, size: 8, typeId: 0 });
nodes.setX('n-42', 120);                    // O(1) — typed-array write
nodes.subscribe(delta => /* … */);          // fired per Canvas tick after layer.flush()
```

Performance characteristics at 500k nodes:
- Per-mutation cost: ~10–100 ns (vs. ~5–50 ms with immer + Map)
- Bulk update of 500k items: single-digit ms (memcpy-style typed-array writes)
- Memory footprint: ~10–20 MB (vs. ~150–250 MB with Map of objects)
- Subscriber notification cost: O(changed) via DirtyBatcher — same as `state` slice

#### When to use `state` vs. `data`

Field belongs in **`state`** if:
- It's read by UI panels, inspectors, devtools timelines
- It changes at user-input rate (clicks, keystrokes, drags)
- It's a `Set<id>` representing "which ids are selected/highlighted/etc." with cardinality typically < a few k
- Devtools / time-travel value matters

Field belongs in **`data`** if:
- It's the substrate the renderer reads directly — coordinates, attributes, weights
- It changes at machine rate (feeds, layouts, simulations)
- It's per-instance for potentially millions of items
- A typed-array column would naturally hold it

#### Render projection — state to pixels

The renderer is a **projection of state**, not a parallel system. The Layer's job is to translate state changes into renderer commands, **batched per frame** for performance:

```
state mutation (any source — Layer API, behaviour, upstream feed)
    ↓ machine cadence (1000+/sec OK)
zustand commits, fires subscribers
    ↓
Layer's mutation site marks affected ids dirty in its DirtyBatcher (O(1))
    ↓
next Canvas tick (~16ms cadence — Canvas owns the single requestAnimationFrame)
    ↓
Canvas walks layers in z-order; each layer with `batcher.hasPending()` runs flush()
    ↓
flush() drains the dirty snapshot → renderer.updateShape(id) for each
    ↓
Canvas calls surfaces.render() once → PixiJS paints only changed objects
```

**Canvas owns the tick.** There is exactly one `requestAnimationFrame` in the system, driven by `Canvas`. Layers do not schedule their own RAFs — they just mark dirty and answer `hasPending()` when asked. This gives deterministic z-order render, a single point for frame-budgeting and instrumentation, and an explicit pixi commit point. The `DirtyBatcher` is therefore a pure data structure (mark / hasPending / flush / reset), with no internal RAF and nothing to cancel on unmount.

Two key properties:

- **Mutations are O(1).** A `setState` call + add to a Set in the layer's `DirtyBatcher`. No RAF scheduling at the mutation site.
- **Renders are bounded.** At most one render pass per frame regardless of mutation rate. 1000 mutations in one frame collapse to one batched render touching exactly the changed shapes.

Public Layer methods that mutate the appropriate slice (state for interaction, data for hot fields) and mark dirty themselves:

```ts
// Hot-path data mutation — typed-array column write, no immer, O(1)
updateNodePosition(id: string, x: number, y: number): void {
  this.data.nodes.setX(id, x);
  this.data.nodes.setY(id, y);
  this.dirty.mark('shape', id);
}

// Interaction state — small, immer-friendly slice
selectNode(id: string): void {
  this.state.setState(s => { s.selectedIds = new Set([...s.selectedIds, id]); });
  this.dirty.mark('halo', id);
}
```

External mutators (behaviours, upstream feeds calling `state.setState` or `data.set*` directly) are covered by a state subscriber and a data subscriber that both call `dirty.mark(...)`. Same flush path. The next Canvas tick picks it up.

This model gives:
- **One mental model.** Change state → things update.
- **Devtools see everything** (data + interactions + selection in one timeline).
- **Time-travel works for the whole layer.**
- **Telemetry tap sees every meaningful change.**
- **No two-pipeline disconnect.** Behaviours and data-feeds use the same mutation API.

#### Events

Layer-specific events live on the layer; canvas-wide events stay on `canvas.events`:

```ts
canvas.events.on('camera:zoom', ...)             // canvas-wide
canvas.events.on('layer:added', ({ id }) => ...) // canvas-wide
graphLayer.events.on('shape:click', ...)         // this graph's clicks
graphLayer.events.on('selection:changed', ...)   // this graph's selection
graphLayer.state.subscribe(s => ...)             // this graph's full state
```

Layer events do **not** bubble to `canvas.events` automatically. If a consumer needs both layers' click events, they subscribe to both. Bubbling can be added later if real use cases demand it.

#### Composition

Layers are how a user composes a scene:

```ts
canvas.layers.add(new BackgroundLayer({ pattern: 'dots' }));
canvas.layers.add(new GraphLayer({ initialData: { nodes, edges }, options: {...} }));
canvas.layers.add(new MiniMapLayer({ sourceLayerId: 'graph' }));
```

**Default `visible: true`.** Adding a Layer means you want to see it.

#### Context after mount

A Layer holds a reference to the shared `CanvasContext` (see §2.4) after `mount()`, so it can read peers' data, subscribe to other layers' events, and access the camera:

```ts
class MiniMapLayer extends ScreenLayer<MiniMapData, MiniMapOptions> {
  mount(ctx: CanvasContext) {
    super.mount(ctx);
    const source = ctx.layers.get<GraphLayer>(this.options.sourceLayerId);
    source.events.on('data:changed', () => this.refresh());
    source.state.subscribe(s => this.highlightSelection(s.selectedIds));
  }

  unmount() {
    // ctx is cleared by the base class; subscriptions registered against
    // peers must be unwound here.
    super.unmount();
  }
}
```

Cross-layer dependencies must be **declared explicitly** in the dependent layer's options (e.g. `sourceLayerId`). Don't infer ("find the only graph layer") and don't reach by type alone — explicit ids make multi-layer scenes work without ambiguity and surface missing dependencies as clear errors at mount time.

### 2.2 Behaviour

A Behaviour subscribes to input and mutates a layer's state (or the canvas's, in the case of camera-level behaviours). It does not own rendering output (the lasso polygon and brush rectangle are transient overlays the behaviour creates internally — implementation detail, not user-visible state).

```ts
interface Behaviour {
  readonly id: string;
  readonly enabled: boolean;
  readonly shortcuts?: readonly string[];
  readonly scope: 'layer' | 'canvas';   // does this target a layer, or the canvas itself?

  register(ctx: BehaviourContext): void;
  destroy(): void;
  enable(): void;
  disable(): void;
}
```

Layer-scoped behaviours take an explicit `layerId`:

```ts
canvas.behaviours.register(new HoverActivateBehaviour({ layerId: 'graph-data', enabled: true }));
canvas.behaviours.register(new ClickSelectBehaviour({ layerId: 'graph-data', enabled: true }));
canvas.behaviours.register(new LassoSelectBehaviour({ layerId: 'graph-data' }));   // disabled by default
canvas.behaviours.register(new PanBehaviour());                                    // canvas-scoped, disabled

// elsewhere, in a UI handler
canvas.behaviours.setEnabled('lasso-select', true);
canvas.behaviours.setEnabled('pan', false);
```

Inside a layer-scoped behaviour, the target layer is fetched once at register time and its state is mutated directly:

```ts
class HoverActivateBehaviour implements Behaviour {
  readonly scope = 'layer';
  register(ctx: CanvasContext) {
    const layer = ctx.layers.get<GraphLayer>(this.layerId);
    layer.events.on('shape:pointerover', ({ id }) => {
      layer.state.set(s => ({ ...s, hoveredId: id }));
    });
  }
}
```

**Default `enabled: false`.** Registration wires a behaviour up; the developer explicitly enables it. Matches the existing rule that no input behaviour is auto-active.

`enable()` and `disable()` are **required**, not optional. A behaviour that can't be toggled isn't a behaviour.

`shortcuts` is advisory metadata used for conflict warnings:

```
[canvas] Behaviour "lasso-select" claims gesture "shift+drag" already used by enabled behaviour "pan".
        Disable one before enabling the other.
```

The warning fires only when both behaviours are enabled simultaneously. Two behaviours sharing a gesture where one is disabled is the normal tool-switching case.

### 2.3 Layout

A Layout is a function from data to positions. It does not register with the canvas. It does not render. It does not subscribe to input. You instantiate it and call it against a layer.

```ts
interface Layout<TLayer extends Layer = Layer> {
  apply(layer: TLayer): Promise<void>;
}
```

```ts
const layout = new D3ForceLayout({ charge: -300 });
await layout.apply(graphLayer);

const elk = new ElkLayout({ algorithm: 'layered' });
await elk.apply(graphLayer);
```

A Layout reads `layer.data`, computes positions, writes them back. Done. Whether two layouts conflict is a domain concern (don't apply two layouts to the same data) — not something the framework needs to enforce.

A Layout that needs canvas-level information (camera bounds, peer-layer state) reads it through the layer's context:

```ts
class D3ForceLayout {
  async apply(layer: GraphLayer) {
    const bounds = layer.context.camera.getVisibleBounds();
    // … clamp positions to the visible area, etc.
  }
}
```

### 2.4 CanvasContext

A single context object is shared by Layers, Behaviours, and Layouts. There is no separate `LayerContext` / `BehaviourContext` / `LayoutContext` — the same shape gives every participant the same access surface.

```ts
interface CanvasContext {
  layers: LayerRegistry;           // get<T>(id), list(), add(), remove()
  behaviours: BehaviourRegistry;   // get<T>(id), list(), register(), setEnabled()
  camera: CameraAPI;               // pan, zoom, fitContent, toWorld, toScreen
  events: CanvasEventBus;          // canvas-wide events + telemetry tap (see §2.5)
  surfaces: SurfaceManager;        // low-level pixi Container creation (was LayerManager)
}
```

- A **Layer** receives `ctx` at `mount()` and stores it for its lifetime on the canvas.
- A **Behaviour** receives `ctx` at `register()` and stores it.
- A **Layout** has no lifecycle on the canvas, so it gets `ctx` indirectly via the layer it operates on (`layer.context`).

The shared shape means: a behaviour can read another layer, a layer can read another layer, a layout can read another layer or the camera. Cross-cutting access without three parallel context types.

### 2.5 Events & telemetry

Two-channel design: **typed event bus** for application code, **single tap** for telemetry/observability.

#### Typed events for app code

Subscribers get clean payloads on the emitter they care about. Same as today's emitter shape — no envelope:

```ts
canvas.events.on('camera:zoom', ({ scale, center }) => { /* … */ });
graphLayer.events.on('shape:click', ({ id, originalEvent }) => { /* … */ });
graphLayer.state.subscribe(s => updateInspector(s.selectedIds));
```

Layer events do **not** bubble to `canvas.events`. App code subscribes to the source it cares about; no global event spam.

#### Telemetry tap

Every emitter (canvas, layer, behaviour) automatically forwards a structured envelope to a canvas-level tap. Telemetry sinks register once and see everything in the system:

```ts
canvas.events.tap(event => sendToDatadog(event));
canvas.events.tap(event => activityLog.push(event));
```

Envelope shape:

```ts
interface CanvasEvent<TPayload = unknown> {
  type: string;                                                                 // 'layer:graph:shape:click'
  timestamp: number;                                                            // performance.now()
  source: { kind: 'layer' | 'behaviour' | 'layout' | 'canvas'; id: string };
  payload: TPayload;
}
```

The `type` string follows a `<source-kind>:<source-id>:<event-name>` convention so a tap subscriber can filter without inspecting `source`:

```
canvas:camera:zoom
layer:graph:shape:click
layer:graph:selection:changed
behaviour:lasso-select:enabled
behaviour:lasso-select:disabled
```

#### Sampling and high-frequency events

The tap excludes high-frequency noise by default. Consumers opt back in if they want it:

```ts
// default exclude list, applied unless overridden:
const DEFAULT_TAP_EXCLUDE = [
  'pointermove',
  'render:tick',
  'shape:pointermove',
  'connector:pointermove',
  'state:dirty-flush',
];

canvas.events.tap(event => sendToTelemetry(event), {
  exclude: ['canvas:render:tick'],   // explicit override of defaults
  sampleRate: 0.1,                   // 10% of remaining events
});

canvas.events.tap(event => debugLog.push(event), { exclude: [] });   // see everything
```

If profiling later shows the envelope-allocation cost is meaningful even after exclusion, the implementation pools envelope objects internally — no API change. A final fallback (gating the tap behind a production build flag) stays available but unused unless real measurement justifies it.

#### Why tap, not bubbling

| Aspect | Tap | Bubbling |
|---|---|---|
| App-level subscriptions | Clean — only what you ask for | Noisy — every layer's events show up at canvas |
| Telemetry hookup | One line, sees everything | Must enumerate all emitters |
| Sampling/filtering | At the tap, one place | Has to live at every subscriber |
| Payload shape | Plain payload (subscribers) + envelope (tap) | One shape for both audiences — compromise |

#### Serialisability discipline

Once the tap is advertised as telemetry-ready, payloads must be serialisable. No PixiJS objects, DOM nodes, function refs, or rich classes inside payloads — only ids, numbers, strings, plain objects, arrays, `Map`/`Set` of allowed types.

A dev-mode runtime check enforces it: every emitted event's payload is walked against the whitelist; violations log a warning with the offending path. The walker is stripped at build time for production:

```ts
function assertSerialisable(value: unknown, path = ''): void {
  if (value === null || value === undefined) return;
  const t = typeof value;
  if (t === 'string' || t === 'number' || t === 'boolean') return;
  if (t === 'function') return warn(path, 'function ref');
  if (Array.isArray(value)) return value.forEach((v, i) => assertSerialisable(v, `${path}[${i}]`));
  if (value instanceof Map || value instanceof Set) {
    return [...value].forEach((v, i) => assertSerialisable(v, `${path}[${i}]`));
  }
  if ((value as object).constructor !== Object) return warn(path, (value as object).constructor.name);
  for (const [k, v] of Object.entries(value as object)) assertSerialisable(v, path ? `${path}.${k}` : k);
}
```

Example warning at runtime:

```
[canvas] emit('node:click').payload.node — got BaseShape, expected plain data
```

The walker runs only when `process.env.NODE_ENV !== 'production'` (or the equivalent build-time flag); a tree-shaker eliminates it from production bundles.

### 2.6 Renderer / Layer / Behaviour boundaries

The split between Renderer, Layer, and Behaviour is the most load-bearing call in the architecture. Getting it sharp keeps everything else simple.

#### Responsibility split

| Concern | Renderer | Layer | Behaviour |
|---|---|---|---|
| Drawing pixels | ✓ | projects state → renderer per RAF | — |
| Hit-testing | ✓ | — | — |
| Camera-aware coords | ✓ | — | — |
| Raw pointer events (`shape:pointerover`, `shape:click`, …) | emits | translates | — |
| **Source of truth** (data + interaction state) | — | **owns (`state` field)** | mutates |
| Domain events (`node:click`, `selection:changed`) | — | emits | subscribes |
| LOD policy (when to switch detail) | offers `setLODLevel(id, level)` | decides (in state) + projects | — |
| Label/texture resolution policy | offers `rasteriseLabel(id, res)` | decides (in state) + projects | — |
| Visual decorations (halo, border, glow, marching-ants, pulse, …) | offers `setDecoration(id, slot, spec)` + decoration registry + per-frame `tickAnimations()` | decides (in state) + projects | — |
| Hover/select/drag detection | — | — | ✓ |
| Modifier keys, drag thresholds, multi-click | — | — | ✓ |
| Per-frame batching (RAF) | — | ✓ | — |
| Behaviour registration | — | optionally registers its own | — |

Read the table column-by-column:
- **Renderer** is a primitive. Pixels in, hit-tests out, raw events. No policy.
- **Layer** is the brain *and* the source of truth. State mutations come from anywhere (its own API, behaviours, external feeds); the Layer projects state to the renderer per frame.
- **Behaviour** is a translator from input to state mutations. No rendering, no source of truth.

#### `ShapesRenderer` API surface (sketch)

```ts
class ShapesRenderer {
  // ─── primitive registries — extended by domain packages ───
  registerShape(kind: string, ctor: ShapeCtor): void;
  registerConnector(kind: string, ctor: ConnectorCtor): void;
  registerMarker(kind: string, ctor: MarkerCtor): void;
  registerRouter(kind: string, ctor: RouterCtor): void;
  registerDecoration(kind: string, ctor: DecorationCtor,
                     opts: { target: 'shape' | 'connector' | 'both' }): void;

  // ─── mutation ───
  addShape(id: string, spec: BaseShapeSpec): void;
  updateShape(id: string, partial: Partial<BaseShapeSpec>): void;
  removeShape(id: string): void;
  addConnector(id: string, spec: BaseConnectorSpec): void;
  updateConnector(id: string, partial: Partial<BaseConnectorSpec>): void;
  removeConnector(id: string): void;

  // ─── visual decoration (one generic method, slot-composed) ───
  setDecoration(targetId: string, slot: string,
                decoration: { kind: string; style: unknown } | null): void;

  // ─── LOD + label primitives the layer drives ───
  setLODLevel(id: string, level: number): void;
  rasteriseLabel(id: string, resolution: number): void;

  // ─── per-frame animation tick (called by Canvas after layer.flush()) ───
  tickAnimations(deltaMs: number): void;

  // ─── hit-testing ───
  hitTest(worldX: number, worldY: number): { kind: 'shape' | 'connector'; id: string; subId?: string } | null;

  // ─── raw events — DOM-level, no semantic interpretation ───
  events: EventEmitter<ShapesRendererEventMap>;
}
```

That's the entire surface. No `lod` option. No `labels` option. No `highlight` option. No `setHalo` / `setBorder` / `setGlow` — those are built-in **decorations** registered by kind, applied via `setDecoration(id, slot, { kind: 'halo', style })`. Each visual is a method the layer calls when its policy says it's time. See §2.7 for the decoration model.

#### Three-tier event hierarchy

```
DOM pointer events
        │
        ▼
ShapesRenderer.events            ← raw, primitive, hit-tested
  shape:pointerover              ← no semantic meaning, no domain knowledge
  shape:click
  connector:pointermove …
        │
        ▼
layer.events                     ← semantic, domain-specific
  GraphLayer:    node:click, edge:hover, selection:changed
  ERLayer:       table:click, column:click, relationship:hover
  FlowchartLayer:step:click, transition:hover
        │
        ▼
Behaviours subscribe here
  HoverActivateBehaviour reads layer.events, mutates layer.state
  ClickSelectBehaviour reads layer.events, mutates layer.state
```

Behaviours subscribe to **layer events**, not renderer events. A graph-aware behaviour (`HoverActivateBehaviour`) cares about `node:hover` (with neighbours, traversal), not `shape:pointerover` (which has no domain meaning). The same behaviour applied to an ER diagram cares about `column:hover`, not `shape:pointerover`. Renderer events stay private to the layer that owns the renderer — they're an implementation detail of how the layer translates input.

#### End-to-end: hover triggers a halo

```
1. User hovers a node →
2. Browser fires pointermove →
3. ShapesRenderer hit-tests, emits 'shape:pointerover' { id: 'node-42' } →
4. GraphLayer translates to 'node:hover' { id: 'node-42', node: {...} } →
5. HoverActivateBehaviour subscribes to layer.events('node:hover'),
   mutates layer.state.hoveredId = 'node-42' →
6. GraphLayer's state subscriber fires, calls
   renderer.setDecoration('node-42', 'halo', { kind: 'halo', style: { color, width } }) →
7. Renderer attaches a HaloDecoration in slot 'halo' of node-42's container, draws it once →
8. User sees glow.
```

Six handoffs, each unidirectional. No back-channels. The renderer never asks the layer anything; behaviours never call into the renderer's internals. The contract is two surfaces: renderer's events out, renderer's API in (driven by layer reading observable state).

#### Why this scales to other diagram types

A future `ERDiagramLayer` reuses `ShapesRenderer` exactly as `GraphLayer` does. Different policy:

```ts
class ERDiagramLayer extends WorldLayer<ERData, EROptions, ERState> {
  private renderer = new ShapesRenderer();

  mount(ctx: CanvasContext) {
    super.mount(ctx);

    // tables → composite shapes (header + column rows)
    for (const table of this.data.tables) {
      this.renderer.addShape(table.id, this.tableSpec(table));
    }
    // relationships → connectors
    for (const rel of this.data.relationships) {
      this.renderer.addConnector(rel.id, this.connectorSpec(rel));
    }

    // ER-specific LOD: hide column rows when zoomed out
    ctx.camera.events.on('zoom', ({ scale }) => {
      const level = scale > 1.5 ? 'detail' : 'header-only';
      for (const table of this.data.tables) this.renderer.setLODLevel(table.id, level === 'detail' ? 1 : 0);
    });

    // translate raw renderer events → ER-domain events
    this.renderer.events.on('shape:click', ({ id, originalEvent }) => {
      const hit = this.resolveHit(id);  // is it a table? a column row?
      if (hit.kind === 'table')  this.events.emit('table:click',  hit);
      if (hit.kind === 'column') this.events.emit('column:click', hit);
    });
  }
}
```

Same renderer, different brain. A behaviour like `HoverActivateBehaviour` (graph) wouldn't apply directly — `ERDiagramLayer` would have its own (`HoverColumnBehaviour`?) tuned to ER semantics.

### 2.7 Decorations — visual augmentation of shapes & connectors

`ShapesRenderer` ships **five extensible primitives**: `Shape`, `Connector`, `Marker`, `Router`, and **`Decoration`**. Decorations are visual augmentations of a host shape or connector — halos, borders (solid / dashed), glows, marching-ants, expanding pulse rings, status badges, free-form effects. They are the answer to "how does my visual story grow without bloating the renderer's API."

#### Base interfaces

Two variants share a base; one for shapes (host has bounds), one for connectors (host has a path):

```ts
interface IDecorationBase<TStyle = unknown> {
  style: TStyle;
  tick?(deltaMs: number): boolean;     // optional — presence makes it animated.
                                       //   return true to request a redraw this frame.
  destroy?(): void;                    // optional — cleanup filters/textures
}

interface IShapeDecoration<TStyle = unknown> extends IDecorationBase<TStyle> {
  draw(g: Graphics, hostBounds: Rect, hostShape: IShape): void;
}

interface IConnectorDecoration<TStyle = unknown> extends IDecorationBase<TStyle> {
  draw(g: Graphics, path: Point[], hostConnector: IConnector): void;
}
```

A decoration declares its valid target at registration:

```ts
renderer.registerDecoration('halo',          HaloDecoration,        { target: 'shape' });
renderer.registerDecoration('marching-ants', MarchingAntsDecoration,{ target: 'both' });
renderer.registerDecoration('traffic-flow',  TrafficFlowDecoration, { target: 'connector' });
```

#### Slot-based stacking

Each shape (or connector) can hold **multiple decorations simultaneously**, one per named slot. Slot names are free strings, conventional across the ecosystem:

| Slot | Convention | Drawn |
|---|---|---|
| `halo` | Selection / focus glow | Behind shape |
| `border` | Outline (solid or dashed) | On shape |
| `glow` | Soft outer aura | Behind halo |
| `pulse` | Expanding ring(s) radiating outward | In front of shape |
| `badge` | Status indicator overlay | In front of shape |
| `fx` | Free-form domain effect | In front of everything |

Setting a slot to `null` removes its decoration. Slot z-order is fixed by the renderer (`glow → halo → shape → border → pulse → badge → fx`). Multiple decorations can stack — selected node with halo + dashed border + pulse all at once.

#### Animation runs on the Canvas tick

Per §2.1, Canvas owns the single RAF. Animated decorations participate in that tick — no fragmented per-decoration RAFs:

```
canvas.tick(deltaMs):
  for layer in layers (z-order):
    if layer.dirty.hasPending(): layer.flush()
    layer.renderer.tickAnimations(deltaMs)         ← walks animated decorations
  surfaces.render()                                 ← single pixi commit
```

`tickAnimations(dt)` walks a Set of animated decoration instances, calls each `tick(dt)`, and re-draws on the same Graphics object when `tick` returns true. Static decorations cost zero per frame after their initial `setDecoration()` draw.

**Animated decorations don't pollute state.** A pulse-ring's phase advances internally in the renderer; state holds only the *intent* (`pulsedNodeIds`). Telemetry tap stays clean; devtools timeline isn't spammed.

#### Built-in decorations shipped with `@invana/canvas`

| Kind | Static / Animated | Visual |
|---|---|---|
| `halo` | static | Solid blurred ring outside host bounds |
| `border` | static | Outline; supports `dash: [on, off]` for dashed |
| `glow` | static | Soft outer glow via filter |
| `marching-ants` | **animated** | Dashed border with scrolling `dashOffset` |
| `pulse-ring` | **animated** | Expanding ring(s) radiating from host; configurable count, period, easing |
| `dashed-border-rotating` | **animated** | Subtle rotating dash pattern |

Domain packages register their own (`@invana/er-diagram` ships a `conflict-warning` badge, etc.) without touching `@invana/canvas`.

#### Domain-package sugar

The renderer exposes one method: `setDecoration(targetId, slot, spec)`. That is intentionally terse and orthogonal — it's not always memorable for app code. Domain packages add ergonomic shortcuts that **mutate state**, never the renderer directly:

```ts
class GraphLayer extends WorldLayer<...> {
  haloNode(id: string, style?: HaloStyle | null): void {
    this.state.setState(s => /* update s.haloStyles */);
  }
  pulseNode(id: string, opts: PulseRingStyle | false): void { /* state mutation */ }
  dashBorderNode(id: string, style: BorderStyle | null): void { /* state mutation */ }
}
```

The layer's `flush()` projects state → `renderer.setDecoration(...)`. App code uses the friendly methods; the renderer stays generic; state remains the single source of truth so devtools, time-travel, and telemetry catch every change.

**Out of scope.** Shape-transform animations (the shape itself scaling / rotating / moving along a path) belong to a separate animation/tween system, not the decoration model. Cross-shape "group halos" are layer-level — emit a temporary `Shape`, not a `Decoration`. Per-vertex shader effects (custom WebGPU passes) deferred until a real use case appears.

---

## 3. Composition examples

### 3.1 Basic graph

```ts
const canvas = new Canvas({ container });
await canvas.init();

canvas.layers.add(new BackgroundLayer({ pattern: 'dots' }));
const graph = new GraphLayer({ id: 'graph', data: { nodes, edges } });
canvas.layers.add(graph);

canvas.behaviours.register(new HoverActivateBehaviour({ layerId: 'graph', enabled: true }));
canvas.behaviours.register(new ClickSelectBehaviour({ layerId: 'graph', enabled: true }));

// react to selection changes
graph.state.subscribe(s => updateInspector(s.selectedIds));

await new D3ForceLayout({ charge: -300 }).apply(graph);
```

### 3.2 Tool-switching (lasso vs. pan)

```ts
canvas.behaviours.register(new PanBehaviour({ enabled: true }));        // default tool
canvas.behaviours.register(new LassoSelectBehaviour());                 // dormant
canvas.behaviours.register(new BrushSelectBehaviour());                 // dormant

// UI: user clicks lasso button
canvas.behaviours.setEnabled('pan', false);
canvas.behaviours.setEnabled('lasso-select', true);
```

The framework warns if two enabled behaviours claim the same gesture. It does not enforce mutual exclusion — that's the developer's job.

### 3.3 Two graphs side-by-side

```ts
const left  = new GraphLayer({ id: 'left',  data: dataA });
const right = new GraphLayer({ id: 'right', data: dataB });
canvas.layers.add(left);
canvas.layers.add(right);

await new D3ForceLayout().apply(left);
await new ElkLayout({ algorithm: 'layered' }).apply(right);
```

Layers are independent units. The same canvas can host multiple data sources naturally.

### 3.4 Heatmap overlay on a graph

```ts
canvas.layers.add(new GraphLayer({ data: graph, zIndex: 10 }));
canvas.layers.add(new HeatmapLayer({ data: density, zIndex: 20 }));  // future
```

Z-order composes. A heatmap layer doesn't need to know anything about the graph layer — they're peers.

### 3.5 Map projection (Leaflet)

```ts
const map = L.map('map').setView([51.5, -0.1], 13);
const adapter = new LeafletCanvasAdapter({ map });    // @invana/canvas-leaflet
adapter.attach(canvas);

canvas.behaviours.setEnabled('camera-input', false);  // map drives the camera

const graph = new GraphLayer({
  data: {
    nodes: cities.map(c => ({ id: c.id, ...adapter.project(c.latLng), label: c.name })),
    edges,
  },
});
canvas.layers.add(graph);
```

The Leaflet adapter syncs the map's view to `canvas.camera`. A built-in `CameraInputBehaviour` is disabled to give the map control of pan/zoom gestures. The graph layer doesn't know it's on a map — it just consumes projected coordinates.

---

## 4. What changes vs. today

| Today | Tomorrow |
|---|---|
| `ShapesPlugin` | `ShapesRenderer` (renderer, not a Layer; never added to `canvas.layers`) |
| `GraphDataPlugin` | `GraphLayer` (wraps a `ShapesRenderer` internally; "Data" prefix dropped — every Layer has data) |
| `BackgroundPlugin`, `ThemedBackgroundPlugin` | `BackgroundLayer`, `ThemedBackgroundLayer` |
| `MiniMapPlugin` | `MiniMapLayer` |
| `DevInfoPlugin` | `DevInfoLayer` |
| `HoverActivatePlugin`, `ClickSelectPlugin`, `LassoSelectPlugin`, `BrushSelectPlugin` | `HoverActivateBehaviour`, `ClickSelectBehaviour`, `LassoSelectBehaviour`, `BrushSelectBehaviour` |
| Layers extending one ambiguous base | Two abstract bases: `WorldLayer` (camera-affected, world coords) and `ScreenLayer` (viewport-fixed, screen coords) |
| `D3ForceLayoutPlugin`, `ElkLayoutPlugin` | `D3ForceLayout`, `ElkLayout` (layouts, not registered) |
| `LabelResolutionPlugin` | **deleted entirely.** The renderer exposes `rasteriseLabel(id, resolution)` as a primitive. Each layer that has labels (e.g. `GraphLayer`) watches camera zoom and drives label rasterisation through that primitive — its own policy, no shared plugin. |
| `DrawingPlugin` | dropped or folded into `draw/` utility module |
| `canvas.plugins.register(...)` | `canvas.layers.add(...)` and `canvas.behaviours.register(...)` |
| `LayerManager` (low-level pixi `Container` factory) | renamed (e.g. `Surfaces`) to free "Layer" for the high-level concept |
| Built-in pan/zoom hardcoded into camera | `CameraInputBehaviour` (default registered + enabled, can be disabled) |
| Module-scoped `HoverStore`, `SelectionStore` (one per process); `GraphDataPlugin` holding data | `layer.state` — single source of truth per layer, holds data + interaction state, observable, supports multi-layer scenes |
| Imperative API mutates layer; renderer follows | All mutations land in `state`; Layer projects state → renderer per RAF, batched dirty-shape updates |
| Behaviours emit on global `canvas.events` (e.g. `shape:click`) | Layer-specific events emit on `layer.events`; canvas-wide events stay on `canvas.events` |

The `Plugin` concept goes away entirely. With `LabelResolutionPlugin` deleted (its policy moves into each layer that has labels) and every other former plugin classified as a Layer, Behaviour, or Layout, no consumer remains. If a true odd-one-out emerges later, it can come back — but the bar is "doesn't fit Layer, Behaviour, Layout, or as a Renderer primitive driven by a layer."

---

## 5. Package structure

```
packages/
  canvas/                              @invana/canvas
    Canvas, CameraAPI, CanvasContext
    Layer, WorldLayer, ScreenLayer, Behaviour, Layout (base classes/interfaces)
    Store<T>  (alias of zustand StoreApi<T>)
    EventEmitter, CanvasEventBus, CanvasEvent (event primitives)
    LayerRegistry, BehaviourRegistry, SurfaceManager
    ShapesRenderer, BaseShape, BaseConnector   ← Renderer (used by Layers); not added to canvas.layers
    BackgroundLayer, ThemedBackgroundLayer (WorldLayer)
    DevInfoLayer (ScreenLayer)
    CameraInputBehaviour (built-in, default enabled)
    deps: pixi.js (peer), zustand (immer, subscribeWithSelector, devtools middleware)

  graph/                               @invana/graph
    GraphLayer
    MiniMapLayer
    HoverActivateBehaviour, ClickSelectBehaviour, LassoSelectBehaviour, BrushSelectBehaviour, PanBehaviour, DragMoveBehaviour
    INodeData, IEdgeData, IGraphStyles

  graph-layout-d3-force/               @invana/graph-layout-d3-force
    D3ForceLayout

  graph-layout-elkjs/                  @invana/graph-layout-elkjs
    ElkLayout

  graph-datasets/                      @invana/graph-datasets
```

**Naming convention:**
- Official packages: `@invana/<domain>` for cores, `@invana/<domain>-<feature>` for extensions.
- Community packages: `invana-<domain>-<feature>` (unscoped).
- No `plugin` or `plugins` in package names — that's an implementation detail.
- Class names drop the `*Plugin` suffix. Layers end in `Layer`; behaviours and layouts have no suffix.

---

## 6. Open questions

1. ~~**`GraphLayer` vs `ShapeLayer` relationship.**~~ **Resolved.** `ShapesRenderer` is a renderer, not a Layer. `GraphLayer` wraps a `ShapesRenderer` internally (composition). No `ShapeLayer` shipped today.

2. ~~**Screen-space vs. world-space layers.**~~ **Resolved.** Two abstract base classes: `WorldLayer` (world coords, camera-affected) and `ScreenLayer` (screen coords, viewport-fixed). Their `hitTest` signatures differ so coords can't be mixed up. They mount onto separate internal surface stacks.

3. ~~**`LabelResolution` as option vs. plugin.**~~ **Resolved.** Deleted entirely. The renderer exposes `rasteriseLabel(id, resolution)` as a primitive; each layer with labels owns its own zoom-watching + rasterisation policy. The renderer carries no domain or quality opinions — that's the layer's job.

4. ~~**Behaviour suffix.**~~ **Resolved.** Behaviour classes end in `Behaviour` (`LassoSelectBehaviour`, `HoverActivateBehaviour`). Layouts already end in `Layout`. Layers end in `Layer`. Renderers end in `Renderer`. Suffix-by-kind, applied consistently.

5. ~~**Layouts as behaviours of layers?**~~ **Resolved.** Layouts stay standalone (`await layout.apply(layer)`). Continuous-running cases (e.g. always-relax force simulation) are handled by a thin wrapper Behaviour that calls `apply()` on a tick — keeps the layout API clean while supporting the rare continuous case.

6. ~~**Hit-testing across layers.**~~ **Resolved.** Top-down by z-order, screen-space layers checked before world-space, **stop on first hit** (DOM-style targeting). Each Layer has a `hittable: boolean` flag (default `true`) — set `false` on backgrounds, decorative overlays. If no layer claims the hit, the canvas emits `canvas:background-click`. Propagation through layers, pointer capture, and cursor management deferred until concrete cases appear.

7. ~~**Layer dependencies.**~~ **Resolved.** Cross-layer dependencies are declared as explicit `*LayerId` fields in the dependent layer's options (e.g. `sourceLayerId`, `projectionLayerId`). Resolved via `ctx.layers.get<T>(id)` at `mount()`. Throws with a clear error if the source isn't registered yet — consumers register the source first. Async cases (e.g. waiting for a layer to appear later) can be added via a `waitFor` helper if real use cases appear.

8. ~~**Behaviour-to-layer binding.**~~ **Resolved.** Layer-scoped behaviours require an explicit `layerId` always. No "find the only layer of type T" inference — adding a second layer would silently change the binding. Sugar method `layer.attach(behaviour)` injects the id automatically for the single-layer ergonomics case while keeping the base API explicit.

9. ~~**State-reset semantics on `setData()`.**~~ **Resolved.** With state as the single source of truth, "setData" is just a state mutation that replaces the data slice. Each Layer overrides an `onDataReplaced(prev, next)` hook to decide how *interaction* state reacts to the data swap. Documented defaults: single-id fields (`hoveredId`, `draggingId`, `focusedId`) clear to `null`; set-of-ids fields (`selectedIds`, `expandedIds`) filter to ids still present in the new data; free-form fields (`scrollPosition`, `viewMode`) preserve. Same hook fires on partial mutations (`updateNode`, `removeNode`, etc.) — start with one re-evaluation per mutation; refine if profiling shows it's expensive.

10. ~~**Store implementation.**~~ **Resolved.** `zustand/vanilla` + middleware: `immer` (ergonomic mutations on `Map`-keyed data with structural sharing), `subscribeWithSelector` (fine-grained per-key subscriptions), `devtools` (gated to dev builds; high-frequency mutations opt out per-call), and a custom middleware that forwards every action to `canvas.events.tap()` for telemetry. State carries the full source of truth (data + interaction). Layer projects state → renderer per Canvas tick with explicit dirty-Set tracking populated by mutation sites. Canvas owns the single `requestAnimationFrame`; the per-layer `DirtyBatcher` is a pure data structure with no RAF of its own.

11. ~~**Event-bubbling from layer to canvas.**~~ **Resolved.** Tap channel, no bubbling. App code subscribes only to what it cares about; telemetry uses `canvas.events.tap()` for the firehose. If a real need for canvas-wide typed subscriptions per event kind appears, add a separate `canvas.events.onAnyLayer(eventName, handler)` API at that point — it doesn't require changing the core model.

12. ~~**Envelope overhead under high-frequency events.**~~ **Resolved.** Three-stage strategy, applied in order: **(1) Exclude high-frequency noise from the tap by default** (`pointermove`, `render:tick`, `shape:pointermove`, `connector:pointermove`, `state:dirty-flush`). Consumers can opt back in via `tap(handler, { exclude: [] })`. **(2) Pool envelope objects** if profiling shows allocation pressure. **(3) Gate the tap behind a build flag in production** only as a last resort. Step 1 alone is expected to solve realistic cases.

13. ~~**Serialisability enforcement.**~~ **Resolved.** Dev-mode runtime check. A small walker traverses payload values against a whitelist (string, number, boolean, null/undefined, plain object, array, `Map`/`Set` of allowed types) and `console.warn`s on violations with the offending path (e.g. `emit('node:click').payload.node — got BaseShape, expected plain data`). Zero cost in production builds (stripped). Static-analysis (ESLint) approach rejected as too brittle; trust-and-document approach rejected as too lax — bugs would ship silently.

14. **Perf verification at scale.** The state-as-truth model assumes O(1) mutations + RAF-batched render projection sustain stock-data-rate updates (1000+/sec across N layers). Verify under load: (a) zustand `setState` cost with `immer` middleware on `Map`-keyed data, (b) cost of per-frame dirty-Set flush at 1000+ shapes, (c) devtools impact when accidentally enabled in prod, (d) memory growth if telemetry tap is unsampled. Build a stock-feed-style benchmark in Storybook before declaring the model production-ready.

---

## 7. Suggested execution order

The architecture changes are not all the same size. Stage them so each PR is reviewable and the code is in a good state at every step.

1. **Rename packages** (`plugins-*` → domain-prefixed). Mostly mechanical, no semantic change. Drop `*Plugin` suffix on class names where it's redundant.
2. **Audit `DrawingPlugin`.** Move utility methods to `draw/` (renamed from `graphics-utils/`) or drop. Decide whether it's a plugin at all.
3. **Introduce Behaviour split.** Add `CanvasBehaviour` interface and `canvas.behaviours` registry alongside the existing plugin system. Migrate the four input plugins. Add `enabled` defaults and shortcut conflict warnings. The Plugin system stays intact for everything else for now.
4. **Layer-first reframe.** Introduce `Layer` base class and `canvas.layers` registry. Migrate renderers/overlays/data plugins one at a time. Rename existing low-level `LayerManager`. Convert `ShapesPlugin` to `ShapesRenderer` (no longer a Plugin or a Layer; primitive drawing API only — strip out LOD, label, and highlight policy from its surface). Move `LabelResolutionPlugin`'s zoom-watching logic into `GraphLayer`; delete the plugin.
5. **Layouts decoupled.** Convert `*LayoutPlugin` to standalone `Layout` classes that operate on layers without registering. Update consumers.
6. **Plugin retirement.** With every previous step done, the Plugin concept should have no remaining users. Remove the interface and registry.

Steps 1–3 are independently shippable wins. Step 4 is the largest. Step 6 is cleanup.

---

## 8. What this proposal does *not* cover

- Rendering pipeline internals (PixiJS containers, render passes, batching) — unchanged.
- Animation system — unchanged.
- Canvas-wide event bus — gains a structured `tap()` channel for telemetry (§2.5) and new canvas-level events (`layer:added`, `layer:removed`, `behaviour:enabled`, `behaviour:disabled`). Layer-specific events move off it onto `layer.events`.
- Camera implementation — unchanged, except for the input-handling extraction into `CameraInputBehaviour`.
- Public API for plugin authors writing custom layers/behaviours/layouts — TBD as part of step 3 / step 4 implementation.

---

## 9. Decisions deferred

- Whether to publish `@invana/canvas-leaflet` as a first-party package or document the integration pattern and let someone build it.
- Whether the community-plugin convention should officially change from `invana-plugin-*` to `invana-<domain>-<feature>`.
- Whether `Layout` becomes a registered concept later (`canvas.layouts.run('d3-force')`) or stays as ad-hoc instances.
