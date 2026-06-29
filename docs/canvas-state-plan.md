# Canvas State — Consolidated Plan (`@invana/canvas-state`)

> **Status: DESIGN / ROADMAP — not shipped.** The **single review doc** for the
> reactive state layer: concepts, data model, architecture, code structure,
> performance, telemetry, collaboration, and — emphasised — the **migration from the
> existing engine and its impact**. Sequences the four older state docs
> (`reactive-state-store-plan`, `store-owns-state-plan`, `unified-canvas-options-plan`,
> `collaborative-state-plan`) at the package level; consumers (the Designer) live in
> [`designer-studio-plan.md`](./designer-studio-plan.md). Branch: `feat/canvas-state`.
>
> Interface sketches are **illustrative**, not final signatures.

## Contents

1. Goal & principles · 2. Locked decisions · 3. Data model · 4. Architecture ·
5. Package/file structure · 6. How it's consumed + **developer API (read/update, operations, history)** ·
7. Performance · 8. Telemetry · 9. Collaboration · 10. **Migration & impact** · 11. Milestones · 12. Decisions

---

## 1. Goal & principles

**One `CanvasState` per `Canvas`** — the single source of truth for everything a canvas
shows, consumed by React **and** plain-JS/engine code with **no duplicate copies and no
manual syncing**. The renderer is a **pure projection** of it: state changes → the affected
projection re-renders (never the whole scene — see §7). Packaged as **`@invana/canvas-state`**,
a **renderer-free leaf** so the same state survives a renderer swap, a backend swap
(zustand → Yjs), and powers telemetry over every change.

Principles:

- **One `CanvasState { view, data }`**, not separate data/positions branches; position is a
  node field inside `data`.
- **Renderer-agnostic.** Imports no drawing library; pixi is one adapter; camera is an
  abstract transform.
- **Program against the `ReactiveStore<T>` port**, not zustand.
- **Declarative patches** `update(patch, action?)` — the one seam telemetry + Yjs hang off.
- **Two physics:** small/human-rate → reactive store; bulk/machine-rate → typed arrays,
  coarse flush, never reactive.

## 2. Locked decisions

| # | Decision |
|---|---|
| C1 | **Dedicated `@invana/canvas-state` package, a renderer-free leaf.** Zero `@invana` deps; imports no drawing library. `@invana/canvas` / `@invana/graph` / `@invana/canvas-react` depend on it. Relaxes the CLAUDE.md "`@invana/canvas` has no `@invana` deps" rule → "…except `@invana/canvas-state`." |
| C2 | **Renderer-agnostic.** pixi is one adapter; camera is an abstract `{x,y,zoom}`, throttled/ephemeral. |
| C3 | **One `CanvasState { view, data }`.** `view` = how it's defined+viewed; **`data` = a keyed registry of data layers** (graph / table / geo …). **Position is a node field**; **groups are a keyed many-to-many collection** (bubble-sets / shaped containers), not `parentId`. |
| C4 | **Renderer = pure projection**, reacting at **every scale** via *targeted* re-render (§7) — never a global repaint. |
| C5 | **`ReactiveStore<T>` port; zustand is one adapter** (`createReactiveStore.ts`, the only zustand importer, lint-enforced). Swappable to valtio/nanostores/Yjs. |
| C6 | **Writes are declarative patches** `update(patch, action?)`; the named `action` is threaded from day one (no-op today) → powers OTel + CRDT history. |
| C7 | **Telemetry is a port *decorator* (`withTelemetry`)**, not zustand middleware — survives the backend swap; scoped to `view`, never the data hot path. |
| C8 | **Migration is strangler, not rewrite** (§10): store goes *under* the existing apply path; the hot render path is never reactified. |
| C9 | **`CanvasState` owns the per-layer `DataStore`s** (D7) — data is set on `state.data[id]`; layers read/subscribe rather than owning their own store. Single source of truth for save-load/collab; enlarges the migration (`GraphLayer`/`GraphStore` ownership, §10.3). |
| C10 | **All state manipulation goes through `CanvasState`** (`view` *and* `data`); engine renderers and React components are **pure projections that react** — no imperative side-channel. Data ingestion writes to `state.data[sourceId]` (the owned source), **not** the layer; `<GraphLayer data>` / `graphCanvas.setData` are thin sugar over that state write. |
| C11 | **Collaboration backend = Yjs/Automerge CRDT** (D6) — a CRDT doc behind the `ReactiveStore` port + **Awareness** for presence; FE & `invana-backend` are peers of the same doc. Data + positions stay off the CRDT (the three-channel split, §9). |
| C12 | **Developer API = read/update + an operations layer** (§6.1–6.3). `view.read(sel)` / `view.update(recipe\|patch, action)` / `view.batch` are the primitives; `data[id]` mutators for bulk. Built-in **named ops** (`view.layers/behaviours/layouts/selection.*`, `data.addNode/…`, domain sugar on `GraphCanvas`) + **composable user operations** sit on top, all funnelling through `update(patch, action)`. **History/undo** falls out of the patch+inverse stream (immer `produceWithPatches`; Yjs `UndoManager` under collab). |

