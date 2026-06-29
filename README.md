# @invana/canvas

High-performance WebGPU-first canvas rendering engine and visualization toolkit.

## Why

We're building a **data exploration** tool, not a visualization library — a surface for
making decisions by interacting with your data. See the **[roadmap](./roadmap.md)**.

## Features

- WebGPU-first with WebGL2 fallback
- Theming system with light/dark modes
- Plugin architecture for extensibility
- Multiple node shapes and edge types
- Rich interactions - pan, zoom, drag, select
- Support for animations
 

## Packages

| Package | Description |
|---------|-------------|
| [@invana/canvas](./packages/canvas) | Core WebGPU/WebGL rendering engine — `Canvas`, `Layer`, `Behaviour`, `Layout` |
| [@invana/canvas-react](./packages/canvas-react) | React bindings — declarative `<Canvas>`, hooks, toolbars |
| [@invana/graph](./packages/graph) | Graph domain — `GraphLayer`, behaviours, and the `OneShotPositionLayout` base |
| [@invana/graph-layout-d3-force](./packages/graph-layout-d3-force) | Force-directed layout (d3-force) |
| [@invana/graph-layout-elkjs](./packages/graph-layout-elkjs) | ELK graph layouts (layered, tree, radial, stress, …) |
| [@invana/graph-layout-d3-hierarchy](./packages/graph-layout-d3-hierarchy) | Tree / dendrogram / radial / pack / sunburst (d3-hierarchy) |
| [@invana/graph-layout-geometric](./packages/graph-layout-geometric) | Dependency-free grid / snake / circular |
| [@invana/graph-layout-d3-sankey](./packages/graph-layout-d3-sankey) | Sankey flow layout (d3-sankey) |

## Quick Start

```bash
pnpm install
pnpm build
pnpm --filter @canvas/storybook dev   # → http://localhost:6006
```

```bash
pnpm --filter @invana/canvas build
pnpm --filter @invana/graph-layout-d3-force build
```

## Layouts

A `Layout` reads a `GraphLayer`'s nodes/edges, computes positions, and writes them
back via `layout.apply(graphLayer)` (or by registering it under an id and setting
`config.activeLayout`). Two families:

- **Iterative** — a running simulation that paints its own per-tick evolution
  (`D3ForceLayout`). Toggle the per-tick paint with `animate` (`true` = watch it
  relax, `false` = run silently then snap to settled).
- **One-shot** — computes a final position for every node in one pass (everything
  else below). These extend the shared **`OneShotPositionLayout`** base
  (`@invana/graph`), which adds a **serializable transition**: set
  `transition` (`true` | ms) + `transitionEase` (`'easeOutCubic'`, …) to glide
  nodes from their current spots to the computed layout instead of teleporting.
  Cancellation and the `start`/`tick`/`end` lifecycle are shared too.

| Layout | Package | `mode` / `algorithm` | Transition |
|--------|---------|----------------------|------------|
| Force-directed | `@invana/graph-layout-d3-force` | `D3ForceLayout` | live sim (`animate`) |
| Layered / hierarchical | `@invana/graph-layout-elkjs` | `algorithm: 'layered'` | ✅ glide |
| Tree (multi-root) | `@invana/graph-layout-elkjs` | `algorithm: 'mrtree'` | ✅ glide |
| Radial (graph) | `@invana/graph-layout-elkjs` | `algorithm: 'radial'` | ✅ glide |
| Stress / force / box / rect-packing | `@invana/graph-layout-elkjs` | `algorithm: 'stress' \| 'force' \| 'box' \| 'rectpacking'` | ✅ glide |
| Tidy tree | `@invana/graph-layout-d3-hierarchy` | `mode: 'tree'` | ✅ glide |
| Radial compact tree | `@invana/graph-layout-d3-hierarchy` | `mode: 'radial-tree'` | ✅ glide |
| Dendrogram | `@invana/graph-layout-d3-hierarchy` | `mode: 'cluster'` | ✅ glide |
| Radial dendrogram | `@invana/graph-layout-d3-hierarchy` | `mode: 'radial-cluster'` | ✅ glide |
| Circle packing | `@invana/graph-layout-d3-hierarchy` | `mode: 'pack'` | snaps¹ |
| Sunburst | `@invana/graph-layout-d3-hierarchy` | `mode: 'sunburst'` | snaps¹ |
| Grid | `@invana/graph-layout-geometric` | `mode: 'grid'` | ✅ glide |
| Snake (serpentine) | `@invana/graph-layout-geometric` | `mode: 'snake'` | ✅ glide |
| Circular | `@invana/graph-layout-geometric` | `mode: 'circular'` | ✅ glide |
| Sankey | `@invana/graph-layout-d3-sankey` | flow diagram | snaps¹ |

¹ These replace node *geometry* (circle sizes / arc sectors / rect sizes + flow
ribbons) rather than move nodes, so they snap rather than glide. Pack and sunburst
veto the transition via `shouldTransition()`; sankey is standalone (it extends
`Layout` directly — its positions, rect sizes, and `edge-port` ribbon anchors must
land in one tightly-ordered flush, which the generic base doesn't model).

**Tree-family layouts need hierarchical data** (a root + parent/child via edges):
the d3-hierarchy modes and ELK `mrtree`/`radial`. Force, ELK `layered`/`stress`,
and the geometric modes work on any graph.

### Planned

`indented-tree`, `mind-map`, and `fishbone` — each a custom `computeLayout()` on
`OneShotPositionLayout` (they inherit `transition`/`transitionEase`, cancellation,
and lifecycle for free).



## License

