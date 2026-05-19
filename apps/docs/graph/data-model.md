# Data model

::: warning Planned — in design
Types below are the target API for `@invana/graph`. Not yet shipped. The implementation roadmap is in [`store-plan.md`](./store-plan.md).
:::

`@invana/graph` is built around a single domain primitive — `GraphStore` — that owns nodes, edges, and their parent–child relationships. ER diagrams, BPMN, knowledge graphs, petroleum P&ID, supply chains, and property graphs are all use-conventions on top of this same primitive.

`GraphStore` composes [`ColumnStore`](../guide/canvas.md) from `@invana/canvas` for hot fields (positions, flags, source/target slot indices) and `Map<id, payload>` for cold fields (user `data`, `parentId`, edge `type`). Layouts read positions via accessors and write back via `setPositionsBulk`. `GraphLayer` subscribes to store events and projects them into renderer calls.

## `GraphNode`

```ts
interface GraphNode<D = unknown> {
  id: string;
  data?: D;                                 // arbitrary user payload, untouched by the store
  parentId?: string;                        // logical parent in the hierarchy
  position?: { x: number; y: number };      // canonical position; layouts write here
  pinned?: boolean;                         // layouts must not move this node
}
```

- `id` is unique within the store. `addNode` throws on duplicate; `upsertNode` adds-or-merges.
- `data` is opaque to the store — your `vessel`, `table`, `service`, `task` shape lives here.
- `parentId` is a logical relationship only. Rendering treatment (container, hull, none) is decided by the renderer based on the parent's `data.containerKind` — see [ER diagrams](#er-diagrams-tables-and-columns) below.
- `position` is owned by the store. There is no separate view-model.
- `pinned` is honored by layouts (d3-force treats it as `fx`/`fy`; ELK treats it as a fixed input).

## `GraphEdge`

```ts
interface GraphEdge<D = unknown> {
  id: string;
  source: string;                           // source node id
  target: string;                           // target node id
  type?: string;                            // predicate / FK label / "calls" / "depends-on"
  data?: D;                                 // arbitrary user payload
}
```

- All edges are directed. Multi-edges allowed (multiple edges between the same pair, e.g. multiple predicates in a knowledge graph).
- `type` is a free-form string. Knowledge-graph users put their predicate URI here; ER users put `"FK"`; flow users put `"transition"`.
- Referential integrity is enforced per the `unknownEndpoint` store option (default: throw).

## `GraphStoreOptions`

```ts
interface GraphStoreOptions {
  flushMode?: 'sync' | 'frame';                  // default 'sync'
  unknownEndpoint?: 'throw' | 'buffer' | 'drop'; // default 'throw'
  pendingEdgeTTL?: number;                       // frames; default Infinity
  initialCapacity?: number;                      // pre-size node/edge ColumnStores
}
```

- `flushMode: 'frame'` — auto-coalesces all mutations into a single RAF-aligned event flush. Use for streaming feeds.
- `unknownEndpoint: 'buffer'` — parks edges whose endpoints don't yet exist, admits them when the endpoints arrive. Required for out-of-order streams.
- `pendingEdgeTTL` — drops + emits `edge:orphaned` for edges pending more than N frames. Defaults to never expire.
- `initialCapacity` — passed to the underlying `ColumnStore`s to avoid early grow churn.

## CRUD

```ts
class GraphStore {
  // Strict — throws on duplicate / unknown endpoint
  addNode<D>(node: GraphNode<D>): void;
  addEdge<D>(edge: GraphEdge<D>): void;

  // Streaming-friendly — add-if-absent / merge-update-if-present
  upsertNode<D>(node: GraphNode<D>): void;
  upsertEdge<D>(edge: GraphEdge<D>): void;

  // Partial update
  updateNode<D>(id: string, patch: Partial<GraphNode<D>>): void;
  updateEdge<D>(id: string, patch: Partial<GraphEdge<D>>): void;

  // Remove
  removeNode(id: string, opts?: { cascade?: boolean }): void;  // cascade default true
  removeEdge(id: string): void;

  // Bulk (single index pass + single event flush)
  addNodesBulk(nodes: readonly GraphNode[]): void;
  addEdgesBulk(edges: readonly GraphEdge[]): void;

  // Maintenance
  clear(): void;                            // wipe everything (e.g. on WebSocket reconnect)
  compact(): void;                          // reclaim tombstoned slots; invalidates external slot indices
}
```

## Reading

```ts
class GraphStore {
  getNode<D>(id: string): GraphNode<D> | undefined;
  getEdge<D>(id: string): GraphEdge<D> | undefined;
  hasNode(id: string): boolean;
  hasEdge(id: string): boolean;
  nodes(): IterableIterator<GraphNode>;
  edges(): IterableIterator<GraphEdge>;
  nodeCount(): number;
  edgeCount(): number;
}
```

## Adjacency

`GraphStore` indexes adjacency by direction. All adjacency queries are O(1) entry into a typed-array `subarray` view; iteration is O(deg).

```ts
class GraphStore {
  edgesOf(nodeId: string, dir?: 'in' | 'out' | 'both'): IterableIterator<GraphEdge>;
  neighborsOf(nodeId: string, dir?: 'in' | 'out' | 'both'): IterableIterator<string>;
  outDegree(nodeId: string): number;
  inDegree(nodeId: string): number;
}
```

```ts
for (const edge of store.edgesOf(vesselId, 'out')) {
  // outgoing routes from this vessel
}
```

## Hierarchy

`parentId` is a single-parent tree-like relationship. Cycles are rejected at write time.

