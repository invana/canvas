# Interface: ShapeEffectHostInfo

Defined in: [packages/canvas/src/primitives/types.ts:703](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/types.ts#L703)

Information a shape effect receives in `mount` / `update`. No `surface`
field — effects don't draw, they modulate. The renderer applies the
effect's `readTransform` / `readStyle` output onto the host gfx each frame.

## Properties

### bounds

> `readonly` **bounds**: [`Rect`](Rect.md)

Defined in: [packages/canvas/src/primitives/types.ts:707](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/types.ts#L707)

Local-space axis-aligned bounding box of the host shape.

***

### hostId

> `readonly` **hostId**: `string`

Defined in: [packages/canvas/src/primitives/types.ts:704](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/types.ts#L704)

***

### shape

> `readonly` **shape**: [`IShape`](IShape.md)

Defined in: [packages/canvas/src/primitives/types.ts:709](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/types.ts#L709)

The host shape itself — effects may read shape state but never paint.

***

### slot

> `readonly` **slot**: `string`

Defined in: [packages/canvas/src/primitives/types.ts:705](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/types.ts#L705)
