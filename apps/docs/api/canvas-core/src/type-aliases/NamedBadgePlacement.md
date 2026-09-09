# Type Alias: NamedBadgePlacement

> **NamedBadgePlacement** = `"top"` \| `"bottom"` \| `"left"` \| `"right"` \| `"top-left"` \| `"top-right"` \| `"bottom-left"` \| `"bottom-right"`

The eight named anchor points on a host AABB — corners and edge midpoints.
The named-only subset of [BadgePlacement](BadgePlacement.md); used by
[BadgeOptions.origin](../interfaces/BadgeOptions.md#origin) (which never accepts a raw point) and by
internal mirror-math that only makes sense for the named cases.
