# Type Alias: ShapeSpec

> **ShapeSpec** = [`CircleSpec`](../interfaces/CircleSpec.md) \| [`EllipseSpec`](../interfaces/EllipseSpec.md) \| [`RectSpec`](../interfaces/RectSpec.md) \| [`TabbedRectSpec`](../interfaces/TabbedRectSpec.md) \| [`PolygonSpec`](../interfaces/PolygonSpec.md) \| [`RegularPolygonSpec`](../interfaces/RegularPolygonSpec.md) \| [`StarSpec`](../interfaces/StarSpec.md) \| [`ArcSpec`](../interfaces/ArcSpec.md) \| [`PathSpec`](../interfaces/PathSpec.md) \| [`CompositeSpec`](../interfaces/CompositeSpec.md)

Every built-in shape spec. A discriminated union on `kind`, so the pure
geometry functions in `specs/shapeGeometry/` can narrow without a cast.

Not closed: `registerShape` admits third-party kinds the engine has never
heard of, which is why the geometry dispatchers accept a `BaseShapeSpec` and
answer `undefined` for a kind they don't know.
