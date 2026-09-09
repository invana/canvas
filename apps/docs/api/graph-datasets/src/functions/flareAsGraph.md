# Function: flareAsGraph()

> **flareAsGraph**(): `object`

Flatten [flareHierarchy](../variables/flareHierarchy.md) to a `{nodes, edges}` shape compatible with
`GraphLayer.setData`. BFS-traverses the tree, assigning slash-joined path
ids so duplicate names across branches stay distinct.

## Returns

`object`

### edges

> **edges**: `GraphEdge`\<`unknown`\>[]

### nodes

> **nodes**: `GraphNode`\<`unknown`\> & `object`[]
