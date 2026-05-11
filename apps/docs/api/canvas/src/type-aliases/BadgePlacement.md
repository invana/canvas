# Type Alias: BadgePlacement

> **BadgePlacement** = `"top"` \| `"bottom"` \| `"left"` \| `"right"` \| `"top-left"` \| `"top-right"` \| `"bottom-left"` \| `"bottom-right"`

Defined in: [packages/canvas/src/primitives/badges/types.ts:22](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/badges/types.ts#L22)

Eight anchor points around a host shape's axis-aligned bounding box.
Edge anchors (`top` / `bottom` / `left` / `right`) sit at the midpoint of
that edge; corner anchors sit at the corner.
