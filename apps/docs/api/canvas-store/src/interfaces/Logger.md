# Interface: Logger

Minimal logger port. The kernel keeps **no** logging-vendor dependency; inject
a real one (or use [createConsoleLogger](../functions/createConsoleLogger.md)). Unlike the tracer/meter ports
this is not structurally an OTel type — the OTel *logs* SDK has a different
shape, so the `@invana/canvas-telemetry-otel` adapter maps this → OTel.

## Methods

### log()

> **log**(`record`): `void`

#### Parameters

##### record

[`LogRecord`](LogRecord.md)

#### Returns

`void`
