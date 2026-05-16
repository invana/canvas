# Type Alias: NodeShapeOptions

> **NodeShapeOptions** = [`RectShapeOption`](../interfaces/RectShapeOption.md) \| [`CircleShapeOption`](../interfaces/CircleShapeOption.md) \| [`ArcShapeOption`](../interfaces/ArcShapeOption.md)

Defined in: [graph/src/layer/types.ts:345](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L345)

Discriminated union of node shape options. The `kind` field enforces
per-variant required fields at compile time (e.g., `kind: 'arc'`
requires `innerR`/`outerR`/`startAngle`/`endAngle`).
