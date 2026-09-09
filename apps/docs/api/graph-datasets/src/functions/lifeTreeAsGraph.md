# Function: lifeTreeAsGraph()

> **lifeTreeAsGraph**(): `object`

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

`object`

### edges

> **edges**: `GraphEdge`\<`unknown`\>[]

### nodes

> **nodes**: `GraphNode`\<`unknown`\> & `object`[]
