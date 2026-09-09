# Function: collectPlaceableNodes()

> **collectPlaceableNodes**(`layer`, `includeHidden?`): `Set`\<`string`\>

The set of node ids a layout run places, per [isPlaceableNode](isPlaceableNode.md).
Computed once per run and threaded into the other helpers, so the
`collapsedAncestor` chain-walk happens once per node rather than per query.

## Parameters

### layer

[`GraphLayer`](../classes/GraphLayer.md)

### includeHidden?

`boolean` = `false`

## Returns

`Set`\<`string`\>
