# Type Alias: BadgePlacement

> **BadgePlacement** = [`NamedBadgePlacement`](NamedBadgePlacement.md) \| \{ `x`: `number`; `y`: `number`; \}

Defined in: [canvas/src/primitives/badges/types.ts:36](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/badges/types.ts#L36)

Anchor point on a host shape's axis-aligned bounding box.

- The eight named values address the corners (`top-left`, …,
  `bottom-right`) and edge midpoints (`top` / `bottom` / `left` /
  `right`).
- The `{ x, y }` variant is a **raw world-space point** that bypasses the
  host AABB entirely. Use it when the badge needs to anchor at a position
  that has no relation to the host's bounds (e.g. an interaction-driven
  custom anchor); the badge re-anchors against this point the same way
  named placements re-anchor against the host bounds.
