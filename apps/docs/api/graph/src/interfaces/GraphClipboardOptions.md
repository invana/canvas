# Interface: GraphClipboardOptions

Defined in: [graph/src/clipboard/GraphClipboard.ts:37](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/clipboard/GraphClipboard.ts#L37)

Constructor options for [GraphClipboard](../classes/GraphClipboard.md).

## Properties

### pasteOffset?

> `optional` **pasteOffset?**: [`Vec2`](Vec2.md)

Defined in: [graph/src/clipboard/GraphClipboard.ts:39](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/clipboard/GraphClipboard.ts#L39)

Offset applied to pasted node positions to avoid exact overlap. Default `{x:24,y:24}`.

***

### remapId?

> `optional` **remapId?**: (`oldId`, `attempt`) => `string`

Defined in: [graph/src/clipboard/GraphClipboard.ts:44](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/clipboard/GraphClipboard.ts#L44)

Candidate id generator for pasted nodes/edges. Called with increasing
`attempt` until the returned id is free. Default `${oldId}-copy[-N]`.

#### Parameters

##### oldId

`string`

##### attempt

`number`

#### Returns

`string`
