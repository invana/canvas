# Interface: PathSpec

Free-form polyline or filled outline. Points are centre-relative, like
[PolygonSpec](PolygonSpec.md), but the run is **open by default** — set `closed` to
join the last point back to the first.

This is the vocabulary for shapes whose geometry is *computed* rather than
parameterised: density-contour bands, bubble-set hulls, region outlines. It
exists so those features can be described as data instead of drawn with a
backend drawing API — see `docs/renderer-split-design.md` §3.

## Extends

- [`BaseShapeSpec`](BaseShapeSpec.md)

## Properties

### alpha?

> `readonly` `optional` **alpha?**: `number`

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`alpha`](BaseShapeSpec.md#alpha)

***

### closed?

> `readonly` `optional` **closed?**: `boolean`

Join the last point back to the first. Default `false`.

***

### fill?

> `readonly` `optional` **fill?**: [`ShapeFill`](../type-aliases/ShapeFill.md)

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`fill`](BaseShapeSpec.md#fill)

***

### kind

> `readonly` **kind**: `"path"`

#### Overrides

[`BaseShapeSpec`](BaseShapeSpec.md).[`kind`](BaseShapeSpec.md#kind)

***

### plane?

> `readonly` `optional` **plane?**: [`PlaneName`](../type-aliases/PlaneName.md)

Which paint stripe this shape renders into. Default `'content'` — with
every shape above every connector, the renderer's long-standing
"nodes above edges" convention.

`'backdrop'` moves the shape **below the connectors**, for scenery rather
than content: a group frame, a swimlane band, a region wash. Purely visual —
hit resolution still reads [zIndex](BaseShapeSpec.md#zindex) recorded at insert, so a backdrop
shape is picked exactly as it was before.

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`plane`](BaseShapeSpec.md#plane)

***

### points

> `readonly` **points**: readonly [`Point`](Point.md)[]

Centre-relative points, in order. Fewer than 2 renders nothing.

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

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`rotation`](BaseShapeSpec.md#rotation)

***

### smooth?

> `readonly` `optional` **smooth?**: `boolean`

Treat `points` as **off-curve control points** of a closed quadratic spline
through segment midpoints, rather than as straight segments. The result is
C¹ continuous, so marching-squares stair-stepping renders as a smooth
contour without pre-smoothing the data.

Implies `closed`. Default `false`.

***

### stroke?

> `readonly` `optional` **stroke?**: [`ShapeStroke`](ShapeStroke.md)

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`stroke`](BaseShapeSpec.md#stroke)

***

### visible?

> `readonly` `optional` **visible?**: `boolean`

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`visible`](BaseShapeSpec.md#visible)

***

### x

> `readonly` **x**: `number`

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`x`](BaseShapeSpec.md#x)

***

### y

> `readonly` **y**: `number`

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`y`](BaseShapeSpec.md#y)

***

### zIndex?

> `readonly` `optional` **zIndex?**: `number`

Default `0`. Higher = on top. Used for hit-test resolution.

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`zIndex`](BaseShapeSpec.md#zindex)
