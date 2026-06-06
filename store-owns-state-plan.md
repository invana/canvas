# Plan — make `GraphStore` the single owner of interaction state

**Goal.** Today the graph has *two* state owners and *two* render-trigger paths.
Bulk data lives in `GraphStore` and re-renders reactively through its `flush`
event; runtime interaction state (`highlighted` / `selected` / `hover` /
`context-open`) lives in a plain `Map` on `GraphLayer` and re-renders
*imperatively*, bypassing the store. This plan folds the second into the first
so the store owns the entire data + interaction state, every subscriber
(layer, minimap, future devtools) re-renders purely off store events, and
context-menu / behaviour actions collapse to a single store method call.

This is the "state-as-truth" model already described in
`packages/graph/CLAUDE.md` (§ *State vs. data*) but never implemented — the
package is still "skeleton" and interaction state is neither in the store nor
in the documented `Layer.state` zustand store; it's a bare `Map`.

---

## 0. Core invariant — unidirectional data flow

**Every change — document data *and* interaction state — is a write to the
store first. Rendering is a pure projection of store state. Nothing mutates
rendered output through a back channel.**

```
   USER INPUT                  SINGLE TRUTH                RENDER (subscribers)
  ┌───────────┐   mutate     ┌────────────┐  emit event   ┌──────────┐  project  ┌──────────┐
  │ Behaviour │ ───────────▶ │ DataStore  │ ────────────▶ │  Layer   │ ────────▶ │ Renderer │ ─▶ screen
  └───────────┘ addNodeState │ data +     │  node:state / │(subscribes)│rerenderNode│         │
   PRODUCER     updateNode   │ presence   │  node:update  └──────────┘            └──────────┘
                             └────────────┘                SUBSCRIBER / RENDER-DRIVER
```

**Roles (fixed):**
- **Behaviours = producers.** Translate user input → store mutations (writes).
  May *read* the store to decide what to write; never re-render, never touch the
  renderer.
- **Layers = subscribers / render-drivers.** Subscribe to store events and
  project each change to their renderer (targeted re-render). The only thing
  that drives the renderer.
- **Renderer = dumb projection target.** Never reads the store; driven solely by
  its layer.
- **Store = single source of truth.** The only place state changes; emits typed
  events on flush.

**Why this is the invariant:** telemetry, time-travel, and collaboration all
fall out for free — every change is one observable write, so the tap channel
sees everything (§6), undo is "replay inverse writes," and collab is "replay
peer writes." It is not aspirational; the engine's tap-channel telemetry already
assumes it.

**Three carve-outs (so the rule is enforceable, not litigated per PR):**

1. **One owner *per concern*, not one global object.** The graph data store owns
   nodes/edges/positions/interaction state. **Camera/viewport** (pan/zoom) is a
   *separate* state owner — not graph data, do not fold it into the store. The
   unidirectional rule applies *within* each store; there are a few authoritative
   stores, one per concern.
2. **Transient input *scaffolding* is view-local, not data.** The marquee
   rectangle during a lasso drag, the ghost line during drag-to-connect — UI
   chrome that may live in behaviour/overlay-local state. The rule binds the
   *result* of the gesture: the final selection / new edge / committed position
   writes to the store; the in-flight preview need not.
3. **Commit granularity for high-fan-out gestures.** "Write to store first" is
   about *what*, not *how often*. Dragging one node → write position per frame
   (O(1) + targeted render). Box-select sweeping 10k nodes → throttle the preview
   to overlay-local and commit to the store on mouseup; don't write 10k toggles
   per frame. Safe because the store updates **data synchronously** (read-after-
   write within a gesture is consistent) and only **defers the render flush** to
   the next frame (§5 perf invariants).

---

## 1. Current state (verified)

### Two owners

