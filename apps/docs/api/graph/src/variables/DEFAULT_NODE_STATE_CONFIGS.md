# Variable: DEFAULT\_NODE\_STATE\_CONFIGS

> `const` **DEFAULT\_NODE\_STATE\_CONFIGS**: `Readonly`\<`Record`\<[`CanonicalStateName`](../type-aliases/CanonicalStateName.md), [`NodeStateConfig`](../type-aliases/NodeStateConfig.md)\>\>

Defined in: [graph/src/layer/types.ts:285](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph/src/layer/types.ts#L285)

Canonical node state configs registered on every `GraphLayer` by default.
Override individual entries with `setNodeStateConfig(name, customConfig)`
after construction, or opt out entirely via
`GraphLayerOptions.useDefaultStateConfigs: false`.
