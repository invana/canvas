# Interface: PolygonSpec

Free-form polygon. `vertices` are centre-relative — the silhouette is
traced around the origin, then translated to `(x, y)`. Closed implicitly:
the last vertex connects back to the first. Use this for arbitrary
outlines (arrows, blobs, callouts). For regular n-gons or stars prefer
`RegularPolygonSpec` / `StarSpec` — they're cheaper to author.

## Extends

- [`BaseShapeSpec`](BaseShapeSpec.md)

## Properties

### alpha?

> `readonly` `optional` **alpha?**: `number`

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`alpha`](BaseShapeSpec.md#alpha)

***

### fill?

> `readonly` `optional` **fill?**: [`ShapeFill`](../type-aliases/ShapeFill.md)

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`fill`](BaseShapeSpec.md#fill)

***

### kind

> `readonly` **kind**: `"polygon"`

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

### stroke?

> `readonly` `optional` **stroke?**: [`ShapeStroke`](ShapeStroke.md)

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`stroke`](BaseShapeSpec.md#stroke)

***

### vertices

> `readonly` **vertices**: readonly [`Point`](Point.md)[]

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