## 3. Data model

```ts
/** One per Canvas — the single source of truth; renderer is a pure projection of it. */
interface CanvasState {
  view: CanvasView;                  // how it's defined + viewed → reactive store (immer · observable · syncable)
  data: Record<string, DataLayer>;   // KEYED data layers (graph / table / geo …) — each typed-array backed (§3.1)
}

interface CanvasView {
  definition: {                                       // "what it IS" — persisted, converged
    layers:       Record<string, LayerOptions>;       // keyed by instance id (≈ CanvasConfig.layers)
    behaviours:   Record<string, BehaviourOptions>;
    layouts:      Record<string, LayoutOptions>;
    activeLayout: string | null;
    templates:    NodeStructureTemplate[];
    theme:        ThemeState;
  };
  interaction: {                                      // "the live view" — mostly ephemeral / per-user
    selection: ReadonlySet<string>;
    hover:     string | null;
    states:    Record<string, ReadonlySet<string>>;   // highlighted / context-open
    camera:    { x: number; y: number; zoom: number };// ABSTRACT (C2), throttled/ephemeral
    viewMode:  'select' | 'draw' | 'annotate' | string;
  };
}

/** A data layer is a domain store; the graph one is shown — table/geo/timeline are siblings (§3.1). */
type DataLayer = GraphData | TableData | GeoData /* … */;

interface GraphData {                                 // the graph data-layer (domain-agnostic container)
  nodes:       Record<string, NodeRecord>;            // each node carries its position
  edges:       Record<string, EdgeRecord>;
  groups:      Record<string, GroupRecord>;           // many-to-many encapsulation sets (§3.1)
  annotations: Annotation[];
  query:       { refs: QueryRef[]; intents: IntentLogEntry[]; status: 'idle' | 'loading' | 'streaming' };
}

interface NodeRecord {
  id: string;
  x: number; y: number;        // POSITION IS A NODE FIELD — not a top-level branch (C3)
  payload: unknown;
  states: string[];            // data-driven active states
}

interface GroupRecord {        // a named set drawn as an encapsulating shape (bubble-set OR rect/hull/ellipse)
  id: string;
  memberIds: string[];         // MANY-TO-MANY with nodes (groups overlap) — NOT parentId
  geometry: GroupGeometry;     // DERIVED hull / outline, cached (recomputed by a deriver — §3.1)
  payload: unknown;            // label, etc.
  states: string[];            // selected / hover / collapsed
}
```

**Storage is internal to each data layer (C4), invisible at the API:** small/structural changes
ride a coarse flush (and may mirror small bits — annotations/counts — into the reactive branch);
machine-rate fields (`x`,`y`, bulk `payload`, render flags) live in **typed-array columns**
(`ColumnStore`/`GraphStore`), delivered via a **batched, frame-coalesced flush** with targeted
per-node re-render — never the reactive/immer/CRDT path. **Positions are derived locally by the
layout and never synced.**

### 3.1 Extensibility — more data layers & groups

The core `{ view, data }` doesn't grow when you add data sources or grouping — both branches are
**keyed registries over a domain-agnostic substrate** (same principle as the engine's keyed layer
registry and the ER-extensibility argument in `store-owns-state-plan` §7):

- **Multiple data layers.** `data` is keyed by data-layer id; each is its own typed-array store with
  its own flush channel. A view layer declares its source via a `dataLayerId` field (the rule-8
  cross-layer reference). **Many view layers can project one data layer** — a `GraphLayer` *and* a
  `TableLayer` over `data["people"]` is "tables and graphs from one dataset"; different `dataLayerId`s
  give a graph + a basemap. A new layer *type* is a new `DataLayer` subclass of `DataStore` (the graph
  one stays in `@invana/graph`); the core schema is untouched.

- **Groups (bubble-sets / shaped containers).** A group is a **many-to-many set** (a node can be in
  several; they overlap) → a keyed `groups` collection with `memberIds[]`, **not** `parentId`.
  Bubble-set vs geometric container is a **`shape` style** on the group layer, not a different data
  shape — generalising today's `BubbleSetsLayer`:
  `view.definition.layers["groups"] = { type: GroupLayer, dataLayerId, shape: 'bubbleset'|'rect'|'convex-hull'|'ellipse', style }`.

