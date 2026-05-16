# Type Alias: LngLatTuple

> **LngLatTuple** = readonly \[`number`, `number`\]

Defined in: [graph-layer-maplibre/src/greatCircle.ts:18](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph-layer-maplibre/src/greatCircle.ts#L18)

Spherical interpolation between two `[lng, lat]` points along the
great-circle (shortest path on the sphere). Returns `n` evenly-spaced
samples *including* both endpoints.

Used by stories drawing flight routes / airline arcs: the projected
polyline of these samples reads as a smooth curve on a mercator basemap.
Pure function, no engine dependency — exposed from
`@invana/graph-layer-maplibre` because it pairs with [MapLayer.project](../classes/MapLayer.md#project),
but works fine without the layer too.

Algorithm: classic Slerp on unit-sphere 3-vectors derived from
`(lng, lat)`. Falls back to linear interpolation when the two points are
effectively coincident (angle ≈ 0), which keeps tiny self-loops from
dividing by zero in `sin(0)`.