| State class | Owner today | Mutator | Render trigger |
|---|---|---|---|
| Structure, positions, style, `pinned`, **data-driven** `states[]` | `GraphStore` | `upsert/update/remove`, `setPinned`, … | `scheduleFlushIfNeeded()` → `doFlush()` → `events.emit('flush')` → layer subscriber repaints |
| **Runtime** states (`highlighted`, `selected`, `hover`, `context-open`) | `GraphLayer.nodeStates` / `edgeStates` : `Map<string, Set<string>>` (`GraphLayer.ts:194`) | `setNodeState` / `setEdgeState` / `clearNodeState` / `clearEdgeState` (`GraphLayer.ts:528-590`) | direct `rerenderNode(id)` — **no store event, no flush** |

### The seam

- `GraphNode.states: readonly string[]` exists in the store (`store/types.ts`,
  applied at `GraphStore.ts:426/576/826`).
- The layer mirrors it into its `Map` **one-way at write time** via
  `syncDataDrivenNodeStates` / `syncDataDrivenEdgeStates`
  (`GraphLayer.ts:1034-1073`), wired off `node:add` / `node:update`
  (`GraphLayer.ts:343`).
- Runtime toggles (a hover, a highlight) update the `Map` but **never flow back
  to `store.states`**, so the two diverge the instant anything interacts.
- Per `feedback_data_driven_state_field`: a data-feed `updateNode` with `states`
  is replace-on-update and **wipes runtime states**. That collision is a direct
  symptom of the split ownership and should disappear after this change.

### Render read path (unchanged by this plan)

`resolveNodeStyle` reads the active state set when building the per-node spec
(`GraphLayer.ts:654`, also `:1217`, `:1352`). After the migration it reads from
the store's set instead of the layer `Map`; the overlay-merge precedence
(CLAUDE.md § *Resolution precedence*) is untouched.

### Callers that toggle runtime state (must be migrated)

`grep` for `setNodeState|setEdgeState|clearNodeState|clearEdgeState|nodeStates|edgeStates`:

- `behaviours/ClickSelectBehaviour.ts` (`:532/533/600/601/606/607/651/656`)
- `behaviours/HoverActivateBehaviour.ts` (`:394-656`, many)
- `behaviours/LassoSelectBehaviour.ts` (`:452/453/466/467`)
- `behaviours/BrushSelectBehaviour.ts` (`:505/506/523/524`)
- `behaviours/ContextMenuBehaviour.ts` (`:224/225/236/237`)
- `layer/GraphLayer.ts` (owner — `setNodeState` etc. + `syncDataDriven*`)
- stories: `GraphVisualiser.stories.tsx` (highlight loops — the remaining hand-written case)

---

## 2. Target design

`GraphStore` owns the live active-state set per id and emits a typed event on
change. `GraphLayer` (and any other subscriber) reacts to that event the same
way it reacts to `node:update`.

### 2.1 Store: state ownership

Add to `GraphStore`:

```ts
// Live active-state sets — the single source of truth for interaction state.
private readonly nodeStateSets = new Map<string, Set<string>>();
private readonly edgeStateSets = new Map<string, Set<string>>();

addNodeState(id: string, name: string): void      // no-op if absent / already set
removeNodeState(id: string, name: string): void
clearNodeState(name: string): void                // strip `name` from every node
hasNodeState(id: string, name: string): boolean
nodeStatesOf(id: string): readonly string[]        // for resolveNodeStyle
*nodesWithState(name: string): Iterable<string>    // replaces layer iterator at :603
// …edge equivalents
```

- The store's existing `GraphNode.states` field becomes the **initial seed**:
  on `upsert`, seed `nodeStateSets` from `node.states`. The `Map` is then the
  authoritative live set; `states` on the cold record is kept in sync (or
  treated as seed-only — see Decision D1).
- Each mutator enqueues a change and `scheduleFlushIfNeeded()`, so it rides the
  existing frame/sync flush machinery — no new scheduler.

### 2.2 Store event

Extend `GraphStoreEventMap` (`store/types.ts:120`):

```ts
'node:state': { nodeId: string; name: string; on: boolean };
'edge:state': { edgeId: string; name: string; on: boolean };
```

