# Function: flareAsGraph()

> **flareAsGraph**(): [`FlareGraphData`](../interfaces/FlareGraphData.md)

Defined in: [graph-datasets/src/flare.ts:73](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-datasets/src/flare.ts#L73)

Flatten [flareHierarchy](../variables/flareHierarchy.md) to a `{nodes, edges}` shape compatible with
`GraphLayer.setData`. BFS-traverses the tree, assigning slash-joined path
ids so duplicate names across branches stay distinct.

## Returns

[`FlareGraphData`](../interfaces/FlareGraphData.md)
