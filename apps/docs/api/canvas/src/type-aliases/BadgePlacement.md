# Type Alias: BadgePlacement

> **BadgePlacement** = `"top"` \| `"bottom"` \| `"left"` \| `"right"` \| `"top-left"` \| `"top-right"` \| `"bottom-left"` \| `"bottom-right"`

Defined in: [packages/canvas/src/primitives/badges/types.ts:22](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/badges/types.ts#L22)

Eight anchor points around a host shape's axis-aligned bounding box.
Edge anchors (`top` / `bottom` / `left` / `right`) sit at the midpoint of
that edge; corner anchors sit at the corner.
