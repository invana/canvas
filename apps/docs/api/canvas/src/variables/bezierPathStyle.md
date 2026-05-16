# Variable: bezierPathStyle

> `const` **bezierPathStyle**: [`IPathStyle`](../type-aliases/IPathStyle.md)

Defined in: [canvas/src/primitives/connectors/pathStyles/bezier.ts:35](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/connectors/pathStyles/bezier.ts#L35)

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
