# Interface: ToolContextValue

Defined in: [canvas-react/src/ToolContext.ts:12](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/ToolContext.ts#L12)

Shared modeller state surfaced by [GraphToolProvider](../variables/Canvas.md).

## Properties

### nodeKind

> **nodeKind**: `string`

Defined in: [canvas-react/src/ToolContext.ts:22](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/ToolContext.ts#L22)

The node "kind" the **Add** tool drops next (an opaque key like `'circle'`
/ `'rect'`). The consumer maps it to a concrete `NodeStyle` in its
`CreateNodeBehaviour` `createNode` factory.

***

### setNodeKind

> **setNodeKind**: (`kind`) => `void`

Defined in: [canvas-react/src/ToolContext.ts:24](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/ToolContext.ts#L24)

Choose the node kind the Add tool drops next.

#### Parameters

##### kind

`string`

#### Returns

`void`

***

### setTool

> **setTool**: (`tool`) => `void`

Defined in: [canvas-react/src/ToolContext.ts:16](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/ToolContext.ts#L16)

Switch the active tool.

#### Parameters

##### tool

[`GraphTool`](../type-aliases/GraphTool.md)

#### Returns

`void`

***

### tool

> **tool**: [`GraphTool`](../type-aliases/GraphTool.md)

Defined in: [canvas-react/src/ToolContext.ts:14](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/ToolContext.ts#L14)

The currently active tool.
