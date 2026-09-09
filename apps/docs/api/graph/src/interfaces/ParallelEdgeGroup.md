# Interface: ParallelEdgeGroup

A bucket of edges that share endpoints and should be fanned together.

## Properties

### edges

> `readonly` **edges**: readonly [`GraphEdge`](GraphEdge.md)\<`unknown`\>[]

Edges in this group, in store iteration order. Distribution policies
decide which edge gets which rank — the default centres the group so
`edges[i]` receives rank `k = i - (N-1)/2`.

***

### sourceCenter

> `readonly` **sourceCenter**: [`Vec2`](Vec2.md)

Geometric centre of the source node (renderer ref or store position).

***

### sourceId

> `readonly` **sourceId**: `string`

Source node id shared by every edge in this group.

***

### targetCenter

> `readonly` **targetCenter**: [`Vec2`](Vec2.md)

Geometric centre of the target node.

***

### targetId

> `readonly` **targetId**: `string`

Target node id shared by every edge in this group.
