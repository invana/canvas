# Function: h1b2019AsGraph()

> **h1b2019AsGraph**(): `object`

Flatten [h1b2019Hierarchy](../variables/h1b2019Hierarchy.md) to a `{nodes, edges}` shape compatible with
`GraphLayer.setData`. BFS-traverses the tree, assigning slash-joined path
ids so duplicate names across branches stay distinct.

Returns ~55 states + ~3 000 cities + ~22 000 employer leaves; allocating
each call is cheap (one pass over a 1 MB JSON), so consumers can re-call
after filtering settings change without caching.

## Returns

`object`

### edges

> **edges**: `GraphEdge`\<`unknown`\>[]

### nodes

> **nodes**: `GraphNode`\<`unknown`\> & `object`[]
