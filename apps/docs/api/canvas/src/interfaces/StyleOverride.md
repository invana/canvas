# Interface: StyleOverride

Defined in: [packages/canvas/src/primitives/types.ts:691](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/types.ts#L691)

Per-frame style override from a `target: 'style'` effect. Channels are
merged across effects with last-writer-wins per channel (insertion order in
the host's effect map). Pixi's tint multiplies the underlying fill, so a
`tint` of `0xffffff` is the identity.

## Properties

### alpha?

> `readonly` `optional` **alpha?**: `number`

Defined in: [packages/canvas/src/primitives/types.ts:695](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/types.ts#L695)

Multiplier on the host's current alpha. Identity = 1.

***

### tint?

> `readonly` `optional` **tint?**: `number`

Defined in: [packages/canvas/src/primitives/types.ts:693](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/types.ts#L693)

Pixi tint (multiplicative). Identity = `0xffffff`.
