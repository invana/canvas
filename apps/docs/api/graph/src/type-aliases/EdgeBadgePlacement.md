# Type Alias: EdgeBadgePlacement

> **EdgeBadgePlacement** = `"start"` \| `"middle"` \| `"end"` \| `number`

Defined in: [graph/src/layer/types.ts:572](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L572)

Anchor point along an edge's routed path.

- `'start'` / `'end'` — anchored *near* the source / target endpoint with
  automatic clearance: the badge is shifted tangentially by its own
  half-extent so it kisses the endpoint node's silhouette from outside
  rather than half-overlapping it. The natural choice for endpoint
  chips, status icons, etc.
- `'middle'` — exact arc-length midpoint (`t = 0.5`).
- A `number` in `[0, 1]` — raw arc-length `t`, no clearance applied.
  Use `placement: 1` when you explicitly want a badge centred on the
  silhouette point. Values outside `[0, 1]` are clamped.

`'middle'` (not `'center'`) avoids term-clashing with `BadgeOrigin`
where `'center'` means "centre the badge on its own AABB".
