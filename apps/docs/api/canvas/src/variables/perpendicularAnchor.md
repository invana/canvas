# Variable: perpendicularAnchor

> `const` **perpendicularAnchor**: [`IAnchor`](../type-aliases/IAnchor.md)

Defined in: [packages/canvas/src/primitives/connectors/anchors/perpendicular.ts:24](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/connectors/anchors/perpendicular.ts#L24)

Perpendicular anchor — exits at the **midpoint of the face** of the
shape's bounding box that is closest to the other endpoint. The face is
picked by comparing `|dx| / halfWidth` against `|dy| / halfHeight`: the
ratio that's larger wins (so a target slightly to the right of a wide,
short rect still picks the right side; a tall, narrow rect picks the top
or bottom more readily).

Best for **orth-style routing** (`orth`, `manhattan`, `metro`, `er`,
`oneSide`) where the natural exit is along one cardinal axis. Produces
the "lines start at the middle of a side" look common in flowcharts and
ER diagrams.

For circles (square bounds), this lands at the cardinal points
(N / S / E / W) on the perimeter — a useful default though `boundary`
still gives smoother diagonal exits for non-orthogonal routers.

Sets the outward tangent to the face normal: `(±1, 0)` for left/right
faces, `(0, ±1)` for top/bottom. Routers like `orth` consume this to
pick H-first vs V-first.
