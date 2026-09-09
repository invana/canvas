# Interface: HttpMetricRecord

One buffered metric record shipped by [createHttpMeter](../functions/createHttpMeter.md).

## Properties

### attrs

> **attrs**: [`MetricAttributes`](../type-aliases/MetricAttributes.md)

Bounded-cardinality attributes, e.g. `{ interaction, phase }`.

***

### name

> **name**: `string`

Instrument name, e.g. `canvas.frame.phase`.

***

### value

> **value**: `number`

Recorded value (histogram) or increment (counter).
