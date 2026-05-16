# Interface: ShapeEffectHostInfo

Defined in: [canvas/src/primitives/types.ts:809](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/types.ts#L809)

Information a shape effect receives in `mount` / `update`. No `surface`
field — effects don't draw, they modulate. The renderer applies the
effect's `readTransform` / `readStyle` output onto the host gfx each frame.

## Properties

### bounds

> `readonly` **bounds**: [`Rect`](Rect.md)

Defined in: [canvas/src/primitives/types.ts:813](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/types.ts#L813)

Local-space axis-aligned bounding box of the host shape.

***

### hostId

> `readonly` **hostId**: `string`

Defined in: [canvas/src/primitives/types.ts:810](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/types.ts#L810)

***

### shape

> `readonly` **shape**: [`IShape`](IShape.md)

Defined in: [canvas/src/primitives/types.ts:815](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/types.ts#L815)

The host shape itself — effects may read shape state but never paint.

***

### slot

> `readonly` **slot**: `string`

Defined in: [canvas/src/primitives/types.ts:811](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/types.ts#L811)
