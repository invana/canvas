# Interface: DeriveSchemaOptions

Type accessors — override to pick a different "type" field per element.

## Properties

### edgeTypeOf?

> `optional` **edgeTypeOf?**: (`edge`) => `string`

How to read an edge's type/label. Default reads `edge.type`, then
`edge.data.type` / `.label` / `.kind`, then `'edge'`.

#### Parameters

##### edge

[`GraphEdge`](GraphEdge.md)

#### Returns

`string`

***

### nodeTypeOf?

> `optional` **nodeTypeOf?**: (`node`) => `string`

How to read a node's type/label. Default reads `node.type`, then
`node.data.type` / `.label` / `.kind` / `.group` / `.category`, then `'node'`.

#### Parameters

##### node

[`GraphNode`](GraphNode.md)

#### Returns

`string`
