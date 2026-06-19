# CLAUDE.md — packages/graph-layout-d3-hierarchy (`@invana/graph-layout-d3-hierarchy`)

D3 hierarchy `Layout` for `@invana/graph` — tidy `tree`, dendrogram `cluster`, radial variants of both, plus `pack` (circle-packing) and `sunburst`.

```ts
const layout = new D3HierarchyLayout({ mode: 'radial-tree', radius: 400, transition: true });
await layout.apply(graphLayer);
```

Extends `OneShotPositionLayout` (from `@invana/graph`) — the shared base for one-shot
(deterministic) layouts. The subclass only implements `computeLayout()` (snapshot →
d3 → projected positions) and `onPositionsApplied()` (flush pack sizes / sunburst arcs
via the per-run `meta`). The base owns **everything else**: the `transition` /
`transitionEase` options (glide vs snap), cancellation (`stop()` + run-token), and the
uniform `start`/`tick`/`end` lifecycle. `pack` / `sunburst` veto the glide via
`shouldTransition()` (they replace node geometry rather than move it).

A `Layout` reads `layer.data`, computes positions, writes them back. It does not register with the canvas, render, or subscribe to input (proposal §2.3).

Tree/parent-child topology is derived from edges: each `edge.source → edge.target` means `source` is the parent of `target`. The snapshot must form a single tree (one root, no cycles, every non-root has exactly one parent); `apply()` throws otherwise.
