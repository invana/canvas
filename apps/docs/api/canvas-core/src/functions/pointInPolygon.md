# Function: pointInPolygon()

> **pointInPolygon**(`localX`, `localY`, `vertices`): `boolean`

Even-odd ray-cast point-in-polygon test. Handles convex and concave
silhouettes. Treats the polygon as closed (last vertex implicitly
connects to first).

## Parameters

### localX

`number`

### localY

`number`

### vertices

readonly [`Point`](../interfaces/Point.md)[]

## Returns

`boolean`
