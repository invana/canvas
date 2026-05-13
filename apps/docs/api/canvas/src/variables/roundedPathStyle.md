# Variable: roundedPathStyle

> `const` **roundedPathStyle**: [`IPathStyle`](../type-aliases/IPathStyle.md)

Defined in: [packages/canvas/src/primitives/connectors/pathStyles/rounded.ts:24](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/connectors/pathStyles/rounded.ts#L24)

Quadratic arc fillets at every interior polyline corner.

For each interior corner B between segments A→B and B→C:
  - Pick a per-corner radius `t = min(radius, |AB|/2, |BC|/2)`.
  - Approach point P1 on segment AB at distance `t` from B.
  - Departure point P2 on segment BC at distance `t` from B.
  - Emit `L P1`, then `Q B P2` — the corner becomes a quadratic with control
    at the original corner.

For a 2-point polyline (no interior corners) the output is identical to
`normal`: `[M, L]`. Collinear corners (parallel incoming/outgoing) emit a
straight `L` through B with no Q (degenerate fillet).
