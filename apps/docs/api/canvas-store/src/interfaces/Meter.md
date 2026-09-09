# Interface: Meter

Minimal meter — structurally satisfied by an OpenTelemetry `Meter`. Inject a
real one; the kernel keeps **no** OTel dependency (stays a renderer-free leaf).

## Methods

### createCounter()

> **createCounter**(`name`, `options?`): [`Counter`](Counter.md)

#### Parameters

##### name

`string`

##### options?

###### description?

`string`

###### unit?

`string`

#### Returns

[`Counter`](Counter.md)

***

### createHistogram()

> **createHistogram**(`name`, `options?`): [`Histogram`](Histogram.md)

#### Parameters

##### name

`string`

##### options?

###### description?

`string`

###### unit?

`string`

#### Returns

[`Histogram`](Histogram.md)
