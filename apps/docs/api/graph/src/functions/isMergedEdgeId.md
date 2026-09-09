# Function: isMergedEdgeId()

> **isMergedEdgeId**(`id`): `boolean`

Whether an edge id produced by [collectLayoutEdges](collectLayoutEdges.md) still refers to a
real stored edge. Geometry written back per-edge (ELK's waypoints) must skip
merged ids — they stand for several edges at once and address none of them.

## Parameters

### id

`string`

## Returns

`boolean`
