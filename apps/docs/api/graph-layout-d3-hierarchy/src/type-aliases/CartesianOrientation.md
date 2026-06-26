# Type Alias: CartesianOrientation

> **CartesianOrientation** = `"vertical"` \| `"horizontal"`

Defined in: [graph-layout-d3-hierarchy/src/types.ts:53](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-hierarchy/src/types.ts#L53)

Cartesian-mode orientation.

- `'vertical'` (default) — depth axis runs top-to-bottom; root at top,
  leaves at bottom. Pairs naturally with `pathType: 'bezier'` (axis 'auto'
  picks vertical) or `pathType: 'smooth'`.
- `'horizontal'` — depth axis runs left-to-right; root on the left,
  leaves aligned on the right. Matches the d3 cluster / tidy-tree
  examples. Pairs with `pathType: 'bezier'` (axis 'auto' picks horizontal).

Ignored in `radial-*` modes.
