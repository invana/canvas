# Type Alias: D3SankeyNodeAlign

> **D3SankeyNodeAlign** = `"left"` \| `"right"` \| `"center"` \| `"justify"`

Defined in: [graph-layout-d3-sankey/src/types.ts:17](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph-layout-d3-sankey/src/types.ts#L17)

Column-alignment strategy. Mirrors d3-sankey's `nodeAlign` setters:

- `'left'` — push every node as far left as possible (depth = longest path
  from a source). Sources column together on the left, sinks float toward
  the right depending on their depth.
- `'right'` — mirror of `'left'`: sinks together on the right, sources
  float toward the left.
- `'center'` — average of left and right; tidy when the graph is roughly
  symmetric.
- `'justify'` (default) — sources on the left, sinks on the right; every
  node is pushed to the latest column it can occupy without rerouting.
  This is the d3 example's default and the one to pick first.
