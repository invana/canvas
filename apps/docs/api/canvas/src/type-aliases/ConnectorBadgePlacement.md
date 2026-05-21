# Type Alias: ConnectorBadgePlacement

> **ConnectorBadgePlacement** = `"start"` \| `"middle"` \| `"end"` \| `number`

Defined in: [canvas/src/primitives/badges/types.ts:73](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/badges/types.ts#L73)

Anchor point along a connector host's routed path.

- `'start'` / `'end'` — anchored *near* the source / target endpoint with
  automatic clearance: the badge is shifted tangentially by its own
  half-extent so it kisses the endpoint shape's silhouette from outside
  rather than half-overlapping it. Use these when you want a badge
  visually associated with an endpoint (count chip, status icon).
- `'middle'` — exact arc-length midpoint (`t = 0.5`).
- A `number` in `[0, 1]` — raw arc-length `t`. **No clearance is
  applied** — `placement: 1` literally anchors at the silhouette point,
  the "raw" counterpart to `'end'`. Values outside `[0, 1]` are clamped.

`'middle'` (not `'center'`) avoids the term clash with
[BadgeOptions.origin](../interfaces/BadgeOptions.md#origin) where `'center'` means "centre the badge on
its own AABB". For loop edges (`pathType: 'loop-*'`), `'middle'`
naturally lands on the loop apex because the path passes through it at
`t ≈ 0.5`.
