# Interface: HistoryRecorder

Defined in: [graph/src/history/types.ts:46](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/history/types.ts#L46)

The mutation surface handed to [GraphHistory.transaction](../classes/GraphHistory.md#transaction)'s callback.
Each method applies the change to the store **and** journals its inverse.
Use these instead of calling `store.*` directly so the change is undoable.

## Methods

### addEdge()

> **addEdge**(`edge`): `void`

Defined in: [graph/src/history/types.ts:56](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/history/types.ts#L56)

Add an edge (inverse: remove it).

#### Parameters

##### edge

[`GraphEdge`](GraphEdge.md)

#### Returns

`void`

***

### addNode()

> **addNode**(`node`): `void`

Defined in: [graph/src/history/types.ts:48](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/history/types.ts#L48)

Add a node (inverse: remove it).

#### Parameters

##### node

[`GraphNode`](GraphNode.md)

#### Returns

`void`

***

### moveNode()

> **moveNode**(`id`, `position`): `void`

Defined in: [graph/src/history/types.ts:54](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/history/types.ts#L54)

Move a node (inverse: restore the prior position).

#### Parameters

##### id

`string`

##### position

[`Vec2`](Vec2.md)

#### Returns

`void`

***

### removeEdge()

> **removeEdge**(`id`): `void`

Defined in: [graph/src/history/types.ts:58](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/history/types.ts#L58)

Remove an edge (inverse: re-add it).

#### Parameters

##### id

`string`

#### Returns

`void`

***

### removeNode()

> **removeNode**(`id`): `void`

Defined in: [graph/src/history/types.ts:50](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/history/types.ts#L50)

Remove a node + its incident edges, cascading (inverse: re-add node + edges).

#### Parameters

##### id

`string`

#### Returns

`void`

***

### updateEdge()

> **updateEdge**(`id`, `patch`): `void`

Defined in: [graph/src/history/types.ts:60](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/history/types.ts#L60)

Patch an edge (inverse: restore the patched fields' prior values).

#### Parameters

##### id

`string`

##### patch

`Partial`\<[`GraphEdge`](GraphEdge.md)\>

#### Returns

`void`

***

### updateNode()

> **updateNode**(`id`, `patch`): `void`

Defined in: [graph/src/history/types.ts:52](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/history/types.ts#L52)

Patch a node (inverse: restore the patched fields' prior values).

#### Parameters

##### id

`string`

##### patch

`Partial`\<[`GraphNode`](GraphNode.md)\>

#### Returns

`void`
