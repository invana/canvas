# Interface: BreathingConnectorEffectStyle

Defined in: [canvas/src/primitives/effects/connector/BreathingConnectorEffect.ts:15](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/effects/connector/BreathingConnectorEffect.ts#L15)

Sinusoidal alpha modulation on the host connector. Cycles forever — never
retires on its own; remove explicitly via `setEffect(id, slot, null)`.

Style channel only — connector effects don't have a coherent meaning
for transform deltas (translating / scaling a path-resolved primitive
would just shift its position offscreen relative to the endpoints),
so this effect modulates the host's gfx alpha instead. Pairs naturally
with a thin static `glow-connector` for "active edge" cues, or stands
alone for "blinking" / "pulsing" / "in-flight" visualisations.

## Properties

### amplitude?

> `readonly` `optional` **amplitude?**: `number`

Defined in: [canvas/src/primitives/effects/connector/BreathingConnectorEffect.ts:20](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/effects/connector/BreathingConnectorEffect.ts#L20)

How far below full brightness the dim phase reaches, `[0, 1]`.
`0.5` swings alpha between `0.5` and `1`. Default `0.5`.

***

### periodMs?

> `readonly` `optional` **periodMs?**: `number`

Defined in: [canvas/src/primitives/effects/connector/BreathingConnectorEffect.ts:22](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/effects/connector/BreathingConnectorEffect.ts#L22)

Duration of one full breath cycle in ms. Default `1800`.

***

### phaseOffsetMs?

> `readonly` `optional` **phaseOffsetMs?**: `number`

Defined in: [canvas/src/primitives/effects/connector/BreathingConnectorEffect.ts:24](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/effects/connector/BreathingConnectorEffect.ts#L24)

Start-time offset so multiple breathing hosts can desync. Default `0`.
