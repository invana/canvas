# Variable: smoothPathStyle

> `const` **smoothPathStyle**: [`IPathStyle`](../../../renderer-pixijs/src/type-aliases/IPathStyle.md)

Catmull-Rom spline through every polyline point, emitted as cubic Béziers.
The curve passes through every input point exactly; intermediate router
waypoints / manhattan corners become smoothly interpolated bends.

For each segment `Pi → Pi+1`, the control points use Catmull-Rom to Bézier
conversion:
  `c1 = Pi + (Pi+1 - Pi-1) * tension / 6`
  `c2 = Pi+1 - (Pi+2 - Pi) * tension / 6`

At the endpoints, the missing virtual neighbour is mirrored
(`P-1 = P0`, `Pn+1 = Pn`).

For a 2-point polyline this produces a single cubic with collinear control
points — visually identical to a straight line.
