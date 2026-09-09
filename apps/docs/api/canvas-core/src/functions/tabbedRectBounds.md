# Function: tabbedRectBounds()

> **tabbedRectBounds**(`spec`): [`Rect`](../interfaces/Rect.md)

AABB of the folder.

Bodyless (`height <= 0`): the tab *is* the silhouette, so it's also the
footprint — the declared body width describes a rectangle that isn't being
drawn. Everything positioned against the AABB (the label box, decorations,
edge anchors) therefore lands on the tab.

## Parameters

### spec

[`TabbedRectGeometrySpec`](../type-aliases/TabbedRectGeometrySpec.md)

## Returns

[`Rect`](../interfaces/Rect.md)
