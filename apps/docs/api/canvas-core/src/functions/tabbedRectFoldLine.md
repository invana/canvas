# Function: tabbedRectFoldLine()

> **tabbedRectFoldLine**(`spec`, `inset?`): \[[`Point`](../interfaces/Point.md), [`Point`](../interfaces/Point.md)\]

The tab's bottom border — the fold where the tab meets the body — as a
two-point segment, or `undefined` when `tabDivider` is off or the geometry
has collapsed. Spans the tab's **base**, so with a flush tab it starts on the
body's own edge and the two borders meet cleanly.

## Parameters

### spec

[`TabbedRectGeometrySpec`](../type-aliases/TabbedRectGeometrySpec.md)

### inset?

`number` = `0`

## Returns

\[[`Point`](../interfaces/Point.md), [`Point`](../interfaces/Point.md)\]
