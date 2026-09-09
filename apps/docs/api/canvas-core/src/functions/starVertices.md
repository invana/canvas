# Function: starVertices()

> **starVertices**(`points`, `innerRadius`, `outerRadius`, `rotationRad`): [`Point`](../interfaces/Point.md)[]

Vertices of a star with `points` outer points, alternating outer
(`outerRadius`) and inner (`innerRadius`) vertices around the origin.
`rotationRad` is added to the base angle.

Base placement: first outer vertex at angle `-π/2 + rotationRad` (up).

## Parameters

### points

`number`

### innerRadius

`number`

### outerRadius

`number`

### rotationRad

`number`

## Returns

[`Point`](../interfaces/Point.md)[]
