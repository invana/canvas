# Interface: BubbleSet

Defined in: [graph-layer-bubble-sets/src/types.ts:50](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layer-bubble-sets/src/types.ts#L50)

A named, declarative grouping of nodes (and optionally edges).

## Properties

### edges?

> `optional` **edges?**: readonly `string`[]

Defined in: [graph-layer-bubble-sets/src/types.ts:62](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layer-bubble-sets/src/types.ts#L62)

Optional ids of GraphEdges to enclose. The layer feeds each
edge as a straight `source-center → target-center` segment to
BubbleSets' router; the algorithm morphs the contour to wrap them.
Edges whose endpoints aren't both members are still accepted —
useful for "include the bridging edge in this set's blob".

***

### id

> **id**: `string`

Defined in: [graph-layer-bubble-sets/src/types.ts:52](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layer-bubble-sets/src/types.ts#L52)

Stable identity. Used as the set key for updateSet/removeSet.

***

### label?

> `optional` **label?**: [`BubbleSetLabel`](BubbleSetLabel.md)

Defined in: [graph-layer-bubble-sets/src/types.ts:66](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layer-bubble-sets/src/types.ts#L66)

Optional label drawn over the contour.

***

### members

> **members**: readonly `string`[]

Defined in: [graph-layer-bubble-sets/src/types.ts:54](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layer-bubble-sets/src/types.ts#L54)

Ids of GraphNodes to enclose. Required; an empty array skips paint.

***

### style?

> `optional` **style?**: [`BubbleSetStyle`](BubbleSetStyle.md)

Defined in: [graph-layer-bubble-sets/src/types.ts:64](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layer-bubble-sets/src/types.ts#L64)

Per-set visual style; merged into [BUBBLE\_SET\_STYLE\_DEFAULTS](../variables/BUBBLE_SET_STYLE_DEFAULTS.md).
