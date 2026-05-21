# Type Alias: BadgePlacement

> **BadgePlacement** = `"top-right"` \| `"top-left"` \| `"bottom-right"` \| `"bottom-left"` \| `"top"` \| `"bottom"` \| `"left"` \| `"right"` \| \{ `x`: `number`; `y`: `number`; \}

Defined in: [graph/src/layer/types.ts:405](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L405)

Anchor point on the host node where a badge attaches. The eight cardinal
names address the midpoints / corners of the host's axis-aligned bounding
box; the `{ x, y }` variant pins to an explicit world point and is rarely
needed (use [NodeBadge.offsetX](../interfaces/NodeBadge.md#offsetx) / `offsetY` to nudge an enum anchor
before reaching for raw coordinates).
