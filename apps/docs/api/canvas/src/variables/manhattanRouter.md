# Variable: manhattanRouter

> `const` **manhattanRouter**: [`IRouter`](../type-aliases/IRouter.md)

Defined in: [canvas/src/primitives/connectors/routers/manhattan.ts:62](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/connectors/routers/manhattan.ts#L62)

Manhattan router — H/V segments only, **routing around obstacles when
necessary**.

Naming follows X6 / JointJS / mxGraph where `Manhattan` is the
obstacle-aware variant and `Orth` is the simple non-avoiding one.

Pipeline (lazy A*):
  1. Compute the simple `orthRouter` polyline first (single L-bend or
     tangent-aware Z-bend).
  2. If `ctx.obstacles` is empty OR no segment of the simple polyline
     crosses an inflated obstacle, return it directly. Same output as the
     `orth` router — clean, no stair-stepping.
  3. Otherwise build a coarse `ObstacleGrid` and run A* (connectivity 4)
     from source cell to target cell. Simplify the cell path to bend
     points only and convert back to world coordinates.

Failure cases all fall back to the simple `orthRouter` polyline:
  - Grid construction returns `null` (cell-count cap exceeded).
  - A* finds no path (source/target unreachable through inflated obstacles).

The fallback emits a `console.warn` so the dev sees why avoidance didn't
kick in; toggle `routerOpts.obstacles: 'none'` to skip the obstacle check
entirely.

Waypoints are not yet threaded through A* — when present, the simple orth
polyline (which respects waypoints) is checked against obstacles. If it's
clear, return it; if not, A* runs between source and target only.
Routing through waypoints with obstacle awareness is a future extension.
