# Type Alias: BadgePlacement

> **BadgePlacement** = `"top-right"` \| `"top-left"` \| `"bottom-right"` \| `"bottom-left"` \| `"top"` \| `"bottom"` \| `"left"` \| `"right"` \| \{ `x`: `number`; `y`: `number`; \}

Defined in: [graph/src/layer/types.ts:435](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L435)

Anchor point on the host node where a badge attaches. The eight cardinal
names address the midpoints / corners of the host's axis-aligned bounding
box; the `{ x, y }` variant pins to an explicit world point and is rarely
needed (use [NodeBadge.offsetX](../interfaces/NodeBadge.md#offsetx) / `offsetY` to nudge an enum anchor
before reaching for raw coordinates).