Emitted from `doFlush()` alongside the existing `node:update` loop
(`GraphStore.ts:1047-1054`), deduped through the same enqueue/coalesce path
(`enqueue*` + the event-queue management at `:920`). The aggregate `flush`
counters get optional `*State` fields if cheap; otherwise leave counters as-is.

### 2.3 Layer: become a pure subscriber

- `nodeStates` / `edgeStates` `Map`s on the layer are **deleted**.
- New subscriptions in `onMount` (`GraphLayer.ts:353` area):
  `s.on('node:state', ({nodeId}) => this.rerenderNode(nodeId))` and the edge
  equivalent → `rerenderEdge`.
- `setNodeState(id, name, on)` / `setEdgeState` / `clearNodeState` /
  `clearEdgeState` on the layer are **deleted** (D2: store-only). Callers move to
  `store.addNodeState` / `removeNodeState` / `clearNodeState` — behaviours reach
  it via their existing `layer` ref (`this.layer.store.addNodeState(…)`).
- `resolveNodeStyle` reads `store.nodeStatesOf(id)` instead of the `Map`
  (`GraphLayer.ts:654/1217/1352`).
- `syncDataDrivenNodeStates` / `syncDataDrivenEdgeStates`
  (`GraphLayer.ts:1034-1073`) are **deleted** — the store now seeds from
  `states` at `upsert`, so the layer no longer mirrors. The `if ('states' in
  patch)` branches at `:343`/the node path go away.
- The `edge:remove` / `node:remove` cleanup of the layer `Map`
  (`:348` etc.) moves into the store's `removeNode`/`removeEdge`.

### 2.4 Graph-domain sugar (collapses the story loops)

On `GraphLayer` (thin, over the store) or directly on the store:

```ts
highlightNeighbourhood(id, dir: EdgeDirection = 'both', state = 'highlighted'): void
// store.batch(() => addNodeState(id) + addNodeState(each neighbour) + addEdgeState(each incident edge))
```

This is the one piece the working-tree change couldn't express as a single
call. With it, `GraphVisualiser`'s "Highlight neighbours" / "Highlight edge"
loops become one method call, matching the already-collapsed `selectAll` /
`selectNeighbourhood` / `focusNodes` / `reverseEdge`.

**Multi-write producers wrap in `store.batch()`** (see § 2.5) — the sugar does so
internally, so a caller highlighting an N-node neighbourhood gets one flush.

### 2.5 Render coalescing — `batch()` + layer dirty-set drain

Per-toggle events (D3) mean a producer touching N items emits N `node:state`
events. Two mechanisms keep that to **one paint and ≤1 spec-rebuild per item**,
reconciling granular events with render cost:

1. **`store.batch(fn)`** (already exists, `GraphStore.ts:725`) — suppresses
   flush while `batchDepth > 0`, so N writes coalesce into **one flush → one
   paint frame**. Every multi-write producer (the sugar, `selectAll`, lineage
   highlighting, …) wraps its writes in it.
2. **Layer dirty-set drain** — the layer's `node:state` / `edge:state` handlers
   must **not** `rerenderNode(id)` synchronously. They add the id to a
   `dirtyStateNodes` / `dirtyStateEdges` set; the existing `flush` handler drains
   it once (each unique id rebuilt at most once), exactly mirroring the
   `dirtyConnectors` drain already at `GraphLayer.ts:358-365`.

Result: render count = unique dirty items per frame, independent of event count.
Events stay granular (telemetry / collab); rendering is coalesced.

**Known follow-up (not now):** extreme bulk (e.g. `selectAll` over 100k) still
emits 100k envelopes to the tap. If that profiles hot, add a single
`node:state-bulk { name, ids[], on }` event for the mass-operation path only — a
deliberate, narrow revisit of D3, logged here rather than built.

---

## 3. Migration steps (ordered, each compiles)

