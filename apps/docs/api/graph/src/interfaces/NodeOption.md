# Interface: NodeOption

Layer-level node template — G6's `node` field on GraphOptions. Resolvers
fire every frame against the stored `GraphNode`.

No `animation` field — per [[feedback_decoration_vs_animation]], animation
is the per-frame engine, not a node-level config. Decoration / effect
attachments live on `NodeStyle.decorations` / `NodeStyle.effects`.

## Properties

### palette?

> `readonly` `optional` **palette?**: `unknown`

Reserved for palette-driven theming. Deferred wiring.

***

### state?

> `readonly` `optional` **state?**: `Readonly`\<`Record`\<`string`, [`ResolvableNodeStyle`](../type-aliases/ResolvableNodeStyle.md)\<[`GraphNode`](GraphNode.md)\>\>\>

***

### style?

> `readonly` `optional` **style?**: [`ResolvableNodeStyle`](../type-aliases/ResolvableNodeStyle.md)\<[`GraphNode`](GraphNode.md)\>

***

### type?

> `readonly` `optional` **type?**: `string`

Type tag this template defines (e.g. 'person', 'doc'). Optional.
