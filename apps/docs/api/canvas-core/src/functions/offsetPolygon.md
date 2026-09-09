# Function: offsetPolygon()

> **offsetPolygon**(`vertices`, `distance`): [`Point`](../interfaces/Point.md)[]

Parallel-offset a closed polygon by `distance` along each edge's inward
normal. Positive `distance` shrinks (inset); negative grows (outset).

Each vertex is moved along the **bisector** of its two adjacent edge
normals, scaled so the perpendicular offset along the edges equals
`distance`. Sufficient for convex and mildly concave silhouettes — the
regular-polygon and star convenience kinds always produce well-behaved
shapes, free-form polygon insets are best-effort and may self-intersect at
extreme concavities.

## Parameters

### vertices

readonly [`Point`](../interfaces/Point.md)[]

### distance

`number`

## Returns

[`Point`](../interfaces/Point.md)[]
