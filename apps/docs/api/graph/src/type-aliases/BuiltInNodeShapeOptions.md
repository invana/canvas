# Type Alias: BuiltInNodeShapeOptions

> **BuiltInNodeShapeOptions** = [`RectShapeOption`](../interfaces/RectShapeOption.md) \| [`CircleShapeOption`](../interfaces/CircleShapeOption.md) \| [`ArcShapeOption`](../interfaces/ArcShapeOption.md) \| [`RegularPolygonShapeOption`](../interfaces/RegularPolygonShapeOption.md) \| [`StarShapeOption`](../interfaces/StarShapeOption.md) \| [`PolygonShapeOption`](../interfaces/PolygonShapeOption.md)

Defined in: [graph/src/layer/types.ts:291](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L291)

Closed union of the six shape kinds that `@invana/canvas` registers out
of the box. Exported so internal switch-narrowing sites can target it
directly via the [isBuiltInNodeShape](../functions/isBuiltInNodeShape.md) type guard.
