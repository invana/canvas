# Type Alias: GraphStoreEventMap

> **GraphStoreEventMap** = `object`

Defined in: [graph/src/store/types.ts:120](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/store/types.ts#L120)

Event-map shape for `GraphStore.events` (used by `EventEmitter<E>`).

Subscribe to fine-grained `node:*` / `edge:*` events for per-entity updates,
or to `flush` for aggregated per-batch counts.

## Properties

### edge:add

> **edge:add**: `object`

Defined in: [graph/src/store/types.ts:124](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/store/types.ts#L124)

#### edgeId

> **edgeId**: `string`

***

### edge:orphaned

> **edge:orphaned**: `object`

Defined in: [graph/src/store/types.ts:128](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/store/types.ts#L128)

Emitted when a buffered edge is dropped after exceeding `pendingEdgeTTL`.

#### edgeId

> **edgeId**: `string`

***

### edge:remove

> **edge:remove**: `object`

Defined in: [graph/src/store/types.ts:126](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/store/types.ts#L126)

#### edgeId

> **edgeId**: `string`

***

### edge:update

> **edge:update**: `object`

Defined in: [graph/src/store/types.ts:125](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/store/types.ts#L125)

#### edgeId

> **edgeId**: `string`

#### patch

> **patch**: `Partial`\<[`GraphEdge`](../interfaces/GraphEdge.md)\>

***

### flush

> **flush**: `object`

Defined in: [graph/src/store/types.ts:130](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/store/types.ts#L130)

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

Defined in: [graph/src/store/types.ts:121](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/store/types.ts#L121)

#### nodeId

> **nodeId**: `string`

***

### node:remove

> **node:remove**: `object`

Defined in: [graph/src/store/types.ts:123](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/store/types.ts#L123)

#### nodeId

> **nodeId**: `string`

***

### node:update

> **node:update**: `object`

Defined in: [graph/src/store/types.ts:122](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/store/types.ts#L122)

#### nodeId

> **nodeId**: `string`

#### patch

> **patch**: `Partial`\<[`GraphNode`](../interfaces/GraphNode.md)\>
