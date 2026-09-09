# Type Alias: ParallelEdgeDistribute

> **ParallelEdgeDistribute** = (`group`, `ctx`) => `ReadonlyArray`\<[`ParallelEdgePatch`](../interfaces/ParallelEdgePatch.md)\>

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
