# Function: roundedPolygonOutline()

> **roundedPolygonOutline**(`corners`): [`Point`](../interfaces/Point.md)[]

Densify a closed corner ring into a polyline, replacing each corner that
carries `r > 0` with a tangent circular fillet.

Works for **convex and concave** corners alike — the fillet centre is
placed along the corner's interior bisector, which flips side with the
corner's turn direction automatically. That's what lets a silhouette with
re-entrant corners (a folder's tab shoulder, a callout's notch) round its
outer corners while leaving the re-entrant ones sharp.

The requested radius is clamped so a fillet can never consume more than
half of either adjacent edge, so authored radii larger than the geometry
degrade gracefully instead of self-intersecting. Arcs are sampled at
roughly one vertex per 2 px of arc length (min 2 segments), matching the
density the rounded-rect outline sampler uses.

Output winds in the same direction as the input ring, starting at the
first corner (or the start of its fillet when it has one).

## Parameters

### corners

readonly [`RoundedCorner`](../interfaces/RoundedCorner.md)[]

## Returns

[`Point`](../interfaces/Point.md)[]
