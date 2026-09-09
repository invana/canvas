# Type Alias: CompositeRootSpec

> **CompositeRootSpec** = [`RectSpec`](../interfaces/RectSpec.md) \| [`CircleSpec`](../interfaces/CircleSpec.md) \| [`EllipseSpec`](../interfaces/EllipseSpec.md) \| [`PolygonSpec`](../interfaces/PolygonSpec.md) \| [`RegularPolygonSpec`](../interfaces/RegularPolygonSpec.md) \| [`StarSpec`](../interfaces/StarSpec.md) \| [`ArcSpec`](../interfaces/ArcSpec.md)

The composite's **root** (background) shape — an ordinary shape spec the
composite borrows for its silhouette. The composite declares no geometry of
its own: a card can be a rect, circle, polygon, etc. just by changing this.
`x`/`y` are ignored — the composite centres the root in its `width × height`
box.
