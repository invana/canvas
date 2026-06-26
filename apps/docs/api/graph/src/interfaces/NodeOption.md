# Interface: NodeOption

Defined in: [graph/src/layer/types.ts:1076](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1076)

Layer-level node template — G6's `node` field on GraphOptions. Resolvers
fire every frame against the stored `GraphNode`.

No `animation` field — per [[feedback_decoration_vs_animation]], animation
is the per-frame engine, not a node-level config. Decoration / effect
attachments live on `NodeStyle.decorations` / `NodeStyle.effects`.

## Properties

### palette?

> `readonly` `optional` **palette?**: `unknown`

Defined in: [graph/src/layer/types.ts:1082](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1082)

Reserved for palette-driven theming. Deferred wiring.

***

### state?

> `readonly` `optional` **state?**: `Readonly`\<`Record`\<`string`, [`ResolvableNodeStyle`](../type-aliases/ResolvableNodeStyle.md)\<[`GraphNode`](GraphNode.md)\>\>\>

Defined in: [graph/src/layer/types.ts:1080](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1080)

***

### style?

> `readonly` `optional` **style?**: [`ResolvableNodeStyle`](../type-aliases/ResolvableNodeStyle.md)\<[`GraphNode`](GraphNode.md)\>

Defined in: [graph/src/layer/types.ts:1079](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1079)

***

### type?

> `readonly` `optional` **type?**: `string`

Defined in: [graph/src/layer/types.ts:1078](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1078)

Type tag this template defines (e.g. 'person', 'doc'). Optional.
