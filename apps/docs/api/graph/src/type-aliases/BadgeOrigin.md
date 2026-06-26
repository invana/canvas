# Type Alias: BadgeOrigin

> **BadgeOrigin** = `"top-right"` \| `"top-left"` \| `"bottom-right"` \| `"bottom-left"` \| `"top"` \| `"bottom"` \| `"left"` \| `"right"` \| `"center"`

Defined in: [graph/src/layer/types.ts:458](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L458)

Point on the badge's own AABB that lands at the host anchor.

- The eight cardinal names mirror [BadgePlacement](BadgePlacement.md) (without the
  custom `{x, y}` variant — origin is always a named point on the badge).
- `'center'` centres the badge on the host anchor — yields the classic
  "half-overhanging" notification-bubble look.

When omitted, the projection defaults to the **mirror** of `placement`
(e.g. `placement: 'top-right'` → origin `'bottom-left'`) so the badge
sits fully outside the host edge.
