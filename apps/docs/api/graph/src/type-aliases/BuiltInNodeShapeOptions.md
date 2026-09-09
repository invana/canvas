# Type Alias: BuiltInNodeShapeOptions

> **BuiltInNodeShapeOptions** = [`RectShapeOption`](../interfaces/RectShapeOption.md) \| `TabbedRectShapeOption` \| [`CircleShapeOption`](../interfaces/CircleShapeOption.md) \| [`ArcShapeOption`](../interfaces/ArcShapeOption.md) \| [`RegularPolygonShapeOption`](../interfaces/RegularPolygonShapeOption.md) \| [`StarShapeOption`](../interfaces/StarShapeOption.md) \| [`PolygonShapeOption`](../interfaces/PolygonShapeOption.md)

Closed union of the six shape kinds that `@invana/canvas` registers out
of the box. Exported so internal switch-narrowing sites can target it
directly via the [isBuiltInNodeShape](../functions/isBuiltInNodeShape.md) type guard.
