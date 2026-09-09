# Type Alias: IPathStyle

> **IPathStyle** = (`polyline`, `opts?`, `endpoints?`) => [`Path`](Path.md)

PathStyle: a pure function `(polyline, opts?, endpoints?) → Path`.

PathStyles decide visual **style** — how segments between polyline points
are drawn (sharp, rounded fillets, bezier-smoothed, single bezier A→B).
They never see the connector spec or shape context; pure geometric
transform.

`endpoints` carries the anchor-resolved source/target (with `tangent`) so
tangent-aware styles can align Bézier handles with each shape's outward
normal. Optional — styles that don't need it ignore the argument and a
direct unit-test invocation (`bumpHorizontal(polyline)`) keeps working.

Built-ins: `normal` (sharp), `rounded` (quadratic fillets at corners),
`smooth` (Catmull-Rom → cubic), `bezier` (single cubic with auto controls).

## Parameters

### polyline

[`Polyline`](Polyline.md)

### opts?

`Record`\<`string`, `unknown`\>

### endpoints?

[`PathStyleEndpoints`](../interfaces/PathStyleEndpoints.md)

## Returns

[`Path`](Path.md)
