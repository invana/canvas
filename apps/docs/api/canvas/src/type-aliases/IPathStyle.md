# Type Alias: IPathStyle

> **IPathStyle** = (`polyline`, `opts?`) => [`Path`](Path.md)

Defined in: [canvas/src/primitives/types.ts:143](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/primitives/types.ts#L143)

PathStyle: a pure function `(polyline, opts?) → Path`.

PathStyles decide visual **style** — how segments between polyline points
are drawn (sharp, rounded fillets, bezier-smoothed, single bezier A→B).
They never see the connector spec or shape context; pure geometric
transform.

Built-ins: `normal` (sharp), `rounded` (quadratic fillets at corners),
`smooth` (Catmull-Rom → cubic), `bezier` (single cubic with auto controls).

## Parameters

### polyline

[`Polyline`](Polyline.md)

### opts?

`Record`\<`string`, `unknown`\>

## Returns

[`Path`](Path.md)
