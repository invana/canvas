# Interface: ParallelEdgePatch

Defined in: [graph/src/behaviours/ParallelEdgeBehaviour.ts:93](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ParallelEdgeBehaviour.ts#L93)

Patch a distribution policy emits for one edge in the group.

## Properties

### edgeId

> `readonly` **edgeId**: `string`

Defined in: [graph/src/behaviours/ParallelEdgeBehaviour.ts:95](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ParallelEdgeBehaviour.ts#L95)

Edge id this patch applies to.

***

### sourceAnchorOpts?

> `readonly` `optional` **sourceAnchorOpts?**: `Readonly`\<`Record`\<`string`, `unknown`\>\>

Defined in: [graph/src/behaviours/ParallelEdgeBehaviour.ts:97](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ParallelEdgeBehaviour.ts#L97)

New `sourceAnchorOpts`. Merged onto the edge's existing shape.

***

### targetAnchorOpts?

> `readonly` `optional` **targetAnchorOpts?**: `Readonly`\<`Record`\<`string`, `unknown`\>\>

Defined in: [graph/src/behaviours/ParallelEdgeBehaviour.ts:99](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ParallelEdgeBehaviour.ts#L99)

New `targetAnchorOpts`.

***

### waypoints?

> `readonly` `optional` **waypoints?**: readonly `object`[]

Defined in: [graph/src/behaviours/ParallelEdgeBehaviour.ts:101](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ParallelEdgeBehaviour.ts#L101)

New `waypoints`. Pass an empty array to clear.
