# Function: buildGroupForest()

> **buildGroupForest**(`layer`, `placeable`): [`GroupForestNode`](../interfaces/GroupForestNode.md)[]

Build the forest of placeable nodes, nesting members **only** under parents
that are group nodes.

Three rules, each of which a naive `childrenOf` recursion gets wrong:

 - **A non-group parent doesn't contain anything.** Its children are emitted
   as roots (flat siblings), so an ordinary `parentId` tree lays out exactly
   as it does today rather than being packed into boxes.
 - **A collapsed group is a leaf.** Its members are already excluded from
   `placeable`; the group itself is placed as the ordinary node the renderer
   draws in their stead.
 - **Cycles degrade to flat.** A `parentId` cycle (or a self-parent) would
   otherwise recurse forever; a visited set drops the repeat instead.

## Parameters

### layer

[`GraphLayer`](../classes/GraphLayer.md)

### placeable

`ReadonlySet`\<`string`\>

## Returns

[`GroupForestNode`](../interfaces/GroupForestNode.md)[]
