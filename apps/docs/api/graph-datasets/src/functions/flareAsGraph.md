# Function: flareAsGraph()

> **flareAsGraph**(): [`FlareGraphData`](../interfaces/FlareGraphData.md)

Defined in: [graph-datasets/src/flare.ts:73](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph-datasets/src/flare.ts#L73)

Flatten [flareHierarchy](../variables/flareHierarchy.md) to a `{nodes, edges}` shape compatible with
`GraphLayer.setData`. BFS-traverses the tree, assigning slash-joined path
ids so duplicate names across branches stay distinct.

## Returns

[`FlareGraphData`](../interfaces/FlareGraphData.md)
