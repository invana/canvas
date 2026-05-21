# Type Alias: BadgeOrigin

> **BadgeOrigin** = `"top-right"` \| `"top-left"` \| `"bottom-right"` \| `"bottom-left"` \| `"top"` \| `"bottom"` \| `"left"` \| `"right"` \| `"center"`

Defined in: [graph/src/layer/types.ts:428](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L428)

Point on the badge's own AABB that lands at the host anchor.

- The eight cardinal names mirror [BadgePlacement](BadgePlacement.md) (without the
  custom `{x, y}` variant — origin is always a named point on the badge).
- `'center'` centres the badge on the host anchor — yields the classic
  "half-overhanging" notification-bubble look.

When omitted, the projection defaults to the **mirror** of `placement`
(e.g. `placement: 'top-right'` → origin `'bottom-left'`) so the badge
sits fully outside the host edge.
