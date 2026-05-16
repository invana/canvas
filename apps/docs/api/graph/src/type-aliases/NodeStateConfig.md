# Type Alias: NodeStateConfig

> **NodeStateConfig** = [`ResolvableNodeRenderHints`](ResolvableNodeRenderHints.md)

Defined in: [graph/src/layer/types.ts:257](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph/src/layer/types.ts#L257)

Visual-state override applied on top of a node's / edge's base render hints
when that state is active. Multiple active states stack — later-set state
wins per field. Removing the state restores the base hints.

**LEGACY** — v3 stores per-instance overlays at `NodeData.state` (singular,
overlay catalogue) and active list at `NodeData.states` (plural). Kept for
back-compat.
