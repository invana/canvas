# Type Alias: TogglePlacement

> **TogglePlacement** = `"top"` \| `"right"` \| `"bottom"` \| `"left"` \| `"top-left"` \| `"top-right"` \| `"bottom-left"` \| `"bottom-right"` \| `"inside-top"` \| `"inside-right"` \| `"inside-bottom"` \| `"inside-left"`

Defined in: [canvas/src/primitives/decorations/shape/ToggleDecoration.ts:19](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/ToggleDecoration.ts#L19)

Placement of a `ToggleDecoration` relative to the host shape's AABB.

- Cardinal sides (`top` / `right` / `bottom` / `left`) sit centred on the
  midpoint of that side.
- Corners (`top-left` / ... / `bottom-right`) sit on the corner itself.
- `inside-*` variants mirror the cardinal sides but pull inward by
  `radius + 4 px` so the toggle nests inside the silhouette (useful for
  circle groups where an outside toggle would float well past the rim).

The toggle's gfx is positioned by its centre, so it half-overlaps the
silhouette edge in the outside variants — a touch-friendly hit target
that visually reads as "attached to the host".
