# Function: isPlaceableNode()

> **isPlaceableNode**(`layer`, `node`, `includeHidden?`): `boolean`

Whether `node` should be placed by a layout run.

Two independent reasons to skip a node, both meaning "invisible, so leave its
position frozen":

 - it is explicitly hidden (`node.hidden`) and `includeHidden` is off — the
   rule [OneShotPositionLayout.shouldPlaceNode](../classes/OneShotPositionLayout.md#shouldplacenode) already applies;
 - it sits under a **collapsed** group. This one is invisible to a plain
   `hidden` check because collapse-hiding is derived, never stored — which is
   why every layout that doesn't call this helper silently lays out the
   members of collapsed groups.

`includeHidden` covers both: asking for hidden nodes asks for collapsed
members too, so a debug run can still see everything.

## Parameters

### layer

[`GraphLayer`](../classes/GraphLayer.md)

### node

[`GraphNode`](../interfaces/GraphNode.md)

### includeHidden?

`boolean` = `false`

## Returns

`boolean`
