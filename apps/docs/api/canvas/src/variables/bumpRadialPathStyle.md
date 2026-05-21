# Variable: bumpRadialPathStyle

> `const` **bumpRadialPathStyle**: [`IPathStyle`](../type-aliases/IPathStyle.md)

Defined in: [canvas/src/primitives/connectors/pathStyles/bumpRadial.ts:37](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/connectors/pathStyles/bumpRadial.ts#L37)

Single cubic Bézier from the first to the last polyline point with control
points placed on the **midradius circle** at the source and target angles.

This is the same curve `d3.linkRadial()` produces, ported to operate on
cartesian polyline endpoints (we recover the polar coordinates from the
configured origin). It gives a tree edge that:
 - leaves the source tangent to the radius (radially outward / inward),
 - sweeps through the midradius arc between the two angles,
 - arrives at the target tangent to the radius.

The result reads correctly in any orientation — it doesn't bulge sideways
the way an axis-aligned `bezier` does on near-vertical edges. Pair with
`router: 'straight'`; intermediate polyline waypoints are ignored (a
router that produces extra points doesn't compose meaningfully with a
polar curve).

Edge cases:
 - Co-linear with the origin (`r0` or `r1` is zero, or both angles equal):
   falls back to a straight line, since a polar curve isn't defined.
 - Polyline shorter than two points: returns `[]` (matches other styles).
