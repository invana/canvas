# CLAUDE.md — packages/graph-layout-d3-sankey (`@invana/graph-layout-d3-sankey`)

D3 Sankey `Layout` for `@invana/graph` — wraps `d3-sankey` to position nodes as
rectangles in columns and to size each edge's stroke proportional to its flow.

**Status:** skeleton.

```ts
const layout = new D3SankeyLayout({ size: [1200, 720], nodeWidth: 15, nodePadding: 10 });
await layout.apply(graphLayer);
```

A `Layout` reads `layer.store`, computes positions, writes them back. It does
not register with the canvas, render, or subscribe to input (proposal §2.3).
One-shot synchronous like `D3HierarchyLayout` — `apply()` snapshots, computes,
bulk-writes, emits `start` → `tick` → `end`, and resolves.

The Sankey model operates on a **DAG** (a node can have multiple parents);
`d3-hierarchy` won't fit. Each link carries a `value` (read from
`edge.data.value`); `d3-sankey` computes `link.width = value × scale`, plus
`link.y0` / `link.y1` — the precise y-position of the ribbon at the source's
right face and the target's left face. The layout writes:

- Per node: position (centre of rect), `data.shape = 'rect'`, `data.size = x1 − x0`, `data.height = y1 − y0`.
- Per edge: `data.strokeWidth = link.width`, `data.pathType = 'bump-horizontal'`, per-endpoint anchor opts pointing at `edge-port` with the right `{ side, offset }` so the ribbon attaches at the correct y.

Pair with `edgeDefaults: { pathType: 'bump-horizontal', alpha: 0.5, arrow: false }`
in the `GraphLayer` for a faithful reproduction of d3-sankey's SVG output. The
ribbons are stroked horizontal cubic beziers — same approach d3-sankey takes
in SVG, with the `'edge-port'` anchor handling per-link y stacking.
