# Variable: bezierPathStyle

> `const` **bezierPathStyle**: [`IPathStyle`](../type-aliases/IPathStyle.md)

Defined in: [canvas/src/primitives/connectors/pathStyles/bezier.ts:35](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/connectors/pathStyles/bezier.ts#L35)

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
