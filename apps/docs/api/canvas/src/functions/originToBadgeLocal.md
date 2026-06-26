# Function: originToBadgeLocal()

> **originToBadgeLocal**(`badgeLocalBounds`, `placement`, `origin`): `object`

Defined in: [canvas/src/primitives/badges/placement.ts:66](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/badges/placement.ts#L66)

Returns the point on the badge's local AABB that should land at the host
anchor, given the chosen origin. The default (omitted origin) is the
mirror of `placement` so the badge sits fully outside the host edge.
When `placement` is a raw `{x, y}` point with no inherent mirror, the
default falls back to `'center'`.

## Parameters

### badgeLocalBounds

`Rect`

### placement

[`BadgePlacement`](../type-aliases/BadgePlacement.md)

### origin

`"center"` \| [`NamedBadgePlacement`](../type-aliases/NamedBadgePlacement.md)

## Returns

`object`

### x

> **x**: `number`

### y

> **y**: `number`
