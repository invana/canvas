# Type Alias: BuiltInNodeShapeOptions

> **BuiltInNodeShapeOptions** = [`RectShapeOption`](../interfaces/RectShapeOption.md) \| [`CircleShapeOption`](../interfaces/CircleShapeOption.md) \| [`ArcShapeOption`](../interfaces/ArcShapeOption.md) \| [`RegularPolygonShapeOption`](../interfaces/RegularPolygonShapeOption.md) \| [`StarShapeOption`](../interfaces/StarShapeOption.md) \| [`PolygonShapeOption`](../interfaces/PolygonShapeOption.md)

Defined in: [graph/src/layer/types.ts:318](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L318)

Closed union of the six shape kinds that `@invana/canvas` registers out
of the box. Exported so internal switch-narrowing sites can target it
directly via the [isBuiltInNodeShape](../functions/isBuiltInNodeShape.md) type guard.
