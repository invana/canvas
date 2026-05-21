# Interface: NodeOption

Defined in: [graph/src/layer/types.ts:1023](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1023)

Layer-level node template — G6's `node` field on GraphOptions. Resolvers
fire every frame against the stored `GraphNode`.

No `animation` field — per [[feedback_decoration_vs_animation]], animation
is the per-frame engine, not a node-level config. Decoration / effect
attachments live on `NodeStyle.decorations` / `NodeStyle.effects`.

## Properties

### palette?

> `readonly` `optional` **palette?**: `unknown`

Defined in: [graph/src/layer/types.ts:1029](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1029)

Reserved for palette-driven theming. Deferred wiring.

***

### state?

> `readonly` `optional` **state?**: `Readonly`\<`Record`\<`string`, [`ResolvableNodeStyle`](../type-aliases/ResolvableNodeStyle.md)\<[`GraphNode`](GraphNode.md)\>\>\>

Defined in: [graph/src/layer/types.ts:1027](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1027)

***

### style?

> `readonly` `optional` **style?**: [`ResolvableNodeStyle`](../type-aliases/ResolvableNodeStyle.md)\<[`GraphNode`](GraphNode.md)\>

Defined in: [graph/src/layer/types.ts:1026](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1026)

***

### type?

> `readonly` `optional` **type?**: `string`

Defined in: [graph/src/layer/types.ts:1025](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1025)

Type tag this template defines (e.g. 'person', 'doc'). Optional.
