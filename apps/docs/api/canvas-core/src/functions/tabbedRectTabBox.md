# Function: tabbedRectTabBox()

> **tabbedRectTabBox**(`spec`, `inset?`): [`Rect`](../interfaces/Rect.md)

The tab's **upright** box — its full-height portion, with the slant excluded
on whichever side is angled. This is where the folder's own label belongs:
the body interior belongs to whatever the frame contains, so a title centred
against this box stays put no matter how large the body grows.

## Parameters

### spec

[`TabbedRectGeometrySpec`](../type-aliases/TabbedRectGeometrySpec.md)

### inset?

`number` = `0`

## Returns

[`Rect`](../interfaces/Rect.md)
