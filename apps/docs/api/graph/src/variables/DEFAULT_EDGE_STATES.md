# Variable: DEFAULT\_EDGE\_STATES

> `const` **DEFAULT\_EDGE\_STATES**: `Readonly`\<`Record`\<[`CanonicalStateName`](../type-aliases/CanonicalStateName.md), [`EdgeStyle`](../interfaces/EdgeStyle.md)\>\>

Defined in: [graph/src/layer/types.ts:1295](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1295)

Canonical edge-state overlays — sibling of [DEFAULT\_NODE\_STATES](DEFAULT_NODE_STATES.md).
Auto-merged into every `GraphLayer`'s `options.edge.state` catalogue
unless `GraphLayerOptions.useDefaultStates: false`.
