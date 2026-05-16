# Type Alias: BadgePlacement

> **BadgePlacement** = `"top"` \| `"bottom"` \| `"left"` \| `"right"` \| `"top-left"` \| `"top-right"` \| `"bottom-left"` \| `"bottom-right"`

Defined in: [canvas/src/primitives/badges/types.ts:22](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/badges/types.ts#L22)

Eight anchor points around a host shape's axis-aligned bounding box.
Edge anchors (`top` / `bottom` / `left` / `right`) sit at the midpoint of
that edge; corner anchors sit at the corner.
