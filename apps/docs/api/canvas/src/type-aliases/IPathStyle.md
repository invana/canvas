# Type Alias: IPathStyle

> **IPathStyle** = (`polyline`, `opts?`) => [`Path`](Path.md)

Defined in: [packages/canvas/src/primitives/types.ts:143](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/types.ts#L143)

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
