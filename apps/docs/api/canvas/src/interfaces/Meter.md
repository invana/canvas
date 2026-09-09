# Interface: Meter

Minimal meter — structurally satisfied by an OpenTelemetry `Meter`. Inject a
real one; the kernel keeps **no** OTel dependency (stays a renderer-free leaf).

## Methods

### createCounter()

> **createCounter**(`name`, `options?`): `Counter`

#### Parameters

##### name

`string`

##### options?

###### description?

`string`

###### unit?

`string`

#### Returns

`Counter`

***

### createHistogram()

> **createHistogram**(`name`, `options?`): `Histogram`

#### Parameters

##### name

`string`

##### options?

###### description?

`string`

###### unit?

`string`

#### Returns

`Histogram`
