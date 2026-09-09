# Function: resolveNodeSize()

> **resolveNodeSize**(`layer`, `node`, `fallback?`): [`LayoutNodeSize`](../interfaces/LayoutNodeSize.md)

Resolve a node's layout footprint: the cached render size when the node has
been drawn, else the shape registry's computed bounds, else a fallback.

Prefers `node.boundingBox` (written by the layer after each draw) so a
composite card isn't re-composed part-by-part once per layout run.

## Parameters

### layer

[`GraphLayer`](../classes/GraphLayer.md)

### node

[`GraphNode`](../interfaces/GraphNode.md)

### fallback?

[`LayoutNodeSize`](../interfaces/LayoutNodeSize.md) = `FALLBACK_SIZE`

## Returns

[`LayoutNodeSize`](../interfaces/LayoutNodeSize.md)
