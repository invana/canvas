# GraphStore — implementation plan

::: warning Planning doc — not user-facing
This page is an implementation plan for `GraphStore`, the data layer of `@invana/graph`. Once the store ships, the user-facing description lives in [`data-model.md`](./data-model.md) and this page goes away.
:::

## Goal

Add a `GraphStore` class inside `@invana/graph` that owns nodes, edges, and their parent–child relationships. `GraphLayer` becomes a subscriber to the store, not the owner of the data. Layouts read from and write back to the store.

The store stays domain-light: nodes and edges with arbitrary `data`. ER diagrams, BPMN, knowledge graphs, petroleum P&ID, and property graphs are all use-conventions on top of the same primitive.

## Architectural decision — compose `ColumnStore`, do not reinvent

`@invana/canvas` already ships `ColumnStore` (at `packages/canvas/src/state/ColumnStore.ts`) — a generic, schema-driven, typed-array column store with bulk ops, slot recycling, geometric grow, `version` counter, and a `column(name)[slot] = v` fast path at ~10 ns/write. The repo's `architecture-proposal.md` §2.1 calls this the "bifurcated state" model: `Store<T>` (zustand+immer) for small observable interaction state, `ColumnStore` for bulk hot data.

`GraphStore` is a **composer** on top of `ColumnStore`. It uses two `ColumnStore` instances (one for nodes, one for edges) for hot fields, plus cold `Map<id, payload>` stores for non-hot fields, plus graph-specific indices (adjacency, parent→children, pending-edge buffer). All typed-array storage, growth, version counting, and slot recycling come from `ColumnStore`.

Non-graph visualizations (free-form annotations, CAD-style canvases, sequence diagrams) that don't need adjacency or parent–child indices use `ColumnStore` directly via `@invana/canvas` without `@invana/graph` in the picture at all.

## Agreed design (decision log)

| # | Decision | Rationale |
|---|---|---|
| 1 | **`parentId` is purely a logical relationship in the store.** Rendering treatment is a property on the parent node (`data.containerKind: 'container' \| 'group'`). | Keeps the store primitive; container vs hull rules live where they belong (layer + layout). |
| 2 | **One store. Property-graph base. KG is a usage convention.** Edges have `id, source, target, type?, data?`. | A property graph is a strict superset of RDF. No "KG mode" toggle. |
| 3 | **All edges directed. Multi-edges allowed.** | KG needs multiple predicates between the same pair; FKs are directed. Restricting now is painful to undo. |
| 4 | **Store owns positions.** Every node has an optional `position`. A separate `pinned: boolean` flag means "layout, don't move me." | Single source of truth. Renderer reads one place. Snapshots are complete. |
| 5 | **`setPosition(id, pos, { silent })` for sim-tick writes.** Skips event emission, bumps `version`. Renderer reads on RAF. | Solves the 60fps event-flood without splitting the data into two homes. |
| 6 | **Fine-grained events + version counter + `batch()`.** | Fine-grained for incremental rendering; version for cheap "anything changed?"; batch to coalesce bulk imports. |
| 7 | **Referential integrity is strict.** `addEdge` throws on unknown endpoints. `removeNode` defaults to `cascade: true`. | Catches bugs early; matches 99% of UI flows. |
| 8 | **ER columns are nodes, not table-fields.** `parentId = tableId`, `containerKind: 'container'` on the table. FKs are `column → column` edges. | Generalizes to BPMN, frames, swimlanes. Enables per-column selection / hover / routing. |
| 9 | **Hybrid storage: cold fields in `Map<id, payload>`, hot fields in `ColumnStore`.** Position + pin flag + tombstone bit live in the node `ColumnStore`. Edge source/target slot indices live in the edge `ColumnStore`. User `data`, `parentId`, edge `type` live in the cold maps. | `Map` for ergonomic random-access updates of arbitrary payloads; typed arrays for sim-tick writes and zero-allocation iteration. This is what react-flow + sigma do at scale. |
| 10 | **Adjacency is flat `Int32Array`-per-node, not `Set`.** `outEdgesOf(u)` returns a `subarray` view of edge-slot indices. Insert appends; remove swap-pop. | Set iteration in V8 is ~3× slower than typed-array; sub-array views avoid per-call allocation. Swap-pop keeps remove O(1). |
| 11 | **Stable slot indices for the node's lifetime.** `GraphStore` wraps `ColumnStore.remove` to tombstone-without-recycle by default; explicit `compact()` reclaims slots. | Renderer batch buffers, layout caches, and adjacency arrays can hold slot indices without invalidation logic. |
| 12 | **Frame-coalesced flush mode for streaming feeds.** Constructor option `flushMode: 'sync' \| 'frame'`. In `'frame'` mode every mutation auto-joins an implicit batch that flushes once per animation frame. | A WebSocket delivering 1k msgs/sec produces 1k event flushes in `'sync'` mode — subscribers drown. `'frame'` mode caps flushes at 60/sec regardless of arrival rate. |
| 13 | **Out-of-order edge policy is configurable.** Per-store option `unknownEndpoint: 'throw' \| 'buffer' \| 'drop'`. Default `'throw'` (matches decision 7). `'buffer'` queues the edge until its endpoints arrive; `'drop'` silently discards. | Streaming feeds frequently deliver an edge before both endpoints. Throwing kills the stream; buffering matches AIS / SSE realities; dropping suits sampled or partial feeds. |
| 14 | **`upsertNode` / `upsertEdge` for streaming feeds.** Add-if-absent / merge-update-if-present. `addNode` stays strict and throws on duplicates. | Real feeds re-deliver ids. Strict `add` catches bugs; `upsert` is the streaming-friendly path. |

