# Interface: ParallelEdgeGroup

Defined in: [graph/src/behaviours/ParallelEdgeBehaviour.ts:75](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/ParallelEdgeBehaviour.ts#L75)

A bucket of edges that share endpoints and should be fanned together.

## Properties

### edges

> `readonly` **edges**: readonly [`GraphEdge`](GraphEdge.md)\<`unknown`\>[]

Defined in: [graph/src/behaviours/ParallelEdgeBehaviour.ts:89](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/ParallelEdgeBehaviour.ts#L89)

Edges in this group, in store iteration order. Distribution policies
decide which edge gets which rank — the default centres the group so
`edges[i]` receives rank `k = i - (N-1)/2`.

***

### sourceCenter

> `readonly` **sourceCenter**: [`Vec2`](Vec2.md)

Defined in: [graph/src/behaviours/ParallelEdgeBehaviour.ts:81](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/ParallelEdgeBehaviour.ts#L81)

Geometric centre of the source node (renderer ref or store position).

***

### sourceId

> `readonly` **sourceId**: `string`

Defined in: [graph/src/behaviours/ParallelEdgeBehaviour.ts:77](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/ParallelEdgeBehaviour.ts#L77)

Source node id shared by every edge in this group.

***

### targetCenter

> `readonly` **targetCenter**: [`Vec2`](Vec2.md)

Defined in: [graph/src/behaviours/ParallelEdgeBehaviour.ts:83](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/ParallelEdgeBehaviour.ts#L83)

Geometric centre of the target node.

***

### targetId

> `readonly` **targetId**: `string`

Defined in: [graph/src/behaviours/ParallelEdgeBehaviour.ts:79](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/ParallelEdgeBehaviour.ts#L79)

Target node id shared by every edge in this group.
