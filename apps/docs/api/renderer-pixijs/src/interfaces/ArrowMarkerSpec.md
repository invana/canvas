# Interface: ArrowMarkerSpec

Arrowhead marker. Drawn as a triangle whose tip lies at the anchor; the
base extends `lengthScale × strokeWidth` pixels back along the negative
tangent direction with a perpendicular spread of `widthScale × strokeWidth`
(clamped so the base is never narrower than the line).

Sizing is **always proportional to the host connector's stroke width** —
a 1px line gets a 4×3 arrow (with the default scales), a 7px line gets a
28×21 arrow. The base width is additionally clamped to ≥ strokeWidth so a
thick line never feeds into a narrower arrow base.

Two paint surfaces:
  - **instance**: used as a regular shape via `addShape` — the arrow tip
    anchors at `(spec.x, spec.y)` and points along +X (angle = 0). Useful
    for stand-alone arrowheads or directional badges. With no host
    connector, sizing assumes `strokeWidth = 1`.
  - **static**: used as a connector marker via `connectorSpec.sourceMarker
    = arrowMarkerSpec(...)` — the connector calls `ArrowMarker.paintInto`
    with the polyline endpoint, tangent angle, and resolved strokeWidth.

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

> `readonly` **kind**: `"arrow"`

#### Overrides

[`BaseShapeSpec`](BaseShapeSpec.md).[`kind`](BaseShapeSpec.md#kind)

***

### lengthScale?

> `readonly` `optional` **lengthScale?**: `number`

Multiplier on the connector's stroke width that yields the tip-to-base
distance. Default `4` (so a 2px stroke produces an 8px-long arrow).

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

### widthScale?

> `readonly` `optional` **widthScale?**: `number`

Multiplier on the connector's stroke width that yields the perpendicular
base width. Final width is clamped to `≥ strokeWidth` so the arrow base
is never narrower than the line. Default `3`.

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