- **Group geometry is derived, like a layout.** The encapsulating outline is computed **from member
  positions** by a **`GroupGeometryDeriver`** (sibling to `Layout`: input = positions, output =
  `groups[*].geometry`). Cheap shapes (rect / ellipse / convex-hull) recompute per frame; **bubble-sets
  are O(members×grid), so they're throttled / debounced (recompute on drag-settle) — off the per-frame
  hot path and never in the reactive store.** `GroupLayer` re-renders targeted: only groups whose
  members moved.

  | Group piece | Home | Physics |
  |---|---|---|
  | membership (`memberIds`) | `data[layer].groups[id]` | small · authored · observable |
  | encapsulating geometry | `data[layer].groups[id].geometry` | **derived** · throttled · typed-array-friendly |
  | shape kind + style | `view.definition.layers["groups"]` | authored · reactive |
  | selection / hover / collapse | `view.interaction` (group ids) | ephemeral |

  Collapse (hide members, draw the group as one shape) is a group interaction state; interactive
  "container" drag (group moves its members) is a `groupAware` behaviour reading `memberIds`. Neither
  changes the data model.

## 4. Architecture

```
        ┌────────────────────────────── CanvasState ──────────────────────────────┐
        │  { view: ReactiveStore<CanvasView>,   data: Record<string, DataLayer> }   │  ← single handle
        └─────────────┬──────────────────────────────────────┬─────────────────────┘
                      │ reactive (port)                        │ typed-array (coarse flush)
        ┌─────────────▼───────────────┐   ┌────────────────────▼────────────────────┐
        │ view (CanvasView)           │   │ data — keyed DataLayers                 │
        │  withTelemetry (decorator)  │   │  per layer: DataStore                   │
        │  createReactiveStore(zustd) │   │   ├ ColumnStore (typed arr: x/y/payload) │
        │  …or createYjsStore (later) │   │   ├ groups (memberIds + DERIVED geometry)│
        │  ── ReactiveStore<T> PORT ──│   │   └ DirtyBatcher (per-layer frame flush) │
        └─────────────────────────────┘   └──────────────────────────────────────────┘
                      ▲                                  ▲
   select / subscribe / update(patch, action)     on('flush') / column writes  (+ GroupGeometryDeriver, throttled)
```

```ts
// port/ReactiveStore.ts — the only thing consumers type against
export interface ReactiveStore<T> {
  getState(): T;
  update(patch: DeepPartial<T>, action?: string): void;  // setState now, Yjs txn later
  subscribe(listener: (state: T, prev: T) => void): () => void;
  batch(fn: () => void): void;                            // coalesce N writes → one notify
}
// + select(store, selector, isEqual?) so selector semantics survive a backend swap.

// adapters/zustand/createReactiveStore.ts — THE only `import … from 'zustand'`
export function createReactiveStore<T extends object>(initial: T): ReactiveStore<T> { /* immer draft stays internal */ }

// CanvasState.ts — the façade
export function createCanvasState(opts?: { telemetry?: TelemetrySink }): CanvasState {
  let view = createReactiveStore<CanvasView>(defaultCanvasView());
  if (opts?.telemetry) view = withTelemetry(view, opts.telemetry);
  return { view, data: {} };   // data layers registered per-id as sources are added
}
```

- **Port** is the only typed surface; adapters (zustand / map-test / yjs) are interchangeable.
  Telemetry decorates the *port*, so it survives the swap.
- **`view` and `data` are siblings** — the façade does **not** merge them (different physics).

## 5. Package & file structure

```
packages/canvas-state/
├── package.json                 # deps: zustand, immer (later yjs). NO @invana deps.
├── src/
│   ├── index.ts
│   ├── port/        ReactiveStore.ts · select.ts · createMapStore.ts (test adapter)
│   ├── adapters/    zustand/createReactiveStore.ts · (later) yjs/
│   ├── view/        CanvasView.ts · createViewStore.ts · patch.ts (deepMerge, relocated)
│   ├── data/        ColumnStore.ts · DataStore.ts · DirtyBatcher.ts   (RELOCATED from canvas)
│   ├── telemetry/   withTelemetry.ts · TelemetrySink.ts
│   ├── history/     createHistory.ts (inverse-patch stack via produceWithPatches; Yjs UndoManager adapter)
│   └── CanvasState.ts
└── tests/           port-swap proof · deepMerge · telemetry · history · ColumnStore
```

React bindings stay **out** (framework-agnostic core). `useStore(store, selector)` lives in
`@invana/canvas-react` via `useSyncExternalStore`. `GraphStore` stays in `@invana/graph` as a
domain subclass of `DataStore` (canvas-state stays domain-free). The **named operations** (§6.2 —
`view.layers/behaviours/layouts/selection.*`, `data.addNode/…`) are **domain sugar on `GraphCanvas`**
(`@invana/graph`); canvas-state ships only the `read`/`update`/`batch` primitive + generic `history`.

