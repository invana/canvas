# Type Alias: NamedBadgePlacement

> **NamedBadgePlacement** = `"top"` \| `"bottom"` \| `"left"` \| `"right"` \| `"top-left"` \| `"top-right"` \| `"bottom-left"` \| `"bottom-right"`

Defined in: [canvas/src/primitives/badges/types.ts:44](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/badges/types.ts#L44)

The eight named anchor points on a host AABB — corners and edge midpoints.
The named-only subset of [BadgePlacement](BadgePlacement.md); used by
[BadgeOptions.origin](../interfaces/BadgeOptions.md#origin) (which never accepts a raw point) and by
internal mirror-math that only makes sense for the named cases.
