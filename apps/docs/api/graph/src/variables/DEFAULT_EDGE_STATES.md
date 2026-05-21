# Variable: DEFAULT\_EDGE\_STATES

> `const` **DEFAULT\_EDGE\_STATES**: `Readonly`\<`Record`\<[`CanonicalStateName`](../type-aliases/CanonicalStateName.md), [`EdgeStyle`](../interfaces/EdgeStyle.md)\>\>

Defined in: [graph/src/layer/types.ts:1242](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1242)

Canonical edge-state overlays — sibling of [DEFAULT\_NODE\_STATES](DEFAULT_NODE_STATES.md).
Auto-merged into every `GraphLayer`'s `options.edge.state` catalogue
unless `GraphLayerOptions.useDefaultStates: false`.
