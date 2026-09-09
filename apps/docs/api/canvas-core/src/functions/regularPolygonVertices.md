# Function: regularPolygonVertices()

> **regularPolygonVertices**(`sides`, `radius`, `rotationRad`): [`Point`](../interfaces/Point.md)[]

Vertices of a regular polygon with `sides` sides and circum-radius
`radius`, centred at the origin. `rotationRad` is added to the base angle.

Base placement: first vertex at angle `-π/2 + rotationRad` (straight up).
So with `rotation = 0`: triangle (sides=3) points up, pentagon points up,
hexagon has a vertex at the top (pointy-top). For a flat-top hexagon, pass
`rotation = Math.PI / 6`.

## Parameters

### sides

`number`

### radius

`number`

### rotationRad

`number`

## Returns

[`Point`](../interfaces/Point.md)[]
