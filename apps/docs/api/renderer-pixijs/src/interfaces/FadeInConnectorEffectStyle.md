# Interface: FadeInConnectorEffectStyle

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

Hold the effect at `fromAlpha` for this many ms before the fade starts. Default `0`.

***

### durationMs?

> `readonly` `optional` **durationMs?**: `number`

Duration of the fade in milliseconds. Default `600`.

***

### easing?

> `readonly` `optional` **easing?**: [`FadeInEasingName`](../type-aliases/FadeInEasingName.md)

Easing curve. Default `'easeOutCubic'`.

***

### fromAlpha?

> `readonly` `optional` **fromAlpha?**: `number`

Start alpha. Default `0`.

***

### toAlpha?

> `readonly` `optional` **toAlpha?**: `number`

End alpha. Default `1`.