## 6. How it's consumed

- **Engine.** `Canvas` holds a `CanvasState`. `Canvas.update(patch, action)` → `state.view.update`
  + the existing `setOptions` fan-out; `Canvas.get()` → `state.view.getState()`. **`CanvasState`
  *owns* the per-layer `DataStore`s** (D7): data is set on `state.data[id]`, and a layer reads /
  subscribes to `state.data[dataLayerId]` rather than owning its own store.
- **React.** `useStore(state.view, selector)`; editors write `state.view.update(patch, action)`.
  No component copies. `<GraphLayer data>` sets `state.data[id]` (owned store), not a layer-local copy.
- **Viewers** read **both**: `state.view.subscribe` (how) + `state.data[id].on('flush')` (what+where).

### 6.1 Developer API — read / update (the primitive)

The developer surface is **read the state / update the state** over the typed `CanvasState` — no
imperative side-channel (C10). Two stores, two write physics:

- **`view`** (reactive, small): `view.read(selector)` · `view.update(recipe | patch, action)` ·
  `view.batch(action, fn)`. The `update(recipe)` form reads like a direct mutation (immer draft) but
  emits a **declarative patch** + the `action` label (C6) — the draft never escapes the seam, so a
  Yjs backend still sees a clean delta.
- **`data[id]`** (typed-array, bulk): updated through the store's own mutators (`setData`, `addNode`,
  `addEdge`, `setPositions`, …) — never patched/synced (C6 governs `view` only). Renderers subscribe
  to its `flush`.

```ts
const charge = view.read(s => s.layouts.force.charge);                 // READ
view.update(s => { s.layouts.force.charge = -300; }, 'force.charge');  // UPDATE (patch underneath)
data['people'].addNode({ id: 'dave', team: 'eng' });                  // UPDATE data (store mutator)
```

### 6.2 Operations — built-in + your reusable ones

`read` / `update` / `batch` are the **primitive**; **operations** are thin named functions over them.
Built-in namespaced ops ship; developers compose their own — all funnel through `update(patch,
action)`, so each names its action (meaningful telemetry / CRDT / history label).

```ts
// built-in, namespaced (one-liners over the primitive)
view.layers('bg').update({ color: 0x0f172a });   view.layers.set('graph', { type: GraphLayer, source: 'people' });
view.behaviours('hover').enable();               view.layouts('force').tune({ charge: -300 }).run();
view.selection.set(['alice', 'bob']);
data.addNode('people', { id: 'dave' });          data.addEdge('people', { source: 'carol', target: 'dave' });

// YOUR reusable op — a plain function
const addPerson = (g, id, team) => g.data.addNode('people', { id, team });

// COMPOSITE op — several updates as ONE atomic action (one history step / CRDT txn / telemetry event)
const focusTeam = (g, team) => g.batch('focus-team', () => {
  g.view.behaviours('color').set({ by: 'team' });
  g.view.selection.set(membersOf(g, team));
  g.view.layouts('force').run();
});
```

Built-in ops live on the **domain facade** (`GraphCanvas`, `@invana/graph`); `@invana/canvas-state`
stays the low-level port. Custom ops are just functions — no registration, no framework.

### 6.3 History / undo — falls out of the patch stream

Each `view.update` records `{ action, patches, inverse }` via immer's **`produceWithPatches`** (the
forward patch **and** its inverse, for free). History is then a reusable op tapping that stream, not
a special case:

```ts
const history = createHistory(state.view);
view.update(s => { s.layouts.force.charge = -300; }, 'force.charge');
history.undo();   // applies the recorded inverse patch
history.redo();
```

**Backend-aware through the same port:** pre-collab it's the inverse-patch stack; under Yjs (M5)
`history.undo()` delegates to Yjs's `UndoManager` (per-origin, collab-safe) — same API, swapped
underneath. Macros / transactions / replay are the same idea (compose ops + tap the stream). None of
this touches the hot path or the two-physics split — `data` ops still go through its typed-array store.

### 6.4 Data-write flow — who subscribes, and the telemetry boundary

Adding/removing **nodes is a *data* write, not a *view* write** — so it travels the typed-array /
flush path, **not** the reactive store or its per-mutation telemetry. This boundary is load-bearing;
pin it so nobody later routes adds through `view.update` or wires per-node telemetry.