## Target types

```ts
// Core records — cold maps key off id; hot fields live in ColumnStore slots.
export interface GraphNode<D = unknown> {
  id: string;
  data?: D;
  parentId?: string;
  position?: { x: number; y: number };  // optional; defaults to (0, 0) if absent
  pinned?: boolean;
}

export interface GraphEdge<D = unknown> {
  id: string;
  source: string;
  target: string;
  type?: string;          // predicate, FK label, "calls", etc.
  data?: D;
}

// Event payloads
export type GraphStoreEvent =
  | { kind: 'node:add';      nodeId: string }
  | { kind: 'node:update';   nodeId: string; patch: Partial<GraphNode> }
  | { kind: 'node:remove';   nodeId: string }
  | { kind: 'edge:add';      edgeId: string }
  | { kind: 'edge:update';   edgeId: string; patch: Partial<GraphEdge> }
  | { kind: 'edge:remove';   edgeId: string }
  | { kind: 'edge:orphaned'; edgeId: string };  // unknownEndpoint='buffer' + TTL elapsed

export interface GraphStoreOptions {
  flushMode?: 'sync' | 'frame';                         // default 'sync'
  unknownEndpoint?: 'throw' | 'buffer' | 'drop';        // default 'throw'
  pendingEdgeTTL?: number;                              // frames; default Infinity
  initialCapacity?: number;                             // pre-size node/edge ColumnStores
}
```

## Architecture

```
                     @invana/graph (GraphStore)
                     ┌───────────────────────────────────────────────────────────┐
                     │  Cold (Map<id, payload>):                                  │
                     │    nodes: Map<string, GraphNode>      // data, parentId    │
                     │    edges: Map<string, GraphEdge>      // data, type        │
                     │    childrenIndex: Map<parentId, Set<childId>>              │
                     │    pendingEdges: Map<missingId, GraphEdge[]>               │
                     │                                                            │
                     │  Hot (ColumnStore × 2):                                    │
                     │    nodeCols: ColumnStore<{ x: f32, y: f32, flags: u8 }>    │
                     │       flags: bit0 = pinned, bit1 = tombstone               │
                     │    edgeCols: ColumnStore<{ srcSlot: i32, dstSlot: i32 }>   │
                     │                                                            │
                     │  Adjacency (Int32Array per node slot):                     │
                     │    outAdj: Int32Array[]   // outAdj[u][0..outDeg[u]]       │
                     │    inAdj:  Int32Array[]                                    │
                     │    outDeg: Int32Array     // parallel to nodeCols slots    │
                     │    inDeg:  Int32Array                                      │
                     │                                                            │
                     │  Reactivity:                                               │
                     │    events: EventEmitter<GraphStoreEventMap>                │
                     │    batch(fn)        — explicit coalesce                    │
                     │    flushMode:'frame' — implicit RAF coalesce               │
                     └────────────────────────────┬──────────────────────────────┘
                                                  │  composes
                     ┌────────────────────────────▼──────────────────────────────┐
                     │  @invana/canvas  ColumnStore<TSchema>                      │
                     │   (typed arrays, slot recycling, version, geometric grow)  │
                     │  @invana/canvas  EventEmitter<E>                           │
                     └────────────────────────────────────────────────────────────┘
```

