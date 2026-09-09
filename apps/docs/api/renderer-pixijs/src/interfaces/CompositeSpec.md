# Interface: CompositeSpec

Spec for a composite shape. The body is a [CompositeSpec.root](#root) shape
sized to the `width × height` box (default: a rounded rect from
`cornerRadius` / the inherited `fill` / `stroke`). `parts` declares ordered
child geometry + labels at coordinates relative to the composite's top-left
origin.

## Extends

- [`BaseShapeSpec`](BaseShapeSpec.md)

## Properties

### alpha?

> `readonly` `optional` **alpha?**: `number`

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`alpha`](BaseShapeSpec.md#alpha)

***

### clip?

> `readonly` `optional` **clip?**: `boolean`

Clip the child `parts` (and labels / icons) to the root silhouette. When
`true`, a part that runs to the card edge — a left accent bar, a full-width
header — **follows the rounded corners** instead of poking past them (a
`rect` is square geometry and can't round a corner on its own). Off by
default; decorations (hover ring / halo) are never clipped.

***

### cornerRadius?

> `readonly` `optional` **cornerRadius?**: `number`

Corner radius for the *default* rounded-rect root. Ignored when [root](#root) is set.

***

### fill?

> `readonly` `optional` **fill?**: [`ShapeFill`](../type-aliases/ShapeFill.md)

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`fill`](BaseShapeSpec.md#fill)

***

### height

> `readonly` **height**: `number`

***

### kind

> `readonly` **kind**: `"composite"`

#### Overrides

[`BaseShapeSpec`](BaseShapeSpec.md).[`kind`](BaseShapeSpec.md#kind)

***

### parts

> `readonly` **parts**: readonly [`CompositePart`](../type-aliases/CompositePart.md)[]

Ordered child parts; geometry traced into the body, labels mounted as text.

***

### plane?

> `readonly` `optional` **plane?**: `PlaneName`

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

### root?

> `readonly` `optional` **root?**: [`CompositeRootSpec`](../type-aliases/CompositeRootSpec.md)

Background silhouette of the card — any ordinary shape spec (rect / circle /
polygon / regular-polygon / star / arc). Omit for a rounded rectangle built
from `cornerRadius` + the inherited `fill` / `stroke`. The composite centres
it in the box and delegates fill, stroke, hit-testing and decorations to it.

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

### visible?

> `readonly` `optional` **visible?**: `boolean`

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`visible`](BaseShapeSpec.md#visible)

***

### width

> `readonly` **width**: `number`

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
