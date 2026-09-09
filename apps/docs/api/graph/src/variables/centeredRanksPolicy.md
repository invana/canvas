# Variable: centeredRanksPolicy

> `const` **centeredRanksPolicy**: [`ParallelEdgeDistribute`](../type-aliases/ParallelEdgeDistribute.md)

Default distribution policy — centres `N` ranks around zero, then for each
edge writes one midpoint waypoint plus (optionally) port-anchor offsets.

Exported so callers can compose it (e.g. wrap with a filter) or call
directly when implementing a custom variant that wants to reuse the
default geometry for some edges.
