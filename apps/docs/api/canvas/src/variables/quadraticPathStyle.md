# Variable: quadraticPathStyle

> `const` **quadraticPathStyle**: [`IPathStyle`](../type-aliases/IPathStyle.md)

Defined in: [canvas/src/primitives/connectors/pathStyles/quadratic.ts:47](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/connectors/pathStyles/quadratic.ts#L47)

Quadratic Bézier from the first polyline point to the last with a single
control point placed **perpendicular to the chord** at `curvePosition`
along it and `curveOffset` units to the side.

This is the G6-style "quadratic edge": one control point, signed
perpendicular offset, fixed position along the chord. Unlike axis-aligned
`bezier` (whose control handles pull along `axis: 'h' | 'v'`), the
perpendicular construction gives a real bow on **every** orientation —
cardinal chords no longer collapse to straight lines.

Pair with `router: 'straight'`; intermediate polyline waypoints are
ignored (a router that produces extra points doesn't compose
meaningfully with a single-control-point quadratic).

Edge cases:
 - Polyline shorter than two points → `[]` (matches the other pathStyles).
 - Coincident endpoints (`len === 0`) → degenerate `M` only; the
   perpendicular is undefined.
