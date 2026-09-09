# Function: tabbedRectTabWidth()

> **tabbedRectTabWidth**(`spec`): `number`

Resolved tab width: the declared [TabbedRectSpec.tabWidth](../interfaces/TabbedRectSpec.md#tabwidth), falling
back to the body's width when it's left unset (a full-width tab).

Clamped to the body while there is one — a tab can't outgrow the rectangle
it sits on. A bodyless folder's tab *is* the silhouette, so it sizes freely.

## Parameters

### spec

[`TabbedRectGeometrySpec`](../type-aliases/TabbedRectGeometrySpec.md)

## Returns

`number`
