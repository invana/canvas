# Type Alias: NamedBadgePlacement

> **NamedBadgePlacement** = `"top"` \| `"bottom"` \| `"left"` \| `"right"` \| `"top-left"` \| `"top-right"` \| `"bottom-left"` \| `"bottom-right"`

Defined in: [canvas/src/primitives/badges/types.ts:44](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/badges/types.ts#L44)

The eight named anchor points on a host AABB — corners and edge midpoints.
The named-only subset of [BadgePlacement](BadgePlacement.md); used by
[BadgeOptions.origin](../interfaces/BadgeOptions.md#origin) (which never accepts a raw point) and by
internal mirror-math that only makes sense for the named cases.
