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
5. Package/file structure · 6. How it's consumed · 7. Performance · 8. Telemetry ·
9. Collaboration · 10. **Migration & impact** · 11. Milestones · 12. Open decisions

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
| C9 | **`CanvasState` owns the per-layer `DataStore`s** (D7) — data is set on `state.data[id]`; layers read/subscribe rather than owning their own store. Single source of truth for save-load/collab; enlarges the migration (`GraphLayer`/`GraphStore` ownership, §10.3). Collab **backend deferred** (D6) — built behind the port, chosen at M5. |

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
│   └── CanvasState.ts
└── tests/           port-swap proof · deepMerge · telemetry · ColumnStore
```

React bindings stay **out** (framework-agnostic core). `useStore(store, selector)` lives in
`@invana/canvas-react` via `useSyncExternalStore`. `GraphStore` stays in `@invana/graph` as a
domain subclass of `DataStore` (canvas-state stays domain-free).

## 6. How it's consumed

- **Engine.** `Canvas` holds a `CanvasState`. `Canvas.update(patch, action)` → `state.view.update`
  + the existing `setOptions` fan-out; `Canvas.get()` → `state.view.getState()`. **`CanvasState`
  *owns* the per-layer `DataStore`s** (D7): data is set on `state.data[id]`, and a layer reads /
  subscribes to `state.data[dataLayerId]` rather than owning its own store.
- **React.** `useStore(state.view, selector)`; editors write `state.view.update(patch, action)`.
  No component copies. `<GraphLayer data>` sets `state.data[id]` (owned store), not a layer-local copy.
- **Viewers** read **both**: `state.view.subscribe` (how) + `state.data[id].on('flush')` (what+where).

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

**Backend deferred (D6).** We do **not** commit to Yjs/Automerge vs a Postgres-native sync engine
now — M0–M4 (store + telemetry) are built behind the `ReactiveStore` port, which keeps the backend
swappable; the choice is made at **M5** when `invana-backend`'s needs (offline depth, queryability)
are concrete. What *is* fixed regardless of backend: a sync adapter behind the **same port**
(`update` → a txn) + an **Awareness/presence** channel, and the three-channel physics —
`view.definition` → **Doc** (persisted, converged); `view.interaction` (selection/hover/camera) →
**Awareness** (ephemeral, per-user); `data` positions + bulk payloads → **data channel** (derived
locally / streamed), **never** synced. Hard invariant: **definition + awareness sync; positions +
bulk don't.** Consumers unchanged across the swap.

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

**Open:**

- **D6 — collaboration backend (DEFERRED to M5).** Yjs/Automerge CRDT vs a Postgres-native sync
  engine (ElectricSQL/Zero/PowerSync/Supabase). Built behind the port until then; pick when
  `invana-backend`'s offline-depth + queryability needs are concrete (§9).

## 13. Relationship to other docs

- [designer-studio-plan.md](./designer-studio-plan.md) — the Designer page, a **consumer** of this state.
- [reactive-state-store-plan.md](./reactive-state-store-plan.md) — port/adapter rationale (M0/M1).
- [store-owns-state-plan.md](./store-owns-state-plan.md) — interaction ownership (M2) + the §0/§5 targeted-render invariant §7 preserves.
- [unified-canvas-options-plan.md](./unified-canvas-options-plan.md) — the `update()`/`setOptions` fan-out M0 backs with a store.
- [collaborative-state-plan.md](./collaborative-state-plan.md) — telemetry/Yjs/presence detail (M4/M5).
</content>
