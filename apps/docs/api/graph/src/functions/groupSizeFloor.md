# Function: groupSizeFloor()

> **groupSizeFloor**(`layer`, `node`): [`LayoutNodeSize`](../interfaces/LayoutNodeSize.md)

A group's declared size floor — the `width`/`height` (or `radius`) the author
set on the frame, which the layout must not shrink below.

Only meaningful for `autoFit: false` groups. Under `autoFit` the stored size
is *last frame's* computed fit, so honouring it as a floor would ratchet the
frame permanently larger: it could grow when members spread out but never
shrink back when they contract.

## Parameters

### layer

[`GraphLayer`](../classes/GraphLayer.md)

### node

[`GraphNode`](../interfaces/GraphNode.md)

## Returns

[`LayoutNodeSize`](../interfaces/LayoutNodeSize.md)
