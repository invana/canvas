# Interface: ToolContextValue

Shared modeller state surfaced by [GraphToolProvider](../../../canvas/src/variables/SpecStore.md).

## Properties

### nodeKind

> **nodeKind**: `string`

The node "kind" the **Add** tool drops next (an opaque key like `'circle'`
/ `'rect'`). The consumer maps it to a concrete `NodeStyle` in its
`CreateNodeBehaviour` `createNode` factory.

***

### setNodeKind

> **setNodeKind**: (`kind`) => `void`

Choose the node kind the Add tool drops next.

#### Parameters

##### kind

`string`

#### Returns

`void`

***

### setTool

> **setTool**: (`tool`) => `void`

Switch the active tool.

#### Parameters

##### tool

[`GraphTool`](../type-aliases/GraphTool.md)

#### Returns

`void`

***

### tool

> **tool**: [`GraphTool`](../type-aliases/GraphTool.md)

The currently active tool.
