# CLAUDE.md — packages/graph-layout-geometric (`@invana/graph-layout-geometric`)

Dependency-free geometric `Layout`s for `@invana/graph` — `grid`, `snake`
(serpentine grid), and `circular`. Pure index→position math: no external
libraries, no edge/topology analysis. Every node is placed by its position in
store iteration order.

```ts
import { GeometricLayout } from '@invana/graph-layout-geometric';

const layout = new GeometricLayout({ mode: 'circular', radius: 300, transition: true });
await layout.apply(graphLayer);
```

Extends `SubgraphPositionLayout` (from `@invana/graph`) — the base for one-shot
layouts that can run over an arbitrary node set. The subclass only implements
`computeSubgraphLayout()` (one position pass); the base owns the `transition` /
`transitionEase` options (all three modes are pure position moves, so they glide by
default), cancellation (`stop()` + run-token), the `start`/`tick`/`end` lifecycle,
and the `includeGroups` group recursion.

## Groups (`includeGroups`, default off)

With `includeGroups: true` the layout runs once per group — members are gridded /
circled among themselves, the result is boxed with the group's own `padding` +
`headerHeight`, and the box is placed as a single cell one level up. Nested groups
recurse.

Having **no topology analysis makes this the most forgiving group layout in the
set**: any node set can be gridded, so a group's members always have a solution no
matter how they connect. Compare `d3-hierarchy`, where each group must contain a
single subtree, and ELK, which is better still because it routes edges across
container boundaries — recursion solves a group's interior blind to its external
edges.

Cell pitch now grows to fit `sub.sizeOf(id)` rather than the cached
`node.boundingBox`. On the very first pass — before anything has rendered — that
reads the shape's computed bounds instead of finding an empty box, so large nodes
get a big-enough cell on run one rather than only after a redraw.

A `Layout` reads `layer.data`, computes positions, writes them back. It does not
register with the canvas, render, or subscribe to input (proposal §2.3).