Key reuse from `ColumnStore`:
- `add(id, row)` / `addBulk(items)` / `remove(id)` / `set` / `update` / `clear` — the CRUD ops on hot fields.
- `column(name)[slot] = v` + `touch()` — silent position-write fast path. No event, no allocation.
- `slot(id)` — id → slot for adjacency array indexing.
- `version` getter — exposed on `GraphStore.version` (combined with structural change counter).
- Geometric grow + slot recycling — free.

Graph-specific additions built in `@invana/graph`:
- Cold `Map<id, GraphNode>` / `Map<id, GraphEdge>` for arbitrary user payloads.
- `outAdj` / `inAdj` adjacency arrays with swap-pop remove and geometric grow.
- Parent → children index `Map<string, Set<string>>`.
- Pending-edge buffer keyed by missing-endpoint id.
- `EventEmitter<GraphStoreEventMap>` from `@invana/canvas`.
- `batch()` queue + frame-flush scheduler.
- Slot-stability wrapper around `ColumnStore.remove` (tombstone-instead-of-recycle).
- Cycle detection on `parentId` writes.

## Performance design

Target envelope:

- **Capacity**: up to 1M nodes / 5M edges in memory (typed-array headroom).
- **Interactive ceiling** (everything visible, no LOD/aggregation in the layer): 100k nodes / 500k edges.
- **Sim tick rate**: 60 fps (`setPositionsBulk` silent writes).
- **Streaming inserts**: 10k mutations/sec sustained, 50k/sec bursts. Frame-coalesced into ≤ 60 flushes/sec to subscribers.

### Mutation cost ceilings

Measured numbers below are from the Phase 1 benchmark suite on a baseline dev machine (Apple M-series, Node 22). They will vary on other hardware — treat them as ballpark, not contracts.

| Operation | Target | Measured | How |
|---|---|---|---|
| `addNode` | < 1 µs | ~360 ns p50 | Map.set + `ColumnStore.add` + adjacency-array entry init. |
| `addEdge` | < 1 µs | ~1 µs p50 | Map.set + `ColumnStore.add` + 2× adjacency append. |
| `removeNode` (cascade) | < 100 µs at avg deg ≈ 10 | ~42 µs | Iterate `outAdj` + `inAdj`, remove each edge, tombstone the node. |
| `setPositionsBulk` (silent) for 100k | < 5 ms | ~3 ms | Single tight loop, two columns. |
| `neighborsOf(u)` first item (generator) | < 1 µs | ~540 ns | `outAdj[u].subarray(0, outDeg[u])` + edge-slot → id lookup. A non-generator `firstNeighborOf` fastpath can hit < 50 ns; not in Phase 1 since real consumers iterate many neighbors per call (per-iteration cost is much lower than first-yield cost). Reach for that if profiling demands. |
| `addNodesBulk(100k)` | < 50 ms | ~38 ms | `ColumnStore.addBulk` + cold Map fill + one event flush. |
| `addEdgesBulk(500k)` | < 1 s | ~620 ms | Each edge still pays adjacency-index updates; bulk amortizes the flush but not the per-edge index cost. |
| Streaming 10k mut/sec for 60 s | 0 dropped frames at 60fps | ~145 µs per frame, ~9 ms total for 60 frames | `flushMode: 'frame'` coalesces to one flush/frame. Plenty of headroom under the 16.6 ms frame budget. |
| Out-of-order admit (`unknownEndpoint: 'buffer'`) | < 5 µs / edge | ~3.5 µs / edge | Park 10k edges, then arrive 20k nodes; admit cost dominated by `ColumnStore.add` + adjacency append. |

These are *current* measurements, not floors. Phase 5 polish may improve any of them — `addEdgesBulk` and neighbor-lookup are the obvious targets if profiling demands.

### Event-flood avoidance

Four layers of defense:

