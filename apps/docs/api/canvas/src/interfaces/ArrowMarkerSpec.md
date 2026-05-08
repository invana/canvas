# Interface: ArrowMarkerSpec

Defined in: packages/canvas/src/primitives/markers/ArrowMarker.ts:25

Arrowhead marker. Drawn as a triangle whose tip lies at the anchor; the
base extends `length` pixels back along the negative tangent direction
with a perpendicular spread of `width`.

Two paint surfaces:
  - **instance**: used as a regular shape via `addShape` — the arrow tip
    anchors at `(spec.x, spec.y)` and points along +X (angle = 0). Useful
    for stand-alone arrowheads or directional badges.
  - **static**: used as a connector marker via `connectorSpec.sourceMarker
    = arrowMarkerSpec(...)` — the connector calls `ArrowMarker.paintInto`
    with the polyline endpoint + tangent angle.

## Extends

- [`BaseShapeSpec`](BaseShapeSpec.md)

## Properties

### alpha?

> `readonly` `optional` **alpha?**: `number`

Defined in: packages/canvas/src/primitives/types.ts:211

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`alpha`](BaseShapeSpec.md#alpha)

***

### fill?

> `readonly` `optional` **fill?**: [`ShapeFill`](../type-aliases/ShapeFill.md)

Defined in: packages/canvas/src/primitives/types.ts:207

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`fill`](BaseShapeSpec.md#fill)

***

### kind

> `readonly` **kind**: `"arrow"`

Defined in: packages/canvas/src/primitives/markers/ArrowMarker.ts:26

#### Overrides

[`BaseShapeSpec`](BaseShapeSpec.md).[`kind`](BaseShapeSpec.md#kind)

***

### length?

> `readonly` `optional` **length?**: `number`

Defined in: packages/canvas/src/primitives/markers/ArrowMarker.ts:28

Tip-to-base distance, px. Default `10`.

***

### stroke?

> `readonly` `optional` **stroke?**: [`ShapeStroke`](ShapeStroke.md)

Defined in: packages/canvas/src/primitives/types.ts:208

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`stroke`](BaseShapeSpec.md#stroke)

***

### visible?

> `readonly` `optional` **visible?**: `boolean`

Defined in: packages/canvas/src/primitives/types.ts:212

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`visible`](BaseShapeSpec.md#visible)

***

### width?

> `readonly` `optional` **width?**: `number`

Defined in: packages/canvas/src/primitives/markers/ArrowMarker.ts:30

Perpendicular wing spread (full width across the base), px. Default `8`.

***

### x

> `readonly` **x**: `number`

Defined in: packages/canvas/src/primitives/types.ts:205

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`x`](BaseShapeSpec.md#x)

***

### y

> `readonly` **y**: `number`

Defined in: packages/canvas/src/primitives/types.ts:206

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`y`](BaseShapeSpec.md#y)

***

### zIndex?

> `readonly` `optional` **zIndex?**: `number`

Defined in: packages/canvas/src/primitives/types.ts:210

Default `0`. Higher = on top. Used for hit-test resolution.

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`zIndex`](BaseShapeSpec.md#zindex)
