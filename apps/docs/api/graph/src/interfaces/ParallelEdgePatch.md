# Interface: ParallelEdgePatch

Patch a distribution policy emits for one edge in the group.

## Properties

### edgeId

> `readonly` **edgeId**: `string`

Edge id this patch applies to.

***

### sourceAnchorOpts?

> `readonly` `optional` **sourceAnchorOpts?**: `Readonly`\<`Record`\<`string`, `unknown`\>\>

New `sourceAnchorOpts`. Merged onto the edge's existing shape.

***

### targetAnchorOpts?

> `readonly` `optional` **targetAnchorOpts?**: `Readonly`\<`Record`\<`string`, `unknown`\>\>

New `targetAnchorOpts`.

***

### waypoints?

> `readonly` `optional` **waypoints?**: readonly `object`[]

New `waypoints`. Pass an empty array to clear.
