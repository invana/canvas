# Interface: GraphClipboardOptions

Constructor options for [GraphClipboard](../classes/GraphClipboard.md).

## Properties

### pasteOffset?

> `optional` **pasteOffset?**: [`Vec2`](Vec2.md)

Offset applied to pasted node positions to avoid exact overlap. Default `{x:24,y:24}`.

***

### remapId?

> `optional` **remapId?**: (`oldId`, `attempt`) => `string`

Candidate id generator for pasted nodes/edges. Called with increasing
`attempt` until the returned id is free. Default `${oldId}-copy[-N]`.

#### Parameters

##### oldId

`string`

##### attempt

`number`

#### Returns

`string`
