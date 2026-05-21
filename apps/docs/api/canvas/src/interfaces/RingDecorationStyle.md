# Interface: RingDecorationStyle

Defined in: [canvas/src/primitives/decorations/shape/RingDecoration.ts:17](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/RingDecoration.ts#L17)

Static ring that traces the host silhouette at a fixed outward offset.

Geometry: one `paintInto` call with a negative inset, so the ring sits
cleanly *outside* the body — independent from the host's own stroke.
Multiple rings (e.g. inner + outer) compose by attaching multiple Ring
decorations with different `gap` values; this class itself paints one
band per instance.

Works on every shape that implements `paintInto` (everything extending
`ShapeBase`). On shape kinds without `paintInto` (e.g. plain text) the
decoration silently clears — same fallback as `GlowDecoration`.

## Properties

### alpha?

> `readonly` `optional` **alpha?**: `number`

Defined in: [canvas/src/primitives/decorations/shape/RingDecoration.ts:27](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/RingDecoration.ts#L27)

Ring alpha, `[0, 1]`. Default `1`.

***

### color

> `readonly` **color**: `number`

Defined in: [canvas/src/primitives/decorations/shape/RingDecoration.ts:18](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/RingDecoration.ts#L18)

***

### dashArray?

> `readonly` `optional` **dashArray?**: readonly \[`number`, `number`\]

Defined in: [canvas/src/primitives/decorations/shape/RingDecoration.ts:29](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/RingDecoration.ts#L29)

Dashed ring — `[dashLength, gapLength]` in px. Default solid.

***

### gap?

> `readonly` `optional` **gap?**: `number`

Defined in: [canvas/src/primitives/decorations/shape/RingDecoration.ts:25](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/RingDecoration.ts#L25)

Gap between the host silhouette and the ring's inner edge, px.
Default `4`. Zero hugs the body; larger values produce a detached ring.

***

### width?

> `readonly` `optional` **width?**: `number`

Defined in: [canvas/src/primitives/decorations/shape/RingDecoration.ts:20](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/RingDecoration.ts#L20)

Ring stroke thickness, px. Default `2`.
