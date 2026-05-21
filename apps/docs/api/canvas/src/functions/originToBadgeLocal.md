# Function: originToBadgeLocal()

> **originToBadgeLocal**(`badgeLocalBounds`, `placement`, `origin`): `object`

Defined in: [canvas/src/primitives/badges/placement.ts:66](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/badges/placement.ts#L66)

Returns the point on the badge's local AABB that should land at the host
anchor, given the chosen origin. The default (omitted origin) is the
mirror of `placement` so the badge sits fully outside the host edge.
When `placement` is a raw `{x, y}` point with no inherent mirror, the
default falls back to `'center'`.

## Parameters

### badgeLocalBounds

[`Rect`](../interfaces/Rect.md)

### placement

[`BadgePlacement`](../type-aliases/BadgePlacement.md)

### origin

[`NamedBadgePlacement`](../type-aliases/NamedBadgePlacement.md) \| `"center"`

## Returns

`object`

### x

> **x**: `number`

### y

> **y**: `number`
