# Function: tabbedRectOutline()

> **tabbedRectOutline**(`spec`, `inset?`): [`Point`](../interfaces/Point.md)[]

Trace the folder silhouette into a polyline, inset by `inset` on every side.
Winds clockwise from the tab's top-left corner.

The two re-entrant shoulders stay sharp; the convex corners take a fillet.
Rounding a shoulder reads as a dent rather than a fold.

## Parameters

### spec

[`TabbedRectGeometrySpec`](../type-aliases/TabbedRectGeometrySpec.md)

### inset?

`number` = `0`

## Returns

[`Point`](../interfaces/Point.md)[]
