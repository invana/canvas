# Function: lifeTreeAsGraph()

> **lifeTreeAsGraph**(): [`LifeTreeGraphData`](../interfaces/LifeTreeGraphData.md)

Defined in: [graph-datasets/src/lifeTree.ts:148](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-datasets/src/lifeTree.ts#L148)

Flatten [lifeTreeHierarchy](../variables/lifeTreeHierarchy.md) to a `{nodes, edges}` shape compatible
with `GraphLayer.setData`. BFS-traverses the tree, assigning slash-joined
path ids so anonymous internal clades — and duplicate names across branches
— stay distinct. Each node carries its inherited `kingdom`.

The Newick source reuses generic clade labels (e.g. `Bacteria_subclade`)
across many sibling positions, so a plain slash-path can collide. When that
happens, the colliding child gets a numeric suffix (`_2`, `_3`, …) so every
emitted id is unique while the readable path is preserved in the common
case.

## Returns

[`LifeTreeGraphData`](../interfaces/LifeTreeGraphData.md)
