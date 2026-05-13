# Type Alias: GraphStoreEventMap

> **GraphStoreEventMap** = `object`

Defined in: packages/graph/src/store/types.ts:78

Event-map shape for `GraphStore.events` (used by `EventEmitter<E>`).

Subscribe to fine-grained `node:*` / `edge:*` events for per-entity updates,
or to `flush` for aggregated per-batch counts.

## Properties

### edge:add

> **edge:add**: `object`

Defined in: packages/graph/src/store/types.ts:82

#### edgeId

> **edgeId**: `string`

***

### edge:orphaned

> **edge:orphaned**: `object`

Defined in: packages/graph/src/store/types.ts:86

Emitted when a buffered edge is dropped after exceeding `pendingEdgeTTL`.

#### edgeId

> **edgeId**: `string`

***

### edge:remove

> **edge:remove**: `object`

Defined in: packages/graph/src/store/types.ts:84

#### edgeId

> **edgeId**: `string`

***

### edge:update

> **edge:update**: `object`

Defined in: packages/graph/src/store/types.ts:83

#### edgeId

> **edgeId**: `string`

#### patch

> **patch**: `Partial`\<[`GraphEdge`](../interfaces/GraphEdge.md)\>

***

### flush

> **flush**: `object`

Defined in: packages/graph/src/store/types.ts:88

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

Defined in: packages/graph/src/store/types.ts:79

#### nodeId

> **nodeId**: `string`

***

### node:remove

> **node:remove**: `object`

Defined in: packages/graph/src/store/types.ts:81

#### nodeId

> **nodeId**: `string`

***

### node:update

> **node:update**: `object`

Defined in: packages/graph/src/store/types.ts:80

#### nodeId

> **nodeId**: `string`

#### patch

> **patch**: `Partial`\<[`GraphNode`](../interfaces/GraphNode.md)\>
