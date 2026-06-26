# Variable: centeredRanksPolicy

> `const` **centeredRanksPolicy**: [`ParallelEdgeDistribute`](../type-aliases/ParallelEdgeDistribute.md)

Defined in: [graph/src/behaviours/ParallelEdgeBehaviour.ts:209](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ParallelEdgeBehaviour.ts#L209)

Default distribution policy — centres `N` ranks around zero, then for each
edge writes one midpoint waypoint plus (optionally) port-anchor offsets.

Exported so callers can compose it (e.g. wrap with a filter) or call
directly when implementing a custom variant that wants to reuse the
default geometry for some edges.