```
graph.data.addNode('people', { id: 'dave' })
   │ writes a typed-array slot + marks dirty   (NOT view.update; NOT immer; NOT a patch)
   ▼
state.data['people']  (DataStore / ColumnStore)
   │ DirtyBatcher coalesces → ONE flush per FRAME: { added:['dave'], changed:[], removed:[] }
   ├──────────► GraphLayer(source='people')  → create shape('dave'); render the delta (targeted)
   ├──────────► MiniMapLayer / GroupLayer / TableLayer bound to 'people' → each projects the delta
   ├─ activeLayout re-runs (auto, on data change) → derives x/y → writes back → 2nd flush → positions 'dave'
   └─ tap: data:flush { added:1 } (aggregate)   ·   data.query.intents: "addNode dave" (audit / sync)
```

- **Telemetry — intent/aggregate, never per-node.** `withTelemetry` is scoped to `view` (C7), so a
  data-store write emits **no** per-element span (machine-rate would flood). What's captured instead:
  a coarse **`data:flush { added, changed, removed }`** on the canvas tap (`CanvasEventBus`, one event
  per frame — `store-owns-state-plan` §6) for metrics, and, when you want a named auditable/syncable
  record, an entry in **`data.query.intents`** ("addNode dave" / "ran query Q") — the data-mutation
  trail, distinct from the per-`update` view telemetry.
- **Who subscribes.** Everything **bound to that source id** via `state.data[id].on('flush')` — the
  `GraphLayer` (`source:'people'`) plus any sibling view layer over the same source (minimap, group,
  table), and the `activeLayout`. One data write → every projection of it re-renders its own delta.
  **React components do *not* subscribe to bulk data** — they read `view` slices (and small
  `data.meta` like counts) via `useStore`; the heavy data→render path is engine-internal (layer ↔
  data-store flush), deliberately *off* the React render path.
- **Render.** The layer **drains the delta** (create `added`, rebuild `changed`, dispose `removed`) —
  targeted, O(delta), never a full repaint. Missing positions are derived by the layout and arrive on
  a second frame-coalesced flush.

| | Add **nodes** (data) | Change **config / selection** (view) |
|---|---|---|
| API | `data[id].addNode(…)` | `view.update(recipe, action)` |
| store | typed-array `DataStore` | reactive store (immer / CRDT) |
| telemetry | aggregate `data:flush` + intent log | **one event per `update`** (`withTelemetry`) |
| who subscribes | layers bound to the source (`on('flush')`) | `useStore` / `subscribe` selectors |
| render | drain delta → targeted | targeted per scoped slice |
| collab | data channel / intent (not the CRDT) | CRDT doc |

## 7. Performance — the "super fast" guarantees

The headline: **"state → render" means the *affected* projection re-renders, never the whole
scene.** Two design rules:

1. **Reactivity is added *under* the existing apply path, not onto it.** `Canvas.update(patch)`
   already fans out **only to changed ids'** `setOptions` (targeted, O(changed)). We keep that;
   the store becomes the observable truth *underneath* — adding observability for readers (React,
   mirrors, telemetry, collab) at **zero cost to the apply path**.
2. **Each slice reacts at its own granularity** — no global "re-render Canvas" subscription:

   | Slice | Rate | How render reacts | Cost |
   |---|---|---|---|
   | `view.definition.*[id]` | human | changed id's `setOptions` → its targeted redraw | O(changed ids) |
   | `view.interaction` (hover/selection/states) | high | carries id → `rerenderNode(id)`, drained once/frame | O(touched)/frame |
   | `data` + positions | machine | typed-array write + `data.on('flush')` → rebuild dirty set | O(dirty)/frame |
   | camera | high | throttled ≤1/frame abstract `{x,y,zoom}` | O(1)/frame |

**Invariants (must hold):** (1) nothing machine-rate touches the reactive store; (2) `view` stays
small (immer structural-sharing cost negligible); (3) targeted, frame-coalesced data renders.

**Levers:** `subscribeWithSelector` + `select()` shallow-equality (idle readers cost 0 via
structural sharing); `view.batch(fn)` to coalesce multi-field writes; camera throttling;
interaction sweeps commit on settle (preview overlay-local); stable selector refs.

**Targets (benchmark in M0/M1):** `view.update` typical patch **< 0.1 ms**; idle subscriber wake
on unrelated change **= 0**; data position write **~10 ns/slot**; **one flush per frame** regardless
of write volume. Guarded by a `createMapStore` micro-bench + a 5k-node hover-sweep + force-sim
story, run before/after each phase.

### 7.1 Heavy-update budgets — layout churn & highlight/mute

The two cases that *look* like they force O(N) work; the design keeps both off it. These are the
named benchmark scenarios.

**A. Layout updates (position churn) — the heaviest data write.** A force layout rewrites x/y for
every node every frame.

- **Write:** the layout **bulk-writes the position column** on the typed-array `DataStore`
  (~10 ns/slot, no per-node objects) via the **silent / bulk path** — no per-node events; **one version
  bump + one frame-coalesced flush** (`flushMode:'frame'`), regardless of how many nodes moved. Never
  the reactive / immer / CRDT path.
