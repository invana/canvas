# Type Alias: SelectionFramePlacement

> **SelectionFramePlacement** = `"top"` \| `"right"` \| `"bottom"` \| `"left"` \| `"top-left"` \| `"top-right"` \| `"bottom-left"` \| `"bottom-right"`

Defined in: [canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts:16](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts#L16)

One of the eight standard transform-frame anchors: corner (`top-left`,
`top-right`, `bottom-left`, `bottom-right`) or edge-midpoint (`top`,
`right`, `bottom`, `left`).

Re-using `ResizeHandlePlacement`'s vocabulary so any behaviour that
already does direction-aware drag math (corner → diagonal resize,
`top` / `bottom` → vertical, `left` / `right` → horizontal) keeps
working without translation.
