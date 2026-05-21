# Interface: ShapeEffectHostInfo

Defined in: [canvas/src/primitives/types.ts:901](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L901)

Information a shape effect receives in `mount` / `update`. No `surface`
field — effects don't draw, they modulate. The renderer applies the
effect's `readTransform` / `readStyle` output onto the host gfx each frame.

## Properties

### bounds

> `readonly` **bounds**: [`Rect`](Rect.md)

Defined in: [canvas/src/primitives/types.ts:905](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L905)

Local-space axis-aligned bounding box of the host shape.

***

### hostId

> `readonly` **hostId**: `string`

Defined in: [canvas/src/primitives/types.ts:902](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L902)

***

### shape

> `readonly` **shape**: [`IShape`](IShape.md)

Defined in: [canvas/src/primitives/types.ts:907](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L907)

The host shape itself — effects may read shape state but never paint.

***

### slot

> `readonly` **slot**: `string`

Defined in: [canvas/src/primitives/types.ts:903](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L903)
