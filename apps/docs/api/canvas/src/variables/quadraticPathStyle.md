# Variable: quadraticPathStyle

> `const` **quadraticPathStyle**: [`IPathStyle`](../../../renderer-pixijs/src/type-aliases/IPathStyle.md)

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
