# Interface: BubbleSet

A named, declarative grouping of nodes (and optionally edges).

## Properties

### edges?

> `optional` **edges?**: readonly `string`[]

Optional ids of GraphEdges to enclose. The layer feeds each
edge as a straight `source-center → target-center` segment to
BubbleSets' router; the algorithm morphs the contour to wrap them.
Edges whose endpoints aren't both members are still accepted —
useful for "include the bridging edge in this set's blob".

***

### id

> **id**: `string`

Stable identity. Used as the set key for updateSet/removeSet.

***

### label?

> `optional` **label?**: [`BubbleSetLabel`](BubbleSetLabel.md)

Optional label drawn over the contour.

***

### members

> **members**: readonly `string`[]

Ids of GraphNodes to enclose. Required; an empty array skips paint.

***

### style?

> `optional` **style?**: [`BubbleSetStyle`](BubbleSetStyle.md)

Per-set visual style; merged into [BUBBLE\_SET\_STYLE\_DEFAULTS](../variables/BUBBLE_SET_STYLE_DEFAULTS.md).