- **Render:** the layer drains the flush and updates **transforms only** (position) for moved nodes —
  it does **not** rebuild shapes (style/geometry unchanged). One-shot layouts (ELK) = one bulk write +
  one flush + fit; animated (d3-force) = per-tick bulk write, one flush/frame.
- **Scale path (benchmark-gated, later):** positions as a **GPU-resident attribute** so a WebGPU-compute
  layout and the render pass share the buffer — no CPU readback, no per-node transform update (blocked
  by PixiJS buffer sharing; cheap win first = the silent bulk path + one memcpy upload).
- **Budget:** per-frame cost ≈ the algorithm + one memcpy + a transform update for *visible* moved
  nodes — **not** the store, **not** a shape rebuild. *Bench:* d3-force over 5k / 50k nodes — store
  overhead ≈ 0 vs raw column writes; frame time dominated by the sim.

**B. Highlight neighbourhood + mute the rest.** Hover a node → highlight its neighbourhood, dim every
other node *and* edge. The trap: "mute the rest" reads as an O(N) state write to every other element.

- **Don't write per-element 'muted' state to all N.** Model it as a **focus set + mode** on the view:
  `view.update(s => { s.interaction.focus = { ids: neighbourhood, dim: true } }, 'highlight.neighbourhood')`
  — **O(neighbourhood) to compute, O(1) to set the mode.** "Muted" is a **render-time derivation**: an
  element renders muted iff `focus.dim && !focus.ids.has(id)` — **no state write for the muted majority.**
- **Render the muted majority without a per-node CPU repaint:** dim at the **layer level** (one layer
  alpha / a dim overlay) and draw the highlighted set on top — **or** (GPU path) write the highlighted
  **`stateFlags`** + one "focus mode" uniform so the shader tints muted-vs-highlighted in a single pass.
  Either way the cost is **O(highlighted)**, not O(N).
- Un-hover clears `focus` (O(1)); a rapid hover sweep throttles to **one focus update per frame**.
- **Budget:** write = O(neighbourhood); render = O(highlighted) + one layer-dim / uniform — **never**
  O(N) writes or O(N) CPU re-render. *Bench:* hover-sweep over a 50k-node graph stays at one focus
  update + one dim per frame.

## 8. Telemetry

`withTelemetry(store, sink)` wraps the **port** (not zustand) → one event per `update(patch,
action)` with `{ action, changedPaths, patch, ts, durationMs?, actor? }`. The patch **is** the
diff (declarative) → no deep-diff cost. Scoped to `view`, never the data hot path.

```ts
export interface TelemetrySink { emit(e: TelemetryEvent): void; }   // OTel-AGNOSTIC; NoopSink default
```

The engine stays exporter-agnostic; the **app** wires the OTel adapter (`action` → event/span name;
`changedPaths` → attributes; **never** unbounded ids in names; sampling at the sink). One stream,
three uses: telemetry **+** collaboration (Yjs applies the same patch) **+** undo/audit (op-log).

## 9. Collaboration (brief — detail in `collaborative-state-plan.md`)

**Backend = Yjs/Automerge CRDT (D6, committed).** A **CRDT doc behind the same `ReactiveStore`
port** (`update` → a Yjs txn) + an **Awareness** channel for presence; FE & `invana-backend` are
peers of the same doc (`materialize(doc)` byte-identical → no drift). Built behind the port through
M0–M4, swapped in at M5 — consumers unchanged. The three-channel physics: `view.definition` →
**Doc** (persisted, converged); `view.interaction` (selection/hover/camera) → **Awareness**
(ephemeral, per-user); `data` positions + bulk payloads → **data channel** (derived locally /
streamed), **never** the CRDT. Hard invariant: **definition + awareness sync; positions + bulk
don't.**

---

## 10. Migration & impact (from the existing setup)

This is the part to scrutinise: what changes in today's code, what's preserved, and the blast
radius. Strategy: **strangler, not rewrite** — wrap the existing config in the store, keep the old
notification flowing, migrate consumers one at a time, then delete the old path. Every phase keeps
`pnpm check-types` green and is independently revertible.

### 10.1 Current setup (verified)

| Area | Today |
|---|---|
| Config | `Canvas.config` is a **plain object** (`Canvas.ts:120`); `update()` deep-merges + fans to `setOptions` (`:384`); `get()` (`:404`); emits coarse **`options:change`** (`:397`); `_activate` applies init config (`:365`); late-layer catch-up (`:184`). |
| zustand | `createLayerStore` (`state/Store.ts`, devtools→subscribeWithSelector→immer) — wired only into base `Layer`; `GraphLayer` state is a stub. |
| Bulk data | `ColumnStore` + `DirtyBatcher` in `packages/canvas/src/state/`; `GraphStore` (graph) with `flush` → layer dirty-drain. |
| Interaction | selection in `ClickSelectBehaviour` maps; hover in `GraphStore` presence; `node:state`/`edge:state` partly built (`store-owns-state-plan` §2.1/2.2 done). |
| React | `useGraphCanvasOptions` copies config into `useState`, re-syncs on `options:change` (the copy anti-pattern). |

