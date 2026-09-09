# Type Alias: SelectionFramePlacement

> **SelectionFramePlacement** = `"top"` \| `"right"` \| `"bottom"` \| `"left"` \| `"top-left"` \| `"top-right"` \| `"bottom-left"` \| `"bottom-right"`

One of the eight standard transform-frame anchors: corner (`top-left`,
`top-right`, `bottom-left`, `bottom-right`) or edge-midpoint (`top`,
`right`, `bottom`, `left`).

Re-using `ResizeHandlePlacement`'s vocabulary so any behaviour that
already does direction-aware drag math (corner → diagonal resize,
`top` / `bottom` → vertical, `left` / `right` → horizontal) keeps
working without translation.
