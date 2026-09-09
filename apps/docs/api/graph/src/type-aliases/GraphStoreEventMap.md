# Type Alias: GraphStoreEventMap

> **GraphStoreEventMap** = `object`

Event-map shape for `GraphStore.events` (used by `EventEmitter<E>`).

Subscribe to fine-grained `node:*` / `edge:*` events for per-entity updates,
or to `flush` for aggregated per-batch counts.

## Properties

### edge:add

> **edge:add**: `object`

#### edgeId

> **edgeId**: `string`

***

### edge:orphaned

> **edge:orphaned**: `object`

Emitted when a buffered edge is dropped after exceeding `pendingEdgeTTL`.

#### edgeId

> **edgeId**: `string`

***

### edge:remove

> **edge:remove**: `object`

#### edgeId

> **edgeId**: `string`

***

### edge:state

> **edge:state**: `object`

Edge sibling of `node:state`.

#### actor?

> `optional` **actor?**: `string`

#### edgeId

> **edgeId**: `string`

#### name

> **name**: `string`

#### on

> **on**: `boolean`

***

### edge:update

> **edge:update**: `object`

#### edgeId

> **edgeId**: `string`

#### patch

> **patch**: `Partial`\<[`GraphEdge`](../interfaces/GraphEdge.md)\>

***

### edge:visibility

> **edge:visibility**: `object`

Edge sibling of `node:visibility` — fired only when an edge's **explicit**
hidden flag changes, never for endpoint-driven (effective) hiding.

#### edgeId

> **edgeId**: `string`

#### hidden

> **hidden**: `boolean`

***

### flush

> **flush**: `object`

Aggregate counts per flush. Fires once per batch / RAF flush.

#### addedEdges

> **addedEdges**: `number`

#### addedNodes

> **addedNodes**: `number`

#### removedEdges

> **removedEdges**: `number`

#### removedNodes

> **removedNodes**: `number`

#### updatedEdges

> **updatedEdges**: `number`

#### updatedNodes

> **updatedNodes**: `number`

***

### node:add

> **node:add**: `object`

#### nodeId

> **nodeId**: `string`

***

### node:remove

> **node:remove**: `object`

#### nodeId

> **nodeId**: `string`

***

### node:state

> **node:state**: `object`

A runtime (presence) state was toggled on a node — `on` reflects the
post-change membership of the runtime set. Fired per-toggle on flush,
deduped per `(id, name)` within the flush window. `actor` is reserved for
collaboration (the originating user); `undefined` in single-user mode.
Document `states[]` changes ride `node:update`, not this event.

#### actor?

> `optional` **actor?**: `string`

#### name

> **name**: `string`

#### nodeId

> **nodeId**: `string`

#### on

> **on**: `boolean`

***

### node:update

> **node:update**: `object`

#### nodeId

> **nodeId**: `string`

#### patch

> **patch**: `Partial`\<[`GraphNode`](../interfaces/GraphNode.md)\>

***

### node:visibility

> **node:visibility**: `object`

A node's **explicit** hidden flag changed. `hidden` is the post-change
value. Fired only for explicit `hideNode`/`showNode`/`setNodeHidden`
changes — the incident-edge cascade emits *nothing* (consumers derive it
via `isEdgeVisible` and react to this event). Deduped per id within the
flush window; bulk ops coalesce into one flush.

#### hidden

> **hidden**: `boolean`

#### nodeId

> **nodeId**: `string`

***

### schema

> **schema**: `object`

The **authoritative** schema was set/cleared via `setSchema` (e.g. a Neo4j
adapter declaring the full DB schema). `authoritative` is whether one is now
set. The payload intentionally omits the schema value (kept out of this map
to avoid a type cycle); read it from `store.schema`.

#### authoritative

> **authoritative**: `boolean`
