# Function: originToBadgeLocal()

> **originToBadgeLocal**(`badgeLocalBounds`, `placement`, `origin`): `object`

Defined in: [packages/canvas/src/primitives/badges/placement.ts:47](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/badges/placement.ts#L47)

Returns the point on the badge's local AABB that should land at the host
anchor, given the chosen origin. The default (omitted origin) is the
mirror of `placement` so the badge sits fully outside the host edge.

## Parameters

### badgeLocalBounds

[`Rect`](../interfaces/Rect.md)

### placement

[`BadgePlacement`](../type-aliases/BadgePlacement.md)

### origin

[`BadgePlacement`](../type-aliases/BadgePlacement.md) \| `"center"`

## Returns

`object`

### x

> **x**: `number`

### y

> **y**: `number`
