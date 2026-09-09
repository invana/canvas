# Interface: StyleOverride

Per-frame style override from a `target: 'style'` effect. Channels are
merged across effects with last-writer-wins per channel (insertion order in
the host's effect map). Pixi's tint multiplies the underlying fill, so a
`tint` of `0xffffff` is the identity.

## Properties

### alpha?

> `readonly` `optional` **alpha?**: `number`

Multiplier on the host's current alpha. Identity = 1.

***

### tint?

> `readonly` `optional` **tint?**: `number`

Pixi tint (multiplicative). Identity = `0xffffff`.
