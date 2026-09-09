# Function: groupInsets()

> **groupInsets**(`layer`, `node`): [`GroupInsets`](../interfaces/GroupInsets.md)

The insets between a group's member bounding box and its frame, read from the
group's resolved [GroupOptions](../interfaces/GroupOptions.md).

`headerHeight` is added to the **top** inset: the band is reserved above the
members for the group's title (and for a `tabbed-rect` frame it's the tab
itself), so laying members out into it would put them under the title.
Matching the layout to `GraphLayer`'s own auto-fit projection here is what
stops the frame growing again the moment it's drawn.

## Parameters

### layer

[`GraphLayer`](../classes/GraphLayer.md)

### node

[`GraphNode`](../interfaces/GraphNode.md)

## Returns

[`GroupInsets`](../interfaces/GroupInsets.md)
