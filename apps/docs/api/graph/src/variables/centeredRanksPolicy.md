# Variable: centeredRanksPolicy

> `const` **centeredRanksPolicy**: [`ParallelEdgeDistribute`](../type-aliases/ParallelEdgeDistribute.md)

Defined in: [graph/src/behaviours/ParallelEdgeBehaviour.ts:209](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/ParallelEdgeBehaviour.ts#L209)

Default distribution policy — centres `N` ranks around zero, then for each
edge writes one midpoint waypoint plus (optionally) port-anchor offsets.

Exported so callers can compose it (e.g. wrap with a filter) or call
directly when implementing a custom variant that wants to reuse the
default geometry for some edges.
