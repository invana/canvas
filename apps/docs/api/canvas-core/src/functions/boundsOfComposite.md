# Function: boundsOfComposite()

> **boundsOfComposite**(`spec`): [`Rect`](../interfaces/Rect.md)

The composite's silhouette fills its declared box (like a rect), whatever
root shape it borrows — the root is centred and sized to that box. Layouts
(ELK et al.) read node dimensions through this; without it every card falls
back to the layout's default size and they overlap.

## Parameters

### spec

`Pick`\<[`CompositeSpec`](../interfaces/CompositeSpec.md), `"width"` \| `"height"`\>

## Returns

[`Rect`](../interfaces/Rect.md)
