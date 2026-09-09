# Function: originToBadgeLocal()

> **originToBadgeLocal**(`badgeLocalBounds`, `placement`, `origin`): `object`

Returns the point on the badge's local AABB that should land at the host
anchor, given the chosen origin. The default (omitted origin) is the
mirror of `placement` so the badge sits fully outside the host edge.
When `placement` is a raw `{x, y}` point with no inherent mirror, the
default falls back to `'center'`.

## Parameters

### badgeLocalBounds

[`Rect`](../../../renderer-pixijs/src/interfaces/Rect.md)

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
