# Variable: bundlePathStyle

> `const` **bundlePathStyle**: [`IPathStyle`](../../../renderer-pixijs/src/type-aliases/IPathStyle.md)

Hierarchical-edge-bundling curve through the polyline, emitted as cubic
Béziers. This is the d3-shape `curveBundle.beta(β)` shape: an open cubic
B-spline driven by control points that are β-blended toward the straight
line from `P_0` to `P_{n-1}`.

Pair with `router: 'straight'` and feed the hierarchy-ancestor sequence as
`waypoints` on the connector spec (per-edge layout output); the router will
pass `[source, ...waypoints, target]` through unchanged, and this pathStyle
sees the full sequence.

Reference: d3-shape `src/curve/bundle.js` + `src/curve/basis.js`.
