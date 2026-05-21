# Interface: PolygonSpec

Defined in: [canvas/src/primitives/types.ts:429](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L429)

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

Defined in: [canvas/src/primitives/types.ts:393](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L393)

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`alpha`](BaseShapeSpec.md#alpha)

***

### fill?

> `readonly` `optional` **fill?**: [`ShapeFill`](../type-aliases/ShapeFill.md)

Defined in: [canvas/src/primitives/types.ts:389](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L389)

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`fill`](BaseShapeSpec.md#fill)

***

### kind

> `readonly` **kind**: `"polygon"`

Defined in: [canvas/src/primitives/types.ts:430](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L430)

#### Overrides

[`BaseShapeSpec`](BaseShapeSpec.md).[`kind`](BaseShapeSpec.md#kind)

***

### rotation?

> `readonly` `optional` **rotation?**: `number`

Defined in: [canvas/src/primitives/types.ts:407](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L407)

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

Defined in: [canvas/src/primitives/types.ts:390](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L390)

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`stroke`](BaseShapeSpec.md#stroke)

***

### vertices

> `readonly` **vertices**: readonly [`Point`](Point.md)[]

Defined in: [canvas/src/primitives/types.ts:431](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L431)

***

### visible?

> `readonly` `optional` **visible?**: `boolean`

Defined in: [canvas/src/primitives/types.ts:394](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L394)

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`visible`](BaseShapeSpec.md#visible)

***

### x

> `readonly` **x**: `number`

Defined in: [canvas/src/primitives/types.ts:387](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L387)

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`x`](BaseShapeSpec.md#x)

***

### y

> `readonly` **y**: `number`

Defined in: [canvas/src/primitives/types.ts:388](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L388)

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`y`](BaseShapeSpec.md#y)

***

### zIndex?

> `readonly` `optional` **zIndex?**: `number`

Defined in: [canvas/src/primitives/types.ts:392](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L392)

Default `0`. Higher = on top. Used for hit-test resolution.

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`zIndex`](BaseShapeSpec.md#zindex)
