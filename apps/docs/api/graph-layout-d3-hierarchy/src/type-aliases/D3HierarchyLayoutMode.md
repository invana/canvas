# Type Alias: D3HierarchyLayoutMode

> **D3HierarchyLayoutMode** = `"tree"` \| `"cluster"` \| `"radial-tree"` \| `"radial-cluster"` \| `"pack"` \| `"sunburst"`

Defined in: [graph-layout-d3-hierarchy/src/types.ts:23](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph-layout-d3-hierarchy/src/types.ts#L23)

Layout mode.

- `'tree'` — `d3.tree()` tidy layout, Cartesian (x, y) positions.
- `'cluster'` — `d3.cluster()` dendrogram (leaves aligned), Cartesian positions.
- `'radial-tree'` — `d3.tree()` projected to polar coordinates.
- `'radial-cluster'` — `d3.cluster()` projected to polar coordinates.
- `'pack'` — `d3.pack()` enclosure layout. Each node is sized by the
  accumulated `value` and positioned so children are packed inside the
  parent's circle. The layout also writes per-node sizes onto each node
  (`data.size = 2 * r`), so the renderer can draw the correct circle
  diameter; this is unique to pack and is why it needs `value`.
- `'sunburst'` — `d3.partition()` over polar coordinates. Each node becomes
  an annular sector; positions all collapse to `(center.x, center.y)` and
  the per-node shape (innerR / outerR / startAngle / endAngle) is written
  onto `data` so the renderer can paint it as an `'arc'` shape. Sized off
  the accumulated `value` like pack. Ring radii grow with `sqrt(y)` so
  every ring covers an area proportional to its summed leaves — the
  convention d3's example uses.
