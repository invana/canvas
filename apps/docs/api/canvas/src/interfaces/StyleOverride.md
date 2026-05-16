# Interface: StyleOverride

Defined in: [canvas/src/primitives/types.ts:797](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/types.ts#L797)

Per-frame style override from a `target: 'style'` effect. Channels are
merged across effects with last-writer-wins per channel (insertion order in
the host's effect map). Pixi's tint multiplies the underlying fill, so a
`tint` of `0xffffff` is the identity.

## Properties

### alpha?

> `readonly` `optional` **alpha?**: `number`

Defined in: [canvas/src/primitives/types.ts:801](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/types.ts#L801)

Multiplier on the host's current alpha. Identity = 1.

***

### tint?

> `readonly` `optional` **tint?**: `number`

Defined in: [canvas/src/primitives/types.ts:799](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/types.ts#L799)

Pixi tint (multiplicative). Identity = `0xffffff`.