```ts
class GraphStore {
  childrenOf(parentId: string): IterableIterator<string>;
  parentOf(id: string): string | undefined;
  descendantsOf(id: string): IterableIterator<string>;
  ancestorsOf(id: string): IterableIterator<string>;
}
```

## Positions

Positions are first-class fields on every node. The store owns them; layouts mutate them; renderers read them.

```ts
class GraphStore {
  setPosition(id: string, pos: { x: number; y: number }, opts?: { silent?: boolean }): void;
  setPositionsBulk(ids: readonly string[], xy: Float32Array, opts?: { silent?: boolean }): void;
  getPosition(id: string): { x: number; y: number } | undefined;
  setPinned(id: string, pinned: boolean): void;
  isPinned(id: string): boolean;
  pinnedIds(): IterableIterator<string>;
}
```

- `setPosition` (default) emits `node:update` so subscribers re-render. Use for user drags, explicit edits.
- `setPosition(..., { silent: true })` skips event emission but bumps `version`. Use for layout sim ticks (d3-force at 60fps). Renderers consult `version` on their own RAF tick to detect changes.
- `setPositionsBulk(ids, xy)` takes an `ids` array and a packed `Float32Array` of `[x0, y0, x1, y1, ...]`. Single tight loop over both `ColumnStore` columns.

## Reactivity

```ts
class GraphStore {
  readonly events: EventEmitter<GraphStoreEventMap>;
  readonly version: number;

  batch<T>(fn: () => T): T;
  flush(): void;                            // force-flush pending events (frame mode only)
}
```

- `events` — fine-grained per-mutation events. See [Events](./events.md) for the full catalogue.
- `version` — monotonic counter, bumps on every mutation including silent. Cheapest "did anything change?" check.
- `batch(fn)` — explicit coalesce. All mutations inside `fn` flush as one event batch on exit. `node:update` for the same id deduplicates.
- `flush()` — force flush in `flushMode: 'frame'`. Useful before screenshots / serialization / tests.

## Streaming pattern

For realtime feeds (WebSocket, SSE, AIS, MQTT), construct the store with frame-coalesced flushing and out-of-order edge buffering:

```ts
const store = new GraphStore({
  flushMode: 'frame',
  unknownEndpoint: 'buffer',
  pendingEdgeTTL: 600,        // drop orphaned edges after ~10 seconds at 60fps
});

socket.on('message', (msg) => {
  if (msg.kind === 'vessel') {
    store.upsertNode({ id: msg.id, data: msg, position: { x: msg.lon, y: msg.lat } });
  } else if (msg.kind === 'position') {
    store.setPosition(msg.id, { x: msg.lon, y: msg.lat });
  } else if (msg.kind === 'route') {
    store.addEdge({ id: msg.id, source: msg.from, target: msg.to, type: 'route' });
  }
});

store.events.on('edge:orphaned', ({ edgeId }) => {
  console.warn('dropped orphaned edge', edgeId);
});
```

`flushMode: 'frame'` caps subscriber-visible event flushes at 60/sec regardless of how fast messages arrive. `unknownEndpoint: 'buffer'` makes the store tolerant of feeds that deliver edges before their endpoints.

## ER diagrams: tables and columns

ER diagrams model **columns as nodes**, not as fields on a table node. This enables per-column selection, FK arrows that land on specific columns, and richer column metadata.

```ts
store.addNode({
  id: 'orders',
  data: { kind: 'table', containerKind: 'container', name: 'orders' },
});

store.addNodesBulk([
  { id: 'orders.id',          parentId: 'orders', data: { kind: 'column', name: 'id', type: 'uuid', pk: true } },
  { id: 'orders.customer_id', parentId: 'orders', data: { kind: 'column', name: 'customer_id', type: 'uuid', fk: true } },
  { id: 'orders.total',       parentId: 'orders', data: { kind: 'column', name: 'total', type: 'numeric' } },
]);

store.addEdge({
  id: 'fk:orders.customer_id->customers.id',
  source: 'orders.customer_id',
  target: 'customers.id',
  type: 'FK',
});
```

The renderer reads `data.containerKind: 'container'` on the table node and draws a framed box around its children. The same pattern works for BPMN pools, AWS VPCs, swimlanes, and frame-inside-frame layouts.

## Petroleum / P&ID: multi-port equipment

Equipment with multiple typed ports (a tee fitting has three connections; a pump has inlet + outlet + drain) is modeled with **hub nodes**: each port is its own node, `parentId`-linked to the equipment node.

```ts
store.addNode({ id: 'pump-A', data: { kind: 'pump', containerKind: 'container' } });
store.addNodesBulk([
  { id: 'pump-A.inlet',  parentId: 'pump-A', data: { kind: 'port', role: 'inlet' } },
  { id: 'pump-A.outlet', parentId: 'pump-A', data: { kind: 'port', role: 'outlet' } },
  { id: 'pump-A.drain',  parentId: 'pump-A', data: { kind: 'port', role: 'drain' } },
]);

store.addEdge({
  id: 'pipe-1',
  source: 'tank-T.outlet',
  target: 'pump-A.inlet',
  type: 'process',
  data: { diameter: 6, material: 'CS', pressure: 150 },
});
```

This avoids needing hyperedges in the store; the graph stays simple and the multi-port semantics live in user `data`.

## Non-graph visualizations

Pure shape canvases (free-form annotations, CAD-style drawings) that don't need adjacency or parent–child indices use [`ColumnStore`](../guide/canvas.md) directly from `@invana/canvas` and skip `GraphStore` entirely.
