# Interface: FadeInConnectorEffectStyle

Defined in: [canvas/src/primitives/effects/connector/FadeInConnectorEffect.ts:26](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/effects/connector/FadeInConnectorEffect.ts#L26)

One-shot opacity fade-in on the host connector. Drives the connector's
alpha from `fromAlpha` (default `0`) to `toAlpha` (default `1`) over
`durationMs` with the configured easing, then retires from the per-frame
tick set while continuing to contribute `toAlpha` to the effect aggregation
so the connector stays visible after the fade.

Pairs naturally with the appearance of a "new edge" in a graph. For a
continuous pulse use `BreathingConnectorEffect` instead — this one is
deliberately one-shot.

## Properties

### delayMs?

> `readonly` `optional` **delayMs?**: `number`

Defined in: [canvas/src/primitives/effects/connector/FadeInConnectorEffect.ts:36](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/effects/connector/FadeInConnectorEffect.ts#L36)

Hold the effect at `fromAlpha` for this many ms before the fade starts. Default `0`.

***

### durationMs?

> `readonly` `optional` **durationMs?**: `number`

Defined in: [canvas/src/primitives/effects/connector/FadeInConnectorEffect.ts:28](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/effects/connector/FadeInConnectorEffect.ts#L28)

Duration of the fade in milliseconds. Default `600`.

***

### easing?

> `readonly` `optional` **easing?**: [`FadeInEasingName`](../type-aliases/FadeInEasingName.md)

Defined in: [canvas/src/primitives/effects/connector/FadeInConnectorEffect.ts:34](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/effects/connector/FadeInConnectorEffect.ts#L34)

Easing curve. Default `'easeOutCubic'`.

***

### fromAlpha?

> `readonly` `optional` **fromAlpha?**: `number`

Defined in: [canvas/src/primitives/effects/connector/FadeInConnectorEffect.ts:30](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/effects/connector/FadeInConnectorEffect.ts#L30)

Start alpha. Default `0`.

***

### toAlpha?

> `readonly` `optional` **toAlpha?**: `number`

Defined in: [canvas/src/primitives/effects/connector/FadeInConnectorEffect.ts:32](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/effects/connector/FadeInConnectorEffect.ts#L32)

End alpha. Default `1`.
