# Interface: LiquidFillDecorationStyle

Defined in: [canvas/src/primitives/decorations/shape/LiquidFillDecoration.ts:21](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/LiquidFillDecoration.ts#L21)

Liquid fill — paints a fluid level inside the host's silhouette, with a
vertical gradient and an optional wavy surface. Achieved without a "fill
provider" hook on shapes: the decoration paints a fluid polygon into its
own Graphics and masks the whole thing with the host silhouette via
`host.shape.paintInto({ fill: true })`.

**Stroke compatibility.** When the host shape's stroke alignment is
`'outside'`, the stroke sits outside the silhouette and the mask leaves it
fully visible. For `'center'` / `'inside'`, the liquid covers the inside
portion of the stroke. Prefer `'outside'` for tank / pill diagrams.

**Animation.** When `wave` is omitted the surface is a flat horizontal
line and `tick` returns `false` — the renderer retires the decoration
from its animation set, so still-water mode costs zero per frame after
`mount`. Supply `wave` to animate the meniscus.

## Properties

### alpha?

> `readonly` `optional` **alpha?**: `number`

Defined in: [canvas/src/primitives/decorations/shape/LiquidFillDecoration.ts:29](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/LiquidFillDecoration.ts#L29)

Overall opacity of the fluid. Default `1`.

***

### colorBottom?

> `readonly` `optional` **colorBottom?**: `number`

Defined in: [canvas/src/primitives/decorations/shape/LiquidFillDecoration.ts:27](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/LiquidFillDecoration.ts#L27)

Gradient colour at the bottom. Default dark blue (`0x2d4d6e`).

***

### colorTop?

> `readonly` `optional` **colorTop?**: `number`

Defined in: [canvas/src/primitives/decorations/shape/LiquidFillDecoration.ts:25](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/LiquidFillDecoration.ts#L25)

Gradient colour at the surface. Default light blue (`0x9bbedb`).

***

### fillLevel?

> `readonly` `optional` **fillLevel?**: `number`

Defined in: [canvas/src/primitives/decorations/shape/LiquidFillDecoration.ts:23](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/LiquidFillDecoration.ts#L23)

Surface height as a fraction of host bounds height. `0` empty, `1` full. Default `0.6`.

***

### surfaceHighlight?

> `readonly` `optional` **surfaceHighlight?**: `object`

Defined in: [canvas/src/primitives/decorations/shape/LiquidFillDecoration.ts:48](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/LiquidFillDecoration.ts#L48)

Optional thin highlight band stroked along the surface (gloss / meniscus
effect). Opt-in: omit the field to skip drawing the highlight entirely.

#### alpha?

> `readonly` `optional` **alpha?**: `number`

Default `0.35`.

#### color?

> `readonly` `optional` **color?**: `number`

Default `0xffffff`.

#### thickness?

> `readonly` `optional` **thickness?**: `number`

Stroke width in px. Default `3`.

***

### wave?

> `readonly` `optional` **wave?**: `object`

Defined in: [canvas/src/primitives/decorations/shape/LiquidFillDecoration.ts:34](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/LiquidFillDecoration.ts#L34)

Wave configuration. Omit (or pass `undefined`) for a flat still surface.
Provide for an animated meniscus — phase advances every frame.

#### amplitude?

> `readonly` `optional` **amplitude?**: `number`

Peak vertical displacement of the surface, px. Default `3`.

#### periodMs?

> `readonly` `optional` **periodMs?**: `number`

Time for one full phase cycle, ms. Default `1800`.

#### resolution?

> `readonly` `optional` **resolution?**: `number`

Sample points per wavelength. Higher = smoother + more expensive. Default `12`.

#### wavelength?

> `readonly` `optional` **wavelength?**: `number`

Distance between wave crests, px. Default `80`.
