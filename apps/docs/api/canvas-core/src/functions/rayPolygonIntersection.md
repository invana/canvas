# Function: rayPolygonIntersection()

> **rayPolygonIntersection**(`localFromCenter`, `vertices`): [`Point`](../interfaces/Point.md)

Ray from the origin toward `localFromCenter`, intersected with the polygon
silhouette. Returns the farthest hit (i.e. where the ray exits the
polygon) as a centre-relative point, or `null` if the ray doesn't cross
any edge.

Used by `boundaryIntersect` to snap connector anchors to the exact
perimeter of polygonal shapes.

## Parameters

### localFromCenter

[`Point`](../interfaces/Point.md)

### vertices

readonly [`Point`](../interfaces/Point.md)[]

## Returns

[`Point`](../interfaces/Point.md)
