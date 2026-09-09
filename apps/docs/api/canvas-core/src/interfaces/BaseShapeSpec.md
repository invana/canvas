# Interface: BaseShapeSpec

## Extended by

- [`CircleSpec`](CircleSpec.md)
- [`EllipseSpec`](EllipseSpec.md)
- [`RectSpec`](RectSpec.md)
- [`TabbedRectSpec`](TabbedRectSpec.md)
- [`PolygonSpec`](PolygonSpec.md)
- [`RegularPolygonSpec`](RegularPolygonSpec.md)
- [`ArcSpec`](ArcSpec.md)
- [`StarSpec`](StarSpec.md)
- [`PathSpec`](PathSpec.md)
- [`CompositeSpec`](CompositeSpec.md)

## Properties

### alpha?

> `readonly` `optional` **alpha?**: `number`

***

### fill?

> `readonly` `optional` **fill?**: [`ShapeFill`](../type-aliases/ShapeFill.md)

***

### kind

> `readonly` **kind**: `string`

***

### plane?

> `readonly` `optional` **plane?**: [`PlaneName`](../type-aliases/PlaneName.md)

Which paint stripe this shape renders into. Default `'content'` — with
every shape above every connector, the renderer's long-standing
"nodes above edges" convention.

`'backdrop'` moves the shape **below the connectors**, for scenery rather
than content: a group frame, a swimlane band, a region wash. Purely visual —
hit resolution still reads [zIndex](#zindex) recorded at insert, so a backdrop
shape is picked exactly as it was before.

***

### rotation?

> `readonly` `optional` **rotation?**: `number`

Container-level rotation in radians, applied around the shape's
top-left local origin. Composes with effect-driven transform deltas
— the effect aggregator writes `(spec.rotation ?? 0) + dRot` per frame
so connector-hosted badges with `autoRotate: true` keep rotating
smoothly even while a `shake` / `breathing` effect runs on top.

For per-shape geometric rotation (the visible rotation of a regular
polygon's vertices, a star's points, etc.), use the kind-specific
`rotation` field on those shape specs — that one rotates the *geometry*
before it's drawn; this one rotates the *container* after.

***

### stroke?

> `readonly` `optional` **stroke?**: [`ShapeStroke`](ShapeStroke.md)

***

### visible?

> `readonly` `optional` **visible?**: `boolean`

***

### x

> `readonly` **x**: `number`

***

### y

> `readonly` **y**: `number`

***

### zIndex?

> `readonly` `optional` **zIndex?**: `number`

Default `0`. Higher = on top. Used for hit-test resolution.
