# Interface: BadgeOptions

Defined in: [packages/canvas/src/primitives/badges/types.ts:52](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/badges/types.ts#L52)

Options for `PrimitivesRenderer.setBadge`. The `shape` field carries the
full shape spec (any kind + fill + stroke + kind-specific fields);
placement-only concerns (where the badge sits, what part of it lands at
the host anchor, any nested decorations) are the four extra fields.

## Properties

### decorations?

> `readonly` `optional` **decorations?**: `Readonly`\<`Record`\<`string`, [`DecorationSpec`](DecorationSpec.md)\>\>

Defined in: [packages/canvas/src/primitives/badges/types.ts:80](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/badges/types.ts#L80)

Decorations applied to the badge shape, keyed by slot. Internally each
entry becomes a `setDecoration(badgeId, slot, spec)` call, so any
registered decoration kind (glow, ring, marching-ants, …) works.

***

### offsetX?

> `readonly` `optional` **offsetX?**: `number`

Defined in: [packages/canvas/src/primitives/badges/types.ts:60](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/badges/types.ts#L60)

Pixel offset applied after origin resolution. Default `0` for both.

***

### offsetY?

> `readonly` `optional` **offsetY?**: `number`

Defined in: [packages/canvas/src/primitives/badges/types.ts:61](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/badges/types.ts#L61)

***

### origin?

> `readonly` `optional` **origin?**: [`BadgePlacement`](../type-aliases/BadgePlacement.md) \| `"center"`

Defined in: [packages/canvas/src/primitives/badges/types.ts:73](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/badges/types.ts#L73)

Which point of the badge's own AABB lands at the host anchor.

- **`undefined`** (default): mirror of `placement`. The badge sits fully
  outside the host edge — e.g. `placement: 'top-right'` puts the badge's
  bottom-left corner at the host's top-right corner.
- **`'center'`**: the badge centres on the anchor and half-overhangs
  the host edge (the gray "A" pattern in the reference design).
- **An explicit `BadgePlacement`**: any of the eight points on the badge.

***

### placement

> `readonly` **placement**: [`BadgePlacement`](../type-aliases/BadgePlacement.md)

Defined in: [packages/canvas/src/primitives/badges/types.ts:57](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/badges/types.ts#L57)

Anchor point on the host AABB.

***

### shape

> `readonly` **shape**: `BadgeShapeSpec`

Defined in: [packages/canvas/src/primitives/badges/types.ts:54](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/badges/types.ts#L54)

The badge plate as a shape spec, sans `x` / `y` (placement provides position).