1. **`silent: true` on `setPosition` / `setPositionsBulk`** — no event, just `ColumnStore.column(name)[slot] = v` + `touch()`. Renderer reads on its own RAF tick.
2. **`batch(fn)` coalesces** — many CRUD calls inside one batch produce one flush at exit. `node:update` for the same id deduplicates (last patch wins).
3. **`flushMode: 'frame'` auto-batches** — all mutations join an implicit RAF-aligned batch. A WebSocket calling `addNode` 1000× in a frame produces *one* aggregated flush.
4. **Silent fastpath skips allocation entirely** — no event payload object created for sim ticks. Non-silent paths allocate normally; ugly micro-opts there aren't worth the API cost.

### Streaming inserts

Expected pattern:

```ts
const store = new GraphStore({
  flushMode: 'frame',              // coalesce mutations to RAF
  unknownEndpoint: 'buffer',       // hold edges until endpoints arrive
});

socket.on('message', (msg) => {
  if (msg.kind === 'vessel')   store.upsertNode({ id: msg.id, data: msg, position: msg.pos });
  if (msg.kind === 'position') store.setPosition(msg.id, msg.pos);
  if (msg.kind === 'route')    store.addEdge({ id: msg.id, source: msg.from, target: msg.to });
});
// no explicit batch() — flushMode:'frame' coalesces.
```

Frame-flush mechanics:

- First mutation in a frame schedules `requestAnimationFrame(flush)`.
- Subsequent mutations append to the same pending event list.
- On RAF, the store fires one `node:add` event carrying all added ids, one `node:update` per affected id (deduped), etc.
- `version` bumps synchronously on every mutation regardless — useful for non-subscribing diff checks.

Out-of-order edges (`unknownEndpoint: 'buffer'`):

- Edge whose source or target is missing is parked in a pending list keyed by the missing endpoint id.
- When the missing node arrives, its pending edges are admitted in arrival order; they join the same frame's flush.
- Pending > `pendingEdgeTTL` frames emits `edge:orphaned` and drops.

Not the store's responsibility:

- **Eviction / sliding window** — caller calls `removeNode` to bound memory.
- **Reconnect replay** — caller chooses `store.clear()` vs merge on reconnect.
- **Server-side filtering** — transport problem.

### Explicit non-goals

- **No CSR (Compressed Sparse Row) adjacency** — rebuild-on-insert kills realtime.
- **No Wasm** — until profiling proves JS-bound.
- **No SharedArrayBuffer / worker-offload of the store** — layouts in workers is a separable future option; store stays main-thread.
- **No async API** — everything is sync. Streaming feeds use `flushMode: 'frame'` or wrap chunks in `batch()`.
- **No reinvention of typed-array storage** — that's `ColumnStore`, already shipped.

### Benchmarks (must exist before Phase 1 PR merges)

Land in `packages/graph/src/store/__bench__/`, runnable via `pnpm --filter @invana/graph bench`:

- `bench-insert.ts` — 100k nodes + 500k edges, per-op p50/p99.
- `bench-neighbors.ts` — random-walk 1M neighbor lookups on a 100k-node graph.
- `bench-sim-tick.ts` — `setPositionsBulk` on 100k nodes for 60 frames.
- `bench-remove.ts` — cascade-remove 10k random nodes from a 100k-node graph.
- `bench-batch.ts` — 1k inserts in a `batch()`, measure flush cost.
- `bench-stream.ts` — 10k mut/sec sustained for 60s under `flushMode: 'frame'`. Tracks peak frame budget, dropped frames, memory growth.
- `bench-orphan.ts` — 50% of edges arrive before endpoints; admit latency and pending-list memory.

## Public surface (sketch)

