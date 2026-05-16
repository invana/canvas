# Interface: ShakeEffectStyle

Defined in: [canvas/src/primitives/effects/shape/ShakeEffect.ts:18](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/effects/shape/ShakeEffect.ts#L18)

Style options for `ShakeEffect`.

- `amplitude` — peak jitter magnitude in world pixels, applied as a random
  offset to both axes every frame. Default `4`.
- `axis` — `'both' | 'x' | 'y'`. Default `'both'`.
- `decayMs` — when set, amplitude tweens from full to zero over this many
  milliseconds and the effect retires when complete. Use this for "shake
  on click" gestures. Omit for a continuous shake.
- `seed` — optional starting offset into the PRNG. Effects are independent
  by default (each constructs its own RNG state).

## Properties

### amplitude?

> `readonly` `optional` **amplitude?**: `number`

Defined in: [canvas/src/primitives/effects/shape/ShakeEffect.ts:19](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/effects/shape/ShakeEffect.ts#L19)

***

### axis?

> `readonly` `optional` **axis?**: `"x"` \| `"y"` \| `"both"`

Defined in: [canvas/src/primitives/effects/shape/ShakeEffect.ts:20](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/effects/shape/ShakeEffect.ts#L20)

***

### decayMs?

> `readonly` `optional` **decayMs?**: `number`

Defined in: [canvas/src/primitives/effects/shape/ShakeEffect.ts:21](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/effects/shape/ShakeEffect.ts#L21)

***

### seed?

> `readonly` `optional` **seed?**: `number`

Defined in: [canvas/src/primitives/effects/shape/ShakeEffect.ts:22](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/effects/shape/ShakeEffect.ts#L22)
