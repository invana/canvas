# Interface: StyleOverride

Defined in: [canvas/src/primitives/types.ts:889](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L889)

Per-frame style override from a `target: 'style'` effect. Channels are
merged across effects with last-writer-wins per channel (insertion order in
the host's effect map). Pixi's tint multiplies the underlying fill, so a
`tint` of `0xffffff` is the identity.

## Properties

### alpha?

> `readonly` `optional` **alpha?**: `number`

Defined in: [canvas/src/primitives/types.ts:893](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L893)

Multiplier on the host's current alpha. Identity = 1.

***

### tint?

> `readonly` `optional` **tint?**: `number`

Defined in: [canvas/src/primitives/types.ts:891](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L891)

Pixi tint (multiplicative). Identity = `0xffffff`.
