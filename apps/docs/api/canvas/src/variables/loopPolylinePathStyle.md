# Variable: loopPolylinePathStyle

> `const` **loopPolylinePathStyle**: [`IPathStyle`](../../../renderer-pixijs/src/type-aliases/IPathStyle.md)

Self-loop pathStyle — orthogonal polyline anchored at the first
polyline point. Designed for edges where source and target reference
the same shape; the router output is `[p, p]` and this style ignores
everything after `polyline[0]`.

Two geometries dispatch on `side`:

**Cardinal U-bracket** (`top` / `right` / `bottom` / `left` or any
numeric angle) — three segments. Feet sit on a chord perpendicular
to `side` at distance `baseOffset` from the pivot, separated by
`gap`. From each foot the path runs `stubLength` further along
`side` to the two outer corners, joined by one cross segment.

**Corner wrap** (`top-right` / `bottom-right` / `bottom-left` /
`top-left`) — four segments. Both feet sit on the host silhouette:
one on the horizontal edge `gap` from the named corner, the other
on the vertical edge `gap` from the same corner. From each foot the
path runs `stubLength` perpendicular to its edge (outward), the two
outward stubs are joined by a cross segment past the corner, and the
arrow lands flush with the perpendicular edge. The wrap's inner
corner sits at `(±baseOffsetX, ±baseOffsetY)` from the pivot.

Pair with `router: 'straight'`; the polyline content beyond the first
point is ignored.

Edge cases:
 - Polyline shorter than one point: returns `[]`.
 - Cardinal `gap = 0`: both stubs collapse onto the same line — the
   loop reads as a single out-and-back spike.
 - Corner `gap = 0`: both feet land at the corner itself; the wrap
   degenerates to a closed rectangle whose inner corner touches the
   silhouette.
