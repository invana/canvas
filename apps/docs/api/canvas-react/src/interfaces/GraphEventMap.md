# Interface: GraphEventMap

The graph events a component can subscribe to via [useGraphEvent](../functions/useGraphEvent.md) — the
fine-grained `GraphStore` stream (`node:add`, `node:visibility`, `edge:*`, …)
plus the handful of `GraphLayer`-level signals a UI typically reacts to.

The layer-level entries are declared by hand rather than pulled from
`GraphLayerEvents` because that interface carries a `[event: string]: unknown`
index signature (open for future pointer/gesture events), which would collapse
`keyof` to `string` and lose per-event payload typing. Add new layer events
here as they become worth subscribing to from React.

## Extends

- `GraphStoreEventMap`

## Properties

### data:changed

> **data:changed**: `object`

Aggregated per-flush topology/position change on the layer.

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

### edge:add

> **edge:add**: `object`

#### edgeId

> **edgeId**: `string`

#### Inherited from

`GraphStoreEventMap.edge:add`

***

### edge:orphaned

> **edge:orphaned**: `object`

Emitted when a buffered edge is dropped after exceeding `pendingEdgeTTL`.

#### edgeId

> **edgeId**: `string`

#### Inherited from

`GraphStoreEventMap.edge:orphaned`

***

### edge:remove

> **edge:remove**: `object`

#### edgeId

> **edgeId**: `string`

#### Inherited from

`GraphStoreEventMap.edge:remove`

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

#### Inherited from

`GraphStoreEventMap.edge:state`

***

### edge:update

> **edge:update**: `object`

#### edgeId

> **edgeId**: `string`

#### patch

> **patch**: `Partial`\<`GraphEdge`\>

#### Inherited from

`GraphStoreEventMap.edge:update`

***

### edge:visibility

> **edge:visibility**: `object`

Edge sibling of `node:visibility` — fired only when an edge's **explicit**
hidden flag changes, never for endpoint-driven (effective) hiding.

#### edgeId

> **edgeId**: `string`

#### hidden

> **hidden**: `boolean`

#### Inherited from

`GraphStoreEventMap.edge:visibility`

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

#### Inherited from

`GraphStoreEventMap.flush`

***

### group:visibility

> **group:visibility**: `object`

A group container was hidden/shown as a unit (`hideGroup`/`showGroup`).

#### groupId

> **groupId**: `string`

#### hidden

> **hidden**: `boolean`

***

### node:add

> **node:add**: `object`

#### nodeId

> **nodeId**: `string`

#### Inherited from

`GraphStoreEventMap.node:add`

***

### node:remove

> **node:remove**: `object`

#### nodeId

> **nodeId**: `string`

#### Inherited from

`GraphStoreEventMap.node:remove`

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

#### Inherited from

`GraphStoreEventMap.node:state`

***

### node:update

> **node:update**: `object`

#### nodeId

> **nodeId**: `string`

#### patch

> **patch**: `Partial`\<`GraphNode`\>

#### Inherited from

`GraphStoreEventMap.node:update`

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

#### Inherited from

`GraphStoreEventMap.node:visibility`

***

### schema

> **schema**: `object`

The **authoritative** schema was set/cleared via `setSchema` (e.g. a Neo4j
adapter declaring the full DB schema). `authoritative` is whether one is now
set. The payload intentionally omits the schema value (kept out of this map
to avoid a type cycle); read it from `store.schema`.

#### authoritative

> **authoritative**: `boolean`

#### Inherited from

`GraphStoreEventMap.schema`

***

### style:changed

> **style:changed**: `object`

The layer-level style template changed.

#### scope

> **scope**: `"node"` \| `"edge"` \| `"state"`
