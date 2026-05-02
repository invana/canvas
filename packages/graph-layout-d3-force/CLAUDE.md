# CLAUDE.md — packages/graph-layout-d3-force (`@invana/graph-layout-d3-force`)

D3 force-directed `Layout` for `@invana/graph`. Replaces the old `@invana/plugin-layouts-d3-force` (now `*-deprecated`).

**Status:** skeleton.

```ts
const layout = new D3ForceLayout({ charge: -300 });
await layout.apply(graphLayer);
```

A `Layout` reads `layer.data`, computes positions, writes them back. It does not register with the canvas, render, or subscribe to input (proposal §2.3).