```ts
class GraphStore {
  constructor(opts?: GraphStoreOptions);

  // CRUD
  addNode<D>(node: GraphNode<D>): void;            // throws on duplicate
  addEdge<D>(edge: GraphEdge<D>): void;            // unknown-endpoint per option
  upsertNode<D>(node: GraphNode<D>): void;
  upsertEdge<D>(edge: GraphEdge<D>): void;
  updateNode<D>(id: string, patch: Partial<GraphNode<D>>): void;
  updateEdge<D>(id: string, patch: Partial<GraphEdge<D>>): void;
  removeNode(id: string, opts?: { cascade?: boolean }): void;  // cascade default true
  removeEdge(id: string): void;

  // Read
  getNode<D>(id: string): GraphNode<D> | undefined;
  getEdge<D>(id: string): GraphEdge<D> | undefined;
  hasNode(id: string): boolean;
  hasEdge(id: string): boolean;
  nodes(): IterableIterator<GraphNode>;
  edges(): IterableIterator<GraphEdge>;
  nodeCount(): number;
  edgeCount(): number;

  // Adjacency
  edgesOf(nodeId: string, dir?: 'in' | 'out' | 'both'): IterableIterator<GraphEdge>;
  neighborsOf(nodeId: string, dir?: 'in' | 'out' | 'both'): IterableIterator<string>;
  outDegree(nodeId: string): number;
  inDegree(nodeId: string): number;

  // Hierarchy
  childrenOf(parentId: string): IterableIterator<string>;
  parentOf(id: string): string | undefined;
  descendantsOf(id: string): IterableIterator<string>;
  ancestorsOf(id: string): IterableIterator<string>;

  // Positions
  setPosition(id: string, pos: { x: number; y: number }, opts?: { silent?: boolean }): void;
  setPositionsBulk(ids: readonly string[], xy: Float32Array, opts?: { silent?: boolean }): void;
  getPosition(id: string): { x: number; y: number } | undefined;
  setPinned(id: string, pinned: boolean): void;
  isPinned(id: string): boolean;
  pinnedIds(): IterableIterator<string>;

  // Bulk inserts
  addNodesBulk(nodes: readonly GraphNode[]): void;
  addEdgesBulk(edges: readonly GraphEdge[]): void;

  // Maintenance
  compact(): void;                                  // reclaim tombstoned slots; invalidates external slot indices

  // Reactivity
  batch<T>(fn: () => T): T;
  flush(): void;                                    // force-flush pending events (frame mode)
  readonly version: number;
  readonly events: EventEmitter<GraphStoreEventMap>;

  // Lifecycle
  clear(): void;
}
```

`GraphStoreEventMap` is the typed event-name → payload mapping that `EventEmitter` expects:

```ts
type GraphStoreEventMap = {
  'node:add':       { nodeId: string };
  'node:update':    { nodeId: string; patch: Partial<GraphNode> };
  'node:remove':    { nodeId: string };
  'edge:add':       { edgeId: string };
  'edge:update':    { edgeId: string; patch: Partial<GraphEdge> };
  'edge:remove':    { edgeId: string };
  'edge:orphaned':  { edgeId: string };
  'flush':          { addedNodes: number; updatedNodes: number; removedNodes: number;
                       addedEdges: number; updatedEdges: number; removedEdges: number };
};
```

## Phased implementation

Each phase is a separate PR. No phase lands half-finished.

### Phase 0 — Spec freeze (docs only)

- [x] This `store-plan.md` rewritten to reflect ColumnStore composition.
- [ ] Update [`data-model.md`](./data-model.md) to match agreed design (add `parentId`, `pinned`, drop `x?/y?` shorthand, document `flushMode` / `unknownEndpoint` / upserts / `setPosition`).
- [ ] Update [`events.md`](./events.md) with store-level `node:add/update/remove`, `edge:add/update/remove/orphaned` events distinct from existing layer pointer events.

### Phase 1 — Core store (composes ColumnStore + indices + events + streaming)

All files under `packages/graph/src/store/`:

- [ ] `types.ts` — `GraphNode`, `GraphEdge`, `GraphStoreEvent`, `GraphStoreEventMap`, `GraphStoreOptions`.
- [ ] `AdjacencyIndex.ts` — `Int32Array`-per-slot adjacency with swap-pop and geometric grow. Returns `subarray` views for zero-alloc iteration.
- [ ] `PendingEdges.ts` — out-of-order edge buffer with TTL eviction. Used only when `unknownEndpoint: 'buffer'`.
- [ ] `FrameFlushScheduler.ts` — RAF scheduler with `requestAnimationFrame` and a fallback for non-browser test envs (queueMicrotask + setTimeout(0)).
- [ ] `GraphStore.ts` — main class composing `ColumnStore × 2` + cold maps + adjacency + parent index + event bus + batch/flush.
- [ ] `index.ts` — public exports.
- [ ] Slot-stability wrapper: `GraphStore` calls `ColumnStore.remove` only during `compact()`; ordinary `removeNode`/`removeEdge` set a tombstone bit in the flags column and decrement `nodeCount`/`edgeCount` but leave the slot occupied.
- [ ] Cycle check on `parentId` writes (walk ancestors, throw on cycle).
- [ ] Tests under `packages/graph/tests/store/` covering: CRUD, adjacency direction, parent/child traversal, cycle detection, cascade vs non-cascade remove, unknownEndpoint policies, batch dedup, flushMode frame coalescing, upsert add-vs-update paths, silent setPosition vs noisy.
- [ ] Seven benchmarks (above). All targets must be green before merge.
- [ ] Export `GraphStore` from `packages/graph/src/index.ts`.

