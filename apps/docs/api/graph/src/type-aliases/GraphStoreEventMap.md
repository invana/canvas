# Type Alias: GraphStoreEventMap

> **GraphStoreEventMap** = `object`

Defined in: [graph/src/store/types.ts:134](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/types.ts#L134)

Event-map shape for `GraphStore.events` (used by `EventEmitter<E>`).

Subscribe to fine-grained `node:*` / `edge:*` events for per-entity updates,
or to `flush` for aggregated per-batch counts.

## Properties

### edge:add

> **edge:add**: `object`

Defined in: [graph/src/store/types.ts:138](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/types.ts#L138)

#### edgeId

> **edgeId**: `string`

***

### edge:orphaned

> **edge:orphaned**: `object`

Defined in: [graph/src/store/types.ts:142](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/types.ts#L142)

Emitted when a buffered edge is dropped after exceeding `pendingEdgeTTL`.

#### edgeId

> **edgeId**: `string`

***

### edge:remove

> **edge:remove**: `object`

Defined in: [graph/src/store/types.ts:140](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/types.ts#L140)

#### edgeId

> **edgeId**: `string`

***

### edge:state

> **edge:state**: `object`

Defined in: [graph/src/store/types.ts:152](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/types.ts#L152)

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

Defined in: [graph/src/store/types.ts:139](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/types.ts#L139)

#### edgeId

> **edgeId**: `string`

#### patch

> **patch**: `Partial`\<[`GraphEdge`](../interfaces/GraphEdge.md)\>

***

### flush

> **flush**: `object`

Defined in: [graph/src/store/types.ts:154](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/types.ts#L154)

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

Defined in: [graph/src/store/types.ts:135](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/types.ts#L135)

#### nodeId

> **nodeId**: `string`

***

### node:remove

> **node:remove**: `object`

Defined in: [graph/src/store/types.ts:137](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/types.ts#L137)

#### nodeId

> **nodeId**: `string`

***

### node:state

> **node:state**: `object`

Defined in: [graph/src/store/types.ts:150](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/types.ts#L150)

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

Defined in: [graph/src/store/types.ts:136](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/types.ts#L136)

#### nodeId

> **nodeId**: `string`

#### patch

> **patch**: `Partial`\<[`GraphNode`](../interfaces/GraphNode.md)\>
