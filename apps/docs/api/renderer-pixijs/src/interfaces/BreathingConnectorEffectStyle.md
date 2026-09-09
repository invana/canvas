# Interface: BreathingConnectorEffectStyle

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

How far below full brightness the dim phase reaches, `[0, 1]`.
`0.5` swings alpha between `0.5` and `1`. Default `0.5`.

***

### periodMs?

> `readonly` `optional` **periodMs?**: `number`

Duration of one full breath cycle in ms. Default `1800`.

***

### phaseOffsetMs?

> `readonly` `optional` **phaseOffsetMs?**: `number`

Start-time offset so multiple breathing hosts can desync. Default `0`.