### 10.2 Phases

- **M0 — Store behind the existing API (zero behaviour change).** Back `Canvas.config` with
  `state.view`; `update()` writes the patch **and** runs the existing `setOptions` fan-out; a single
  store subscription **re-emits `options:change`** so every current consumer keeps working untouched.
  `get()` → `getState()`. *Fully revertible.*
- **M1 — Granular reads.** Add `useStore`/`select`; migrate each reader (`useGraphCanvasOptions`,
  `MiniMapLayer`, editors) off the coarse event to **slice-scoped subscriptions**, one at a time.
- **M2 — Fold interaction + camera** into `view.interaction`; behaviours write via `update(patch,
  {actor})`; layers subscribe targeted, preserve `rerenderNode(id)` granularity. Adds the `actor?` seam.
- **M3 — Drop the back-compat `options:change` re-emit** once no consumer depends on it.
- **M4 — Telemetry decorator** (additive — everything already flows through `update`).
- **M5 — Yjs adapter** (swap the adapter; same port + Awareness).
- **Data track (parallel, M0–M1):** **relocate** `ColumnStore` + `DirtyBatcher` into
  `canvas-state/data` (D1); `@invana/canvas` re-exports for back-compat. **`CanvasState` *owns* the
  per-layer `DataStore`s** (D7): data is set on `state.data[id]` and `GraphLayer` reads/subscribes to
  it instead of owning a `GraphStore`; `GraphStore` becomes a `DataStore` subclass. **Positions never
  enter the reactive store.**

### 10.3 Impact / blast radius

| File / area | Change | Type | Risk |
|---|---|---|---|
| `packages/canvas/src/engine/Canvas.ts` (`config`/`update`/`get`/`options:change`) | back with `state.view`; re-emit event | **load-bearing edit** | **High** — no-test pkg (rule 10); must stay behaviour-identical |
| `packages/canvas/src/state/ColumnStore.ts`, `DirtyBatcher.ts` | relocate → canvas-state; re-export shim | relocate | Low — re-export keeps imports valid |
| `packages/canvas/src/state/Store.ts` (`createLayerStore`) | superseded by port + zustand adapter | replace | Low — one zustand wrapper, not two |
| `packages/canvas/src/engine/CanvasConfig.ts` (`deepMerge`/`configurable`) | move/share patch helpers to canvas-state | relocate | Low |
| `packages/graph` `GraphStore` | `DataStore` subclass **owned by `CanvasState.data[id]`** (D7), not by the layer; `flush` unchanged | **ownership move** | **Med** — data lifecycle shifts to CanvasState |
| `packages/graph` `GraphLayer` + `<GraphLayer data>` | reads/subscribes `CanvasState.data[dataLayerId]` instead of owning a store; `setData`/`data` prop routes to the owned store | refactor | Med — data-flow change; targeted render preserved |
| `packages/graph` behaviours (`ClickSelect`/`Hover`/…) | write interaction via `state.view.update` (M2, D3) | refactor | Med — preserve targeted render |
| `packages/canvas-react` `useGraphCanvasOptions` | replace copy with `useStore` | replace | Low — additive `useStore` first, then swap |
| `packages/canvas-react` `useGraphCanvasUpdate` | unchanged signature; routes to `view.update` | transparent | Low |
| New `@invana/canvas-state` package | created (port, adapters, view, data, telemetry) | new | Low |
| `CLAUDE.md` dependency layering | add canvas-state leaf; relax "no @invana deps" | docs | Low |

**Packages touched:** new `@invana/canvas-state`; `@invana/canvas` (Canvas.ts + relocations);
`@invana/graph` (GraphStore subclass + behaviour writes, M2); `@invana/canvas-react` (`useStore`).

### 10.4 What is explicitly preserved (no regression)

- The `update()` → `setOptions` **targeted fan-out** (O(changed ids)).
- **Targeted rendering**: `rerenderNode(id)`, per-frame dirty-drain, `data.on('flush')`.
- The **typed-array hot path** — force sim writing positions at ~10 ns/slot, frame flush.
- `options:change` during M0–M2 (the back-compat bridge), removed only at M3.
- Public `Canvas.update`/`get` signatures; `useGraphCanvasUpdate`.

### 10.5 Performance gates (every phase) & risks

