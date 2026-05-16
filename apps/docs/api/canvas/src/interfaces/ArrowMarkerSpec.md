# Interface: ArrowMarkerSpec

Defined in: [canvas/src/primitives/markers/ArrowMarker.ts:33](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/markers/ArrowMarker.ts#L33)

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

Defined in: [canvas/src/primitives/types.ts:341](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/types.ts#L341)

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`alpha`](BaseShapeSpec.md#alpha)

***

### fill?

> `readonly` `optional` **fill?**: [`ShapeFill`](../type-aliases/ShapeFill.md)

Defined in: [canvas/src/primitives/types.ts:337](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/types.ts#L337)

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`fill`](BaseShapeSpec.md#fill)

***

### kind

> `readonly` **kind**: `"arrow"`

Defined in: [canvas/src/primitives/markers/ArrowMarker.ts:34](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/markers/ArrowMarker.ts#L34)

#### Overrides

[`BaseShapeSpec`](BaseShapeSpec.md).[`kind`](BaseShapeSpec.md#kind)

***

### lengthScale?

> `readonly` `optional` **lengthScale?**: `number`

Defined in: [canvas/src/primitives/markers/ArrowMarker.ts:39](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/markers/ArrowMarker.ts#L39)

Multiplier on the connector's stroke width that yields the tip-to-base
distance. Default `4` (so a 2px stroke produces an 8px-long arrow).

***

### stroke?

> `readonly` `optional` **stroke?**: [`ShapeStroke`](ShapeStroke.md)

Defined in: [canvas/src/primitives/types.ts:338](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/types.ts#L338)

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`stroke`](BaseShapeSpec.md#stroke)

***

### visible?

> `readonly` `optional` **visible?**: `boolean`

Defined in: [canvas/src/primitives/types.ts:342](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/types.ts#L342)

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`visible`](BaseShapeSpec.md#visible)

***

### widthScale?

> `readonly` `optional` **widthScale?**: `number`

Defined in: [canvas/src/primitives/markers/ArrowMarker.ts:45](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/markers/ArrowMarker.ts#L45)

Multiplier on the connector's stroke width that yields the perpendicular
base width. Final width is clamped to `≥ strokeWidth` so the arrow base
is never narrower than the line. Default `3`.

***

### x

> `readonly` **x**: `number`

Defined in: [canvas/src/primitives/types.ts:335](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/types.ts#L335)

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`x`](BaseShapeSpec.md#x)

***

### y

> `readonly` **y**: `number`

Defined in: [canvas/src/primitives/types.ts:336](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/types.ts#L336)

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`y`](BaseShapeSpec.md#y)

***

### zIndex?

> `readonly` `optional` **zIndex?**: `number`

Defined in: [canvas/src/primitives/types.ts:340](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/types.ts#L340)

Default `0`. Higher = on top. Used for hit-test resolution.

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`zIndex`](BaseShapeSpec.md#zindex)
