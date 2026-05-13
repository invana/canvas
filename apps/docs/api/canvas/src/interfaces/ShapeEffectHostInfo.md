# Interface: ShapeEffectHostInfo

Defined in: [packages/canvas/src/primitives/types.ts:804](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L804)

Information a shape effect receives in `mount` / `update`. No `surface`
field — effects don't draw, they modulate. The renderer applies the
effect's `readTransform` / `readStyle` output onto the host gfx each frame.

## Properties

### bounds

> `readonly` **bounds**: [`Rect`](Rect.md)

Defined in: [packages/canvas/src/primitives/types.ts:808](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L808)

Local-space axis-aligned bounding box of the host shape.

***

### hostId

> `readonly` **hostId**: `string`

Defined in: [packages/canvas/src/primitives/types.ts:805](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L805)

***

### shape

> `readonly` **shape**: [`IShape`](IShape.md)

Defined in: [packages/canvas/src/primitives/types.ts:810](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L810)

The host shape itself — effects may read shape state but never paint.

***

### slot

> `readonly` **slot**: `string`

Defined in: [packages/canvas/src/primitives/types.ts:806](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L806)
