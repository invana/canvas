# Interface: NodeOption

Defined in: [graph/src/layer/types.ts:634](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L634)

Layer-level node template — G6's `node` field on GraphOptions. Resolvers
fire every frame against the stored `GraphNode`.

No `animation` field — per [[feedback_decoration_vs_animation]], animation
is the per-frame engine, not a node-level config. Decoration / effect
attachments live on `NodeStyle.decorations` / `NodeStyle.effects`.

## Properties

### palette?

> `readonly` `optional` **palette?**: `unknown`

Defined in: [graph/src/layer/types.ts:640](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L640)

Reserved for palette-driven theming. Deferred wiring.

***

### state?

> `readonly` `optional` **state?**: `Readonly`\<`Record`\<`string`, [`ResolvableNodeStyle`](../type-aliases/ResolvableNodeStyle.md)\<[`GraphNode`](GraphNode.md)\>\>\>

Defined in: [graph/src/layer/types.ts:638](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L638)

***

### style?

> `readonly` `optional` **style?**: [`ResolvableNodeStyle`](../type-aliases/ResolvableNodeStyle.md)\<[`GraphNode`](GraphNode.md)\>

Defined in: [graph/src/layer/types.ts:637](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L637)

***

### type?

> `readonly` `optional` **type?**: `string`

Defined in: [graph/src/layer/types.ts:636](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L636)

Type tag this template defines (e.g. 'person', 'doc'). Optional.
