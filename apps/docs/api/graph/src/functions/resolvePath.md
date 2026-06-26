# Function: resolvePath()

> **resolvePath**(`node`, `path`): `unknown`

Defined in: graph/src/template/bindings.ts:11

Read a dotted path off a node. The path is rooted at the node object, so
`'type'` reads `node.type` and `'data.name'` reads `node.data.name`.

## Parameters

### node

[`GraphNode`](../interfaces/GraphNode.md)

### path

`string`

## Returns

`unknown`
