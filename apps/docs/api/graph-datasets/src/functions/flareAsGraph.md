# Function: flareAsGraph()

> **flareAsGraph**(): [`FlareGraphData`](../interfaces/FlareGraphData.md)

Defined in: [graph-datasets/src/flare.ts:73](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-datasets/src/flare.ts#L73)

Flatten [flareHierarchy](../variables/flareHierarchy.md) to a `{nodes, edges}` shape compatible with
`GraphLayer.setData`. BFS-traverses the tree, assigning slash-joined path
ids so duplicate names across branches stay distinct.

## Returns

[`FlareGraphData`](../interfaces/FlareGraphData.md)
