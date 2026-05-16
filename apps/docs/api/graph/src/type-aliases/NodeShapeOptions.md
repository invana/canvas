# Type Alias: NodeShapeOptions

> **NodeShapeOptions** = [`RectShapeOption`](../interfaces/RectShapeOption.md) \| [`CircleShapeOption`](../interfaces/CircleShapeOption.md) \| [`ArcShapeOption`](../interfaces/ArcShapeOption.md)

Defined in: [graph/src/layer/types.ts:345](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph/src/layer/types.ts#L345)

Discriminated union of node shape options. The `kind` field enforces
per-variant required fields at compile time (e.g., `kind: 'arc'`
requires `innerR`/`outerR`/`startAngle`/`endAngle`).
