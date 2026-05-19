# Type Alias: NodeShapeOptions

> **NodeShapeOptions** = [`RectShapeOption`](../interfaces/RectShapeOption.md) \| [`CircleShapeOption`](../interfaces/CircleShapeOption.md) \| [`ArcShapeOption`](../interfaces/ArcShapeOption.md)

Defined in: [graph/src/layer/types.ts:345](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/layer/types.ts#L345)

Discriminated union of node shape options. The `kind` field enforces
per-variant required fields at compile time (e.g., `kind: 'arc'`
requires `innerR`/`outerR`/`startAngle`/`endAngle`).