1. **Store core** — add `nodeRuntimeStates`/`edgeRuntimeStates` (the *presence*
   compartment, separate from cold `states[]`), the `add/remove/clear/has`
   methods + `nodeStatesOf` (= `states[]` ∪ runtime set, for the renderer) +
   `nodesWithState` iterator. No seeding from `states[]` (D1: independent
   compartments). Clean up the runtime set on remove. No event yet; pure data.
2. **Store event + bus wiring** — extend `GraphStoreEventMap`; enqueue + emit
   `node:state` / `edge:state` in `doFlush`. Promote `GraphStore.events` to a
   bus-wired `SourceEmitter` (`{ kind:'store', id }`); layer calls
   `store.events.setBus(ctx.events)` in `onMount` so all store mutations reach the
   telemetry tap (§6).
3. **Layer subscribe + read** — `node:state`/`edge:state` handlers add the id to
   a `dirtyStateNodes`/`dirtyStateEdges` set (NOT a synchronous `rerenderNode`);
   the existing `flush` handler drains them once (§2.5). Point `resolveNodeStyle`
   at `store.nodeStatesOf`. Temporarily keep the old `Map` so nothing breaks
   mid-migration (removed in step 4).
4. **Layer cleanup** — delete `nodeStates`/`edgeStates` `Map`s, `syncDataDriven*`,
   **and** `setNodeState` / `setEdgeState` / `clearNodeState` / `clearEdgeState`
   (D2: store-only — no forwards left behind).
5. **Behaviours** — repoint `ClickSelect` / `Hover` / `Lasso` / `Brush` /
   `ContextMenu` from `layer.setNodeState` to `store.addNodeState` (via
   `layer.store.` — they already hold a `layer` ref). The `nodesWithState`
   iterator the Lasso/Brush clear paths use moves to the store too.
6. **Sugar** — add `highlightNeighbourhood` (+ edge variant), wrapping its writes
   in `store.batch()` (§2.5).
