# Type Alias: ResizeHandlePlacement

> **ResizeHandlePlacement** = `"top"` \| `"right"` \| `"bottom"` \| `"left"` \| `"top-left"` \| `"top-right"` \| `"bottom-left"` \| `"bottom-right"`

Where on the host AABB a `ResizeHandleDecoration` sits. The eight cardinal
+ corner positions cover every rectangular drag axis (horizontal / vertical
sides, diagonal corners). For radially-symmetric hosts (circle groups) use
any side — domain behaviours typically map all four sides to the same
radius-scaling drag.
