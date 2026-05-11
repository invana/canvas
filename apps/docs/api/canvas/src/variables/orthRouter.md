# Variable: orthRouter

> `const` **orthRouter**: [`IRouter`](../type-aliases/IRouter.md)

Defined in: [packages/canvas/src/primitives/connectors/routers/orth.ts:28](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/connectors/routers/orth.ts#L28)

Orth router — produces a polyline made of horizontal and vertical
segments only. Simple, geometric, **no obstacle awareness**: pick this
for clean H/V routing in layouts you trust to have no shapes in the way.
For obstacle avoidance, use `manhattan` (which is built on top of A*).

Naming follows X6 / JointJS / mxGraph: their `Orth` is also the simple
H/V router, while their `Manhattan` is the obstacle-aware variant.

For each consecutive pair `(P, Q)` of `[source, ...waypoints, target]`,
one bend point is inserted (producing an L-shape for that pair). The bend
direction (H-first vs V-first) is chosen by:

  1. **Source tangent** on the first segment — the line exits along the
     tangent's dominant axis. The boundary anchor sets this as an outward
     normal hint.
  2. **Target tangent** on the last segment — the line approaches matching
     the tangent's dominant axis (so the final leg is perpendicular to the
     target boundary).
  3. **Alternation** in between — alternate H ↔ V across consecutive
     segments to avoid back-tracking.
  4. **Dominant axis** as a final fallback when no other signal applies.

Aligned consecutive points (same x or same y) emit no bend.
