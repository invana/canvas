# Function: originToBadgeLocal()

> **originToBadgeLocal**(`badgeLocalBounds`, `placement`, `origin`): `object`

Defined in: [canvas/src/primitives/badges/placement.ts:47](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/badges/placement.ts#L47)

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
