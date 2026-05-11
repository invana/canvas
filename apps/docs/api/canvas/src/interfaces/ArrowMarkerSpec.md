# Interface: ArrowMarkerSpec

Defined in: [packages/canvas/src/primitives/markers/ArrowMarker.ts:33](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/markers/ArrowMarker.ts#L33)

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

Defined in: [packages/canvas/src/primitives/types.ts:353](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/types.ts#L353)

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`alpha`](BaseShapeSpec.md#alpha)

***

### fill?

> `readonly` `optional` **fill?**: [`ShapeFill`](../type-aliases/ShapeFill.md)

Defined in: [packages/canvas/src/primitives/types.ts:349](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/types.ts#L349)

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`fill`](BaseShapeSpec.md#fill)

***

### kind

> `readonly` **kind**: `"arrow"`

Defined in: [packages/canvas/src/primitives/markers/ArrowMarker.ts:34](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/markers/ArrowMarker.ts#L34)

#### Overrides

[`BaseShapeSpec`](BaseShapeSpec.md).[`kind`](BaseShapeSpec.md#kind)

***

### lengthScale?

> `readonly` `optional` **lengthScale?**: `number`

Defined in: [packages/canvas/src/primitives/markers/ArrowMarker.ts:39](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/markers/ArrowMarker.ts#L39)

Multiplier on the connector's stroke width that yields the tip-to-base
distance. Default `4` (so a 2px stroke produces an 8px-long arrow).

***

### stroke?

> `readonly` `optional` **stroke?**: [`ShapeStroke`](ShapeStroke.md)

Defined in: [packages/canvas/src/primitives/types.ts:350](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/types.ts#L350)

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`stroke`](BaseShapeSpec.md#stroke)

***

### visible?

> `readonly` `optional` **visible?**: `boolean`

Defined in: [packages/canvas/src/primitives/types.ts:354](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/types.ts#L354)

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`visible`](BaseShapeSpec.md#visible)

***

### widthScale?

> `readonly` `optional` **widthScale?**: `number`

Defined in: [packages/canvas/src/primitives/markers/ArrowMarker.ts:45](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/markers/ArrowMarker.ts#L45)

Multiplier on the connector's stroke width that yields the perpendicular
base width. Final width is clamped to `≥ strokeWidth` so the arrow base
is never narrower than the line. Default `3`.

***

### x

> `readonly` **x**: `number`

Defined in: [packages/canvas/src/primitives/types.ts:347](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/types.ts#L347)

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`x`](BaseShapeSpec.md#x)

***

### y

> `readonly` **y**: `number`

Defined in: [packages/canvas/src/primitives/types.ts:348](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/types.ts#L348)

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`y`](BaseShapeSpec.md#y)

***

### zIndex?

> `readonly` `optional` **zIndex?**: `number`

Defined in: [packages/canvas/src/primitives/types.ts:352](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/types.ts#L352)

Default `0`. Higher = on top. Used for hit-test resolution.

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`zIndex`](BaseShapeSpec.md#zindex)
