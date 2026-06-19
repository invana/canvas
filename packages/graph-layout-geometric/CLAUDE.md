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

Extends `OneShotPositionLayout` (from `@invana/graph`) — the shared base for
one-shot layouts. The subclass only implements `computeLayout()` (one position
pass); the base owns the `transition` / `transitionEase` options (all three modes
are pure position moves, so they glide by default), cancellation (`stop()` +
run-token), and the `start`/`tick`/`end` lifecycle.

A `Layout` reads `layer.data`, computes positions, writes them back. It does not
register with the canvas, render, or subscribe to input (proposal §2.3).