**Gates:** (1) no global repaint on a scoped change; (2) hot path shows **no** added per-frame cost
vs `main` (the store isn't in it); (3) idle readers cost 0; (4) one flush/frame. A phase that
regresses these is rolled back, not merged.

**Risks:** **R1** Canvas.ts behavioural drift (M0) → keep `options:change` byte-compatible, eyeball
Visualiser/MiniMap vs `main`. **R2** accidental reactify of the hot path → gate-2 bench + the rule
"no machine-rate writes to the reactive store." **R3** double notification M0–M2 → intentional +
idempotent, removed at M3. **R4** selector instability → module-scope/`useCallback` selectors.

## 11. Milestones & order of operations

`M0` (store under the API) → `M1` (granular reads, per consumer) → `M2` (fold interaction+camera) →
`M3` (drop the bridge) → `M4` (telemetry) → `M5` (Yjs). Data-track relocation runs alongside M0–M1.
Build sequence inside the package: scaffold port + zustand + map-test adapters → relocate
ColumnStore/DirtyBatcher + DataStore → createViewStore + façade → back `Canvas.config` → `useStore`
→ fold interaction/camera → telemetry → Yjs. **Each step green; each revertible; the hot path never
in the loop.**

## 12. Decisions & open questions

**Decided (this session):**

- **D1 — relocate `ColumnStore`/`DirtyBatcher`** into `@invana/canvas-state` (leaf can't depend back
  on canvas; this is the clean way for it to own the data hot path). `@invana/canvas` re-exports.
- **D2 — supersede `Store.ts`/`createLayerStore`** with the port + zustand adapter (one wrapper).
- **D3 — `view.interaction` *owns* selection/hover/states** (M2 migrates `ClickSelectBehaviour`
  maps + `GraphStore` presence). Single source, collab-replicable.
- **D4 — telemetry emits structured *events*** (`{action, changedPaths, patch, ts, actor?}`); the
  app's OTel adapter maps to spans/metrics. Engine stays exporter-agnostic.
- **D5 — `useStore` lives in `canvas-react`** (canvas-state stays framework-agnostic).
- **D7 — `CanvasState` *owns* the per-layer `DataStore`s** (not register/reference). Data is set on
  `state.data[id]`; layers read/subscribe. Cleaner single source of truth; **larger blast radius** —
  `GraphLayer`/`<GraphLayer data>` and `GraphStore` ownership change (see §10.3).
- **D8 — group geometry** recomputes on layout-`end`/drag-settle (throttled for bubble-sets); the
  graph `GroupGeometryDeriver` lives in `@invana/graph`.
- **D9 — group *membership* syncs** (authored, in the doc); group *geometry* stays derived/local.
- **D6 — collaboration backend = Yjs/Automerge CRDT** — committed (was deferred). Behind the port +
  Awareness; built through M0–M4, swapped in at M5 (§9).
- **D10 — all state manipulation goes through `CanvasState`** (C10); renderers/React are pure
  projections. Data ingestion writes to `state.data[sourceId]`; existing entry points are sugar.
- **D11 — the selection *set* lives in `view.interaction.selection`** (not just visual state);
  `ClickSelectBehaviour` becomes a thin writer. Supersedes `store-owns-state-plan` D4 ("visual only").
- **D12 — developer API = read/update + operations layer** (§6.1–6.3, C12): `read`/`update`/`batch`
  primitives, named ops as domain sugar, composable user ops, history via `produceWithPatches` /
  Yjs `UndoManager`.
- **Naming — keep `DataLayer` / `dataLayerId`** (not renamed to sources). The "layer" overload is
  accepted; "data layer" (a source) vs "rendering layer" (`view.definition.layers`) is
  context-disambiguated.

**Locked by recommendation (impl details):** `select()` defaults to `Object.is`; `batch` is on the
core port; one `GroupLayer` renders all group shapes via a `shape` style; group ids share the
`view.interaction.states` id-space with nodes.

**Open:** none — all design decisions resolved. Remaining unknowns are implementation specifics
surfaced during M0+.

## 13. Relationship to other docs

- [designer-studio-plan.md](./designer-studio-plan.md) — the Designer page, a **consumer** of this state.
- [reactive-state-store-plan.md](./reactive-state-store-plan.md) — port/adapter rationale (M0/M1).
- [store-owns-state-plan.md](./store-owns-state-plan.md) — interaction ownership (M2) + the §0/§5 targeted-render invariant §7 preserves.
- [unified-canvas-options-plan.md](./unified-canvas-options-plan.md) — the `update()`/`setOptions` fan-out M0 backs with a store.
- [collaborative-state-plan.md](./collaborative-state-plan.md) — telemetry/Yjs/presence detail (M4/M5).
</content>
