# Type Alias: BadgePlacement

> **BadgePlacement** = `"top-right"` \| `"top-left"` \| `"bottom-right"` \| `"bottom-left"` \| `"top"` \| `"bottom"` \| `"left"` \| `"right"` \| \{ `x`: `number`; `y`: `number`; \}

Anchor point on the host node where a badge attaches. The eight cardinal
names address the midpoints / corners of the host's axis-aligned bounding
box; the `{ x, y }` variant pins to an explicit world point and is rarely
needed (use [NodeBadge.offsetX](../interfaces/NodeBadge.md#offsetx) / `offsetY` to nudge an enum anchor
before reaching for raw coordinates).
