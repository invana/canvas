# Type Alias: ShapeLabelPlacement

> **ShapeLabelPlacement** = `"center"` \| `"top"` \| `"top-right"` \| `"right"` \| `"bottom-right"` \| `"bottom"` \| `"bottom-left"` \| `"left"` \| `"top-left"` \| `"inside-top"` \| `"inside-top-right"` \| `"inside-right"` \| `"inside-bottom-right"` \| `"inside-bottom"` \| `"inside-bottom-left"` \| `"inside-left"` \| `"inside-top-left"` \| `"inside-center"`

Defined in: [canvas/src/primitives/types.ts:1158](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/types.ts#L1158)

Placement options for a shape-anchored label.

Two semantic groups distinguished by the `inside-` prefix:

- **Anchor-only placements** — `'center'` plus the 8 outside sides /
  corners (`'top'`, `'top-right'`, ..., `'top-left'`). The label is
  positioned at the anchor and sized freely per `LabelWrap`; it may
  extend past the host shape's bounds.
- **Inside placements** (`'inside-*'`) — carry a *containment contract*:
  the label must stay inside the host shape's inner box. The decoration
  runs a shrink → truncate → hide fit cascade against the per-placement
  inner box to enforce this. Use these for sunburst wedges, treemap
  cells, pack circles — anywhere the label must not overflow.

`'center'` and `'inside-center'` share the geometric anchor (shape
centre) but differ in containment: `'center'` may overflow, `'inside-center'`
may not. They are distinct values, not aliases.