7. **Stories** — collapse `GraphVisualiser` highlight loops to the sugar call;
   verify `GraphModeller` still compiles (it doesn't touch runtime state much).
8. **TSDoc** — document the new store methods/events and the ownership change;
   update `packages/graph/CLAUDE.md` § *State vs. data* to match reality.

No tests for `packages/canvas`; `@invana/graph` has its own — add store-level
coverage for the new state methods/events if the package's test convention
warrants (confirm before writing).

---

## 4. Decisions to confirm before coding

- **D1 — `states[]` field vs live `Set`. → DECIDED: two compartments, union at read.**
  `GraphNode.states` (cold record) stays the **document** active-states list —
  feed-owned, replaced on `updateNode`, part of `getNode()`, persisted. A
  **separate** runtime `Set` per id is the **presence** active-states compartment
  — interaction-owned (hover / selected / highlighted), ephemeral, never
  persisted. The two are **independent**: the runtime `Set` is *not* seeded from
  `states[]` and *never* written back to it. **Effective active states =
  `states[]` ∪ runtime `Set`, computed at read** in `resolveNodeStyle`
  (`store.nodeStatesOf(id)`). The rejected alternative (fold toggles back into
  `states[]` — one merged list) is actively harmful: it reclassifies every hover
  as a document edit and re-introduces the replace-on-update wipe. Keeping them
  separate is exactly what *kills* the wipe (a feed replacing `states[]` can't
  touch the runtime `Set`) — see § 5.

  This decision is driven by two forward-looking requirements: **near-future
  live collaboration** (presentation / multi-user boards where user A's
  interactions appear on user B's screen) and **100k-node / 200k-edge render
  performance**. Both push the same way. See § 5.

- **D2 — keep `layer.setNodeState` forwards? → DECIDED: remove, store-only.**
  `layer.setNodeState` / `setEdgeState` / `clearNodeState` / `clearEdgeState` are
  **deleted**. The store is the single surface for interaction state; every
  caller switches to `store.addNodeState` / `removeNodeState` / `clearNodeState`
  (+ edge variants). No dual API to keep in sync. This enlarges the behaviour
  diff (the 5 behaviours reach `layer.store.` instead of `layer.`) and is a
  breaking change for any external `layer.setNodeState` caller — acceptable given
  the package is pre-release ("skeleton").
- **D3 — event granularity. → DECIDED: per-toggle.** One `node:state` /
  `edge:state` event per id+name change, deduped through the existing per-flush
  event queue (same path as `node:update`). The layer's targeted
  `rerenderNode(id)` consumes each directly. No batch event shape. Revisit only
  if profiling shows churn (e.g. hover sweeping thousands of nodes); the
  compartment + targeted-render invariants from § 5 already bound the cost.
- **D4 — should the selection set move too? → DECIDED: visual state only.**
  This migration moves the *visual* interaction state (the `selected` /
  `highlighted` / hover render overlays) into the store. `ClickSelectBehaviour`
  **keeps** owning its selection `Map` as the semantic source behind
  `select` / `selectMultiple` / `selectAll` / `clearSelection` and its
  selection-change event. Relocating the selection set itself into the store
  (so "what is selected" is store-owned + collab-replicable) is a **separate
  follow-up**, deliberately not coupled to proving the state machinery here.

---

## 5. Forward-looking: collaboration + 100k-scale performance

"Single store as truth" is the right foundation for both live collaboration and
scale — but **single truth ≠ one field**. The store owns *two compartments*,
kept structurally distinct so they can be replicated and rendered on different
paths later without a rewrite now.

### Two compartments inside the one store

| | **Document state** | **Presence / interaction state** |
|---|---|---|
| What | nodes, edges, positions, styles, data-driven `states[]` | hover, selection, highlight, context-open |
| Lifetime | durable, persisted | ephemeral, never persisted |
| Convergence | must converge — every client agrees | last-write-wins; clients may legitimately differ |
| Namespacing | shared document | **per-user** (A's hover ≠ B's hover; show both) |
| Frequency | low | very high |
| Store event | `node:update` / structural | `node:state` (distinct type — never reuse `node:update`) |

This table *is* the justification for D1 = seed-only: the live `Set` is the
presence compartment; `states[]` on the cold record is document data. Folding
toggles back into `states[]` (the rejected D1 alt) would reclassify every hover
as a *document edit* — persisted, conflict-resolved, converged across clients.
That is both a correctness mess (A's hover conflicts with B's real edit) and a
perf disaster (every mouse-move becomes a durable mutation).

### Collaboration (near-future)

The store's typed event stream is the replication channel. A future collab
adapter subscribes to `store.events`, serializes deltas, ships to peers, and
applies inbound deltas to the local store (which re-emits → re-renders). Because
the two compartments emit *distinct* event types, the adapter routes them to
*different transports*:

- **Document edits** (`node:update`, structural) → durable, ordered,
  conflict-resolved channel (CRDT/OT), persisted.
- **Presence** (`node:state`) → cheap, throttled (~10–20 Hz), last-write-wins,
  not persisted.

**Forward hook to build now (cheap, no behaviour change):** shape the state API
to accept an optional actor —
`addNodeState(id, name, opts?: { actor?: string })` — even though `actor` is
unused in single-user mode. This is the one seam that lets presence become
per-user later without touching the signature. The live `Set` can stay a plain
`Set<string>` today; when collab lands it becomes keyed by `name` →
`Set<actor>` (or the render reads an actor→states map) so two users' selections
co-exist and tint differently.

### Performance at 100k nodes / 200k edges

Render cost is governed by **render granularity, not where state lives**. Three
invariants the migration must hold:

1. **Mutations are O(1) / O(neighbourhood), never O(N).** A hover touches one
   node; `highlightNeighbourhood` touches ~degree items. Graph size is
   irrelevant to mutation cost.
2. **`node:state` drives a *targeted* `rerenderNode(id)` — never a full
   repaint.** The event carries the specific id; the layer subscriber re-renders
   only that node/edge. The current `setNodeState → rerenderNode(id)` is already
   surgical; folding into the store must preserve this and must **not** route a
   hover through the coarse `flush → repaint-all` path. This is the single
   biggest perf risk of the migration and is an explicit non-goal to break.
3. **Frame-mode flush coalesces churn.** Mouse dragging across nodes yields
   hover-off + hover-on per RAF; the store batches per frame, so it's a couple
   of targeted re-renders per frame regardless of pointer speed.

**Eventual scale path (aligns with `Layer.data` ColumnStore in CLAUDE.md):**
represent interaction state as a per-instance GPU attribute — a `stateFlags`
column in a typed array. Toggling state = write one slot + mark that instance
dirty; the GPU re-tints without rebuilding any scene-graph node. Keeping
presence in its **own** compartment (not interleaved with document fields) is
exactly what makes that future split clean. Out of scope for this migration, but
the compartment boundary is drawn here so it's free later.

---

## 6. Telemetry / event-bus wiring

The engine already has the telemetry mechanism: `CanvasEventBus` (`canvas.events`)
exposes a **tap channel** — any `SourceEmitter` (canvas / layer / behaviour)
auto-forwards a structured envelope `{ type, timestamp, source:{kind,id},
payload }` to every tap subscriber, with built-in `exclude` / `sampleRate`
filtering:

```ts
canvas.events.tap((e) => sendToDatadog(e));                 // sees everything bus-wired
canvas.events.tap((e) => costlyAnalytics(e), { sampleRate: 0.1 });
```

**Gap (verified) — the source of truth is not on the tap today:**

| Emitter | Type | On tap? |
|---|---|---|
| `Canvas.events` | `CanvasEventBus` | ✅ (the tap host) |
| Renderer pointer events (`shape:click`…) | bus-wired | ✅ |
| `Layer.events` (`data:changed`) | `SourceEmitter` + `setBus(ctx.events)` | ✅ |
| **`GraphStore.events`** (`node:add/update`, **`node:state`**) | plain `EventEmitter` (`GraphStore.ts:89`) | ❌ |
| **`ClickSelectBehaviour.events`** (`selection:change`) | plain `EventEmitter` (`:198`) | ❌ |

The store — the very thing we're consolidating into — is invisible to telemetry,
so the new `node:state` events would be too. Fix it **as part of step 2**, while
we're already in the store:

- **(a) Promote `GraphStore.events` to a bus-wired `SourceEmitter`**
  (`{ kind: 'store', id }`). The layer calls `store.events.setBus(ctx.events)` in
  `onMount` (same pattern `Layer` already uses for itself). Then every store
  mutation — document edits **and** `node:state` toggles — reaches the tap, tagged
  `source.kind = 'store'`. One line on mount.
- **(b) Optionally promote behaviour emitters** (`ClickSelectBehaviour.events`,
  …) to `SourceEmitter`s, giving *intent*-level telemetry ("user selected 5
  nodes") distinct from the resulting *data* mutations.

With (a) [+ (b)], one `canvas.events.tap(...)` reconstructs the whole loop —
*what the user did* (behaviour intent) → *what changed* (store mutations incl.
`node:state`) → *what re-rendered* (layer `data:changed` counters) — each
timestamped and source-tagged, so interaction→render latency and mutation rates
are directly measurable. This is the §0 invariant paying off: because every
change is one store write, the tap sees the complete truth stream.

---

## 7. Domain extensibility (ER diagrams / lineage)

The store must stay **domain-agnostic** so future domains (ER diagrams, lineage
graphs, …) reuse it without it learning their vocabulary. The litmus test:
*can the domain be expressed as generic primitives + a wrapper, without the base
store growing domain fields?* For ER, yes.

### Three ways to extend — preference order

1. **Payload (`data: D`)** — put domain structure (table columns, PK/FK,
   cardinality) in the opaque `data` of nodes/edges. **No store change.** Covers
   ~all of ER, because ER data isn't the bulk-numeric data the hot columns exist
   for.
2. **Composition wrapper** — for domain-specific *queries/indices*, wrap (don't
   subclass): `ERStore` holds a `GraphStore`, maintains derived indices by
   **subscribing to `store.events`**, and delegates the rest. Stays consistent
   via the same unidirectional event stream this plan builds.
3. **Subclass for hot columns** — ⚠️ **not cleanly supported today** and **not
   needed for ER.** `NODE_SCHEMA`/`EDGE_SCHEMA` are module-level `const`s
   (`GraphStore.ts:33,40`) and internals are `private`, so a subclass can't add
   typed-array columns without editing `GraphStore`. This contradicts the
   long-term "`ColumnStore` extensions" vision in `packages/graph/CLAUDE.md`,
   which is designed but unbuilt. Only revisit (configurable schema + `protected`
   hooks) if a future domain has genuinely bulk, high-frequency numeric per-item
   data. ER does not.

**Rule:** ER-specific fields never become first-class store columns — they live
in `data: D`. The moment the store knows about "columns," it stops being
reusable for the next domain.

### Modelling choices that make ER work on the same store

- **Columns as child nodes** (`parentId = tableId`) when they need their own
  identity / interaction / adjacency (e.g. column-level lineage). They then get
  ids, state, and edges for free. If columns are display-only, leave them in the
  table's `data` payload + a `CompositeShape` renderer.
- **Edge `type` is free-form** → traversal filters on `type === 'fk'` /
  `'lineage'` to follow only the relevant links. Cross-table column edges connect
  any node ids regardless of `parentId`, so they just work.
- **State is name-based** → ER state names (`conflict`, `deprecated`,
  `lineage`, …) need no store change.
- **Sub-node ports** (an FK anchoring to a specific column row of a composite
  table) are an **anchor-stage** concern in the connector pipeline, not a store
  concern — additive (`sourcePort`/`targetPort` on edge style), no store surgery.

### Layering example — column lineage highlight

The recurring question is *where domain logic lives*. Answer: **split by
concern**, along the same producer/consumer line as everything else.

- **Traversal mechanics → generic, on the store (or a free fn).** A reachability
  primitive composed from the existing 1-hop `neighborsOf` / `edgesOf`:
  `*reachable(seed, { dir, maxDepth, edgeFilter })`. Domain-agnostic, reusable.
- **Domain policy → ER query (free fn or `ERStore` wrapper, public read API
  only — *not* a subclass).** Supplies the edge filter that defines lineage:

  ```ts
  function columnLineage(store, columnId, dir = 'both') {
    const nodes = new Set(), edges = new Set();
    for (const { node, viaEdge } of store.reachable(columnId, {
      dir, edgeFilter: (e) => e.type === 'lineage' || e.type === 'fk',
    })) { nodes.add(node); edges.add(viaEdge); }
    return { nodes: [...nodes], edges: [...edges] };
  }
  ```

- **Interaction → behaviour (producer).** Decides *when* (on column click), runs
  the query (READ), writes the highlight (WRITE), batched:

  ```ts
  class ColumnLineageBehaviour {          // PRODUCER — read → write, never renders
    onColumnClick(columnId) {
      const { nodes, edges } = columnLineage(store, columnId);   // READ
      store.batch(() => {                                        // WRITE — one flush
        store.clearNodeState('lineage'); store.clearEdgeState('lineage');
        for (const n of nodes) store.addNodeState(n, 'lineage');
        for (const e of edges) store.addEdgeState(e, 'lineage');
      });
    }
  }
  ```

**Verdict:** the graph algorithm does **not** belong in the behaviour (reuse /
testability / data-semantics-belong-with-data), and the interaction trigger does
**not** belong in the store. Mechanics low (generic store primitive), policy in
the middle (domain query / `ERStore`), interaction at the top (producer
behaviour). The same `GraphStore` + the state model in this plan support it
unchanged.