::: tip Test policy
`packages/canvas` doesn't get tests (per project rule). `packages/graph` does. Store gets full unit coverage + the benchmark suite.
:::

### Phase 2 — GraphLayer integration

- [ ] `GraphLayer` constructs (or accepts) a `GraphStore`.
- [ ] `graph.setData(data)` → `store.batch(() => { addNodesBulk; addEdgesBulk; })`.
- [ ] Layer subscribes to `store.events`, translates to renderer calls.
- [ ] Layer-level `data:changed` event fires once per flush with aggregate counts (existing `events.md` contract).
- [ ] Layer's existing `addNode` / `removeNode` delegate to the store.

### Phase 3 — Layout integration

- [ ] `D3ForceLayout`: reads `store.nodes()` / `store.edges()`, respects `pinned`, writes via `store.setPositionsBulk(ids, xy, { silent: true })` per tick.
- [ ] `ElkLayout`: single-shot, non-silent.
- [ ] Layer emits `positions:updated` after each layout pass.

### Phase 4 — Container / group rendering

- [ ] `GraphLayer` reads `node.data.containerKind`:
  - `'container'` → renders a frame around the bbox of children.
  - `'group'` → renders a convex hull around children.
  - `undefined` → no visual.
- [ ] Storybook stories: ER table (container), force-cluster (hull).

### Phase 5 — Realtime polish (driven by benchmark results)

- [ ] Pre-sized `addNodesBulk(nodes, { capacity })`.
- [ ] Interleaved-XY `setPositionsBulk` variant if it benches faster.
- [ ] Adjacency-array shrinking after large cascade removes.
- [ ] Subscribe-with-filter on events.
- [ ] Auto-`compact()` at tombstone threshold.

## Out of scope (defer)

- Persistence / serialization helpers.
- Schema validation of user `data`.
- Undo / redo.
- Reactive query language (Cypher / Gremlin / GraphQL).
- Multi-store federation.
- Wasm-backed adjacency.
- Hyperedges (multi-port joins use a hub-node + N edges).

## Risks

| Risk | Mitigation |
|---|---|
| Event volume during d3-force ticks crashes subscribers. | `silent: true` on `setPosition` and `setPositionsBulk`. |
| `cascade: true` default surprises users. | Document loudly. `removeNode(id, { cascade: false })` throws if dangling edges would result. |
| `parentId` cycles. | Store throws on a write that would introduce a cycle. |
| Float32 position precision in very large worlds. | Sub-pixel out to ±3·10⁷ — plenty for canvas. Switch the ColumnStore schema to `f64` if cosmic-scale is ever needed. |
| Tombstoned slots leak memory between `compact()` calls. | ~12 B/node fixed cost. 100k tombstones ≈ 1.2 MB. Negligible. |
| Per-slot adjacency `Int32Array`s fragment the heap. | Bench. If it shows up, Phase 5 switches to a shared backing buffer + free-list. |
| Streaming feed re-delivers existing ids. | `upsertNode` / `upsertEdge` are the streaming-friendly path. |
| `flushMode: 'frame'` pauses when tab backgrounded (no RAF). | Mutations apply synchronously to data; events flush in one go on return. Documented as a feature. |
| Pending-edge buffer unbounded under bad feeds. | `pendingEdgeTTL` constructor option + `edge:orphaned` event. |

## What's next

Phase 0 docs (this file + `data-model.md` + `events.md` updates) ships as a single small PR for review. Phase 1 begins once the type names and event shapes have settled.
