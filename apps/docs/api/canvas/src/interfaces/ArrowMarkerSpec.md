# Interface: ArrowMarkerSpec

Defined in: [canvas/src/primitives/markers/ArrowMarker.ts:33](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/markers/ArrowMarker.ts#L33)

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

Defined in: [canvas/src/primitives/types.ts:393](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L393)

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`alpha`](BaseShapeSpec.md#alpha)

***

### fill?

> `readonly` `optional` **fill?**: [`ShapeFill`](../type-aliases/ShapeFill.md)

Defined in: [canvas/src/primitives/types.ts:389](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L389)

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`fill`](BaseShapeSpec.md#fill)

***

### kind

> `readonly` **kind**: `"arrow"`

Defined in: [canvas/src/primitives/markers/ArrowMarker.ts:34](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/markers/ArrowMarker.ts#L34)

#### Overrides

[`BaseShapeSpec`](BaseShapeSpec.md).[`kind`](BaseShapeSpec.md#kind)

***

### lengthScale?

> `readonly` `optional` **lengthScale?**: `number`

Defined in: [canvas/src/primitives/markers/ArrowMarker.ts:39](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/markers/ArrowMarker.ts#L39)

Multiplier on the connector's stroke width that yields the tip-to-base
distance. Default `4` (so a 2px stroke produces an 8px-long arrow).

***

### rotation?

> `readonly` `optional` **rotation?**: `number`

Defined in: [canvas/src/primitives/types.ts:407](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L407)

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

Defined in: [canvas/src/primitives/types.ts:390](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L390)

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`stroke`](BaseShapeSpec.md#stroke)

***

### visible?

> `readonly` `optional` **visible?**: `boolean`

Defined in: [canvas/src/primitives/types.ts:394](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L394)

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`visible`](BaseShapeSpec.md#visible)

***

### widthScale?

> `readonly` `optional` **widthScale?**: `number`

Defined in: [canvas/src/primitives/markers/ArrowMarker.ts:45](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/markers/ArrowMarker.ts#L45)

Multiplier on the connector's stroke width that yields the perpendicular
base width. Final width is clamped to `≥ strokeWidth` so the arrow base
is never narrower than the line. Default `3`.

***

### x

> `readonly` **x**: `number`

Defined in: [canvas/src/primitives/types.ts:387](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L387)

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`x`](BaseShapeSpec.md#x)

***

### y

> `readonly` **y**: `number`

Defined in: [canvas/src/primitives/types.ts:388](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L388)

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`y`](BaseShapeSpec.md#y)

***

### zIndex?

> `readonly` `optional` **zIndex?**: `number`

Defined in: [canvas/src/primitives/types.ts:392](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L392)

Default `0`. Higher = on top. Used for hit-test resolution.

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`zIndex`](BaseShapeSpec.md#zindex)
