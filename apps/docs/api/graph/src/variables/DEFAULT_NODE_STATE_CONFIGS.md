# Variable: DEFAULT\_NODE\_STATE\_CONFIGS

> `const` **DEFAULT\_NODE\_STATE\_CONFIGS**: `Readonly`\<`Record`\<[`CanonicalStateName`](../type-aliases/CanonicalStateName.md), [`NodeStateConfig`](../type-aliases/NodeStateConfig.md)\>\>

Defined in: [graph/src/layer/types.ts:285](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L285)

Canonical node state configs registered on every `GraphLayer` by default.
Override individual entries with `setNodeStateConfig(name, customConfig)`
after construction, or opt out entirely via
`GraphLayerOptions.useDefaultStateConfigs: false`.
