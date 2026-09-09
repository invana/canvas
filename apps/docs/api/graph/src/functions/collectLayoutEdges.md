# Function: collectLayoutEdges()

> **collectLayoutEdges**(`layer`, `placeable`): [`LayoutEdge`](../interfaces/LayoutEdge.md)[]

Snapshot the store's edges as layout edges: endpoints resolved through
[effectiveLayoutEndpoint](effectiveLayoutEndpoint.md), self-loops dropped, endpoints outside
`placeable` dropped, and parallel results **deduplicated**.

Dedup matters for two different reasons. ELK rejects duplicate edge ids
outright, and force layouts double-count parallel links — so a collapsed
group holding twenty edges to the same neighbour would be yanked toward it
twenty times as hard as the picture justifies.

## Parameters

### layer

[`GraphLayer`](../classes/GraphLayer.md)

### placeable

`ReadonlySet`\<`string`\>

## Returns

[`LayoutEdge`](../interfaces/LayoutEdge.md)[]
