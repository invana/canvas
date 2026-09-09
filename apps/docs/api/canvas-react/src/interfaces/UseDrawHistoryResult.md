# Interface: UseDrawHistoryResult

## Properties

### onEdgeCreate

> **onEdgeCreate**: (`edge`) => `void`

Journal a just-created edge as an undoable `connect` entry.

#### Parameters

##### edge

`GraphEdge`

#### Returns

`void`

***

### onErase

> **onErase**: (`removed`) => `void`

Journal a just-erased node/edge as an undoable `delete` entry.

#### Parameters

##### removed

`ErasedElement`

#### Returns

`void`

***

### onNodeCreate

> **onNodeCreate**: (`node`) => `void`

Journal a just-created node as an undoable `add node` entry.

#### Parameters

##### node

`GraphNode`

#### Returns

`void`
