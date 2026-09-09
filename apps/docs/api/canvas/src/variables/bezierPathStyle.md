# Variable: bezierPathStyle

> `const` **bezierPathStyle**: [`IPathStyle`](../../../renderer-pixijs/src/type-aliases/IPathStyle.md)

Single cubic Bézier between the first and last polyline points, with
auto-generated control handles. Intermediate polyline points (router
waypoints, manhattan corners, …) are **ignored** — pick `smooth` if you
want the path to follow them.

Control-point strategy: direction-aware s-curve.
- For horizontal-dominant layouts the controls pull horizontally:
  `c1 = source + (dx * tension, 0)`, `c2 = target - (dx * tension, 0)`.
  Source leaves and target arrives along the x-axis.
- For vertical-dominant layouts the controls pull vertically.

Output: `[M source, C target]` — a single curve segment.
