# Type Alias: ResizeHandlePlacement

> **ResizeHandlePlacement** = `"top"` \| `"right"` \| `"bottom"` \| `"left"` \| `"top-left"` \| `"top-right"` \| `"bottom-left"` \| `"bottom-right"`

Defined in: [canvas/src/primitives/decorations/shape/ResizeHandleDecoration.ts:12](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/ResizeHandleDecoration.ts#L12)

Where on the host AABB a `ResizeHandleDecoration` sits. The eight cardinal
+ corner positions cover every rectangular drag axis (horizontal / vertical
sides, diagonal corners). For radially-symmetric hosts (circle groups) use
any side — domain behaviours typically map all four sides to the same
radius-scaling drag.
