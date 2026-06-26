# Interface: UseDrawHistoryResult

Defined in: [canvas-react/src/hooks/useDrawHistory.ts:6](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useDrawHistory.ts#L6)

## Properties

### onEdgeCreate

> **onEdgeCreate**: (`edge`) => `void`

Defined in: [canvas-react/src/hooks/useDrawHistory.ts:10](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useDrawHistory.ts#L10)

Journal a just-created edge as an undoable `connect` entry.

#### Parameters

##### edge

`GraphEdge`

#### Returns

`void`

***

### onErase

> **onErase**: (`removed`) => `void`

Defined in: [canvas-react/src/hooks/useDrawHistory.ts:12](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useDrawHistory.ts#L12)

Journal a just-erased node/edge as an undoable `delete` entry.

#### Parameters

##### removed

`ErasedElement`

#### Returns

`void`

***

### onNodeCreate

> **onNodeCreate**: (`node`) => `void`

Defined in: [canvas-react/src/hooks/useDrawHistory.ts:8](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useDrawHistory.ts#L8)

Journal a just-created node as an undoable `add node` entry.

#### Parameters

##### node

`GraphNode`

#### Returns

`void`
