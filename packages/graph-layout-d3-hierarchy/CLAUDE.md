# CLAUDE.md — packages/graph-layout-d3-hierarchy (`@invana/graph-layout-d3-hierarchy`)

D3 hierarchy `Layout` for `@invana/graph` — tidy `tree`, dendrogram `cluster`, and radial variants of both.

**Status:** skeleton.

```ts
const layout = new D3HierarchyLayout({ mode: 'radial-tree', radius: 400 });
await layout.apply(graphLayer);
```

A `Layout` reads `layer.data`, computes positions, writes them back. It does not register with the canvas, render, or subscribe to input (proposal §2.3). Unlike the d3-force layout, this one is one-shot synchronous — `apply()` snapshots, computes, bulk-writes, emits `start`/`tick`/`end` once, and resolves.

Tree/parent-child topology is derived from edges: each `edge.source → edge.target` means `source` is the parent of `target`. The snapshot must form a single tree (one root, no cycles, every non-root has exactly one parent); `apply()` throws otherwise.
