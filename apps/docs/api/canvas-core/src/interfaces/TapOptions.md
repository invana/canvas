# Interface: TapOptions

Per-tap filters.

## Properties

### exclude?

> `optional` **exclude?**: readonly `string`[]

Event `type`s to drop from this tap.

***

### sampleRate?

> `optional` **sampleRate?**: `number`

Fraction (0..1) of events to forward — cheap sampling for costly sinks.
