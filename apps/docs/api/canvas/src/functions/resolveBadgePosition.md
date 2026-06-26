# Function: resolveBadgePosition()

> **resolveBadgePosition**(`hostWorldBounds`, `badgeLocalBounds`, `options`): `object`

Defined in: [canvas/src/primitives/badges/placement.ts:117](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/badges/placement.ts#L117)

Resolve the badge spec's `(x, y)` so that the chosen origin point on the
badge AABB lands at the chosen anchor point on the host AABB, plus the
caller's pixel offset.

The badge spec's `(x, y)` represents the badge's *local-origin* in world
space (e.g. circle centre, rect top-left). Local AABB origin is at
`(badgeLocalBounds.x, badgeLocalBounds.y)` — for a circle these are
negative (`-r, -r`); for a rect they are `(0, 0)`. We compute the badge's
`(x, y)` such that the chosen origin point — at
`(specX + originLocal.x, specY + originLocal.y)` in world space — equals
the host anchor + offset.

## Parameters

### hostWorldBounds

`Rect`

### badgeLocalBounds

`Rect`

### options

[`BadgeOptions`](../interfaces/BadgeOptions.md)

## Returns

`object`

### x

> **x**: `number`

### y

> **y**: `number`
