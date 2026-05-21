# Type Alias: ParallelEdgeDistribute

> **ParallelEdgeDistribute** = (`group`, `ctx`) => `ReadonlyArray`\<[`ParallelEdgePatch`](../interfaces/ParallelEdgePatch.md)\>

Defined in: [graph/src/behaviours/ParallelEdgeBehaviour.ts:119](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/ParallelEdgeBehaviour.ts#L119)

Pluggable distribution policy. Receives a group of co-located edges plus
the behaviour's settings and returns one patch per edge it wants to update.

The default policy [centeredRanksPolicy](../variables/centeredRanksPolicy.md) fans edges symmetrically
around rank zero — pass a custom function to implement one-sided fanout,
data-driven offsets, weighted spacing, etc.

## Parameters

### group

[`ParallelEdgeGroup`](../interfaces/ParallelEdgeGroup.md)

### ctx

[`ParallelEdgeDistributeContext`](../interfaces/ParallelEdgeDistributeContext.md)

## Returns

`ReadonlyArray`\<[`ParallelEdgePatch`](../interfaces/ParallelEdgePatch.md)\>
