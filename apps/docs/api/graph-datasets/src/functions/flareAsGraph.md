# Function: flareAsGraph()

> **flareAsGraph**(): [`FlareGraphData`](../interfaces/FlareGraphData.md)

Defined in: [graph-datasets/src/flare.ts:73](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph-datasets/src/flare.ts#L73)

Flatten [flareHierarchy](../variables/flareHierarchy.md) to a `{nodes, edges}` shape compatible with
`GraphLayer.setData`. BFS-traverses the tree, assigning slash-joined path
ids so duplicate names across branches stay distinct.

## Returns

[`FlareGraphData`](../interfaces/FlareGraphData.md)
