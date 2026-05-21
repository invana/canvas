# Function: h1b2019AsGraph()

> **h1b2019AsGraph**(): [`H1B2019GraphData`](../interfaces/H1B2019GraphData.md)

Defined in: [graph-datasets/src/h1b2019.ts:98](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-datasets/src/h1b2019.ts#L98)

Flatten [h1b2019Hierarchy](../variables/h1b2019Hierarchy.md) to a `{nodes, edges}` shape compatible with
`GraphLayer.setData`. BFS-traverses the tree, assigning slash-joined path
ids so duplicate names across branches stay distinct.

Returns ~55 states + ~3 000 cities + ~22 000 employer leaves; allocating
each call is cheap (one pass over a 1 MB JSON), so consumers can re-call
after filtering settings change without caching.

## Returns

[`H1B2019GraphData`](../interfaces/H1B2019GraphData.md)
