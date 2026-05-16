# Function: flareAsGraph()

> **flareAsGraph**(): [`FlareGraphData`](../interfaces/FlareGraphData.md)

Defined in: [graph-datasets/src/flare.ts:73](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph-datasets/src/flare.ts#L73)

Flatten [flareHierarchy](../variables/flareHierarchy.md) to a `{nodes, edges}` shape compatible with
`GraphLayer.setData`. BFS-traverses the tree, assigning slash-joined path
ids so duplicate names across branches stay distinct.

## Returns

[`FlareGraphData`](../interfaces/FlareGraphData.md)
