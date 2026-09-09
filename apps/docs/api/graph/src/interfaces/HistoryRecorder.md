# Interface: HistoryRecorder

The mutation surface handed to [GraphHistory.transaction](../classes/GraphHistory.md#transaction)'s callback.
Each method applies the change to the store **and** journals its inverse.
Use these instead of calling `store.*` directly so the change is undoable.

## Methods

### addEdge()

> **addEdge**(`edge`): `void`

Add an edge (inverse: remove it).

#### Parameters

##### edge

[`GraphEdge`](GraphEdge.md)

#### Returns

`void`

***

### addNode()

> **addNode**(`node`): `void`

Add a node (inverse: remove it).

#### Parameters

##### node

[`GraphNode`](GraphNode.md)

#### Returns

`void`

***

### moveNode()

> **moveNode**(`id`, `position`): `void`

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

Remove an edge (inverse: re-add it).

#### Parameters

##### id

`string`

#### Returns

`void`

***

### removeNode()

> **removeNode**(`id`): `void`

Remove a node + its incident edges, cascading (inverse: re-add node + edges).

#### Parameters

##### id

`string`

#### Returns

`void`

***

### updateEdge()

> **updateEdge**(`id`, `patch`): `void`

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

Patch a node (inverse: restore the patched fields' prior values).

#### Parameters

##### id

`string`

##### patch

`Partial`\<[`GraphNode`](GraphNode.md)\>

#### Returns

`void`
