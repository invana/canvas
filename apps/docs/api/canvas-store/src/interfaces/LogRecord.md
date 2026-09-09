# Interface: LogRecord

One structured log record.

## Properties

### attributes?

> `optional` **attributes?**: [`LogAttributes`](../type-aliases/LogAttributes.md)

Bounded, low-cardinality context.

***

### level

> **level**: [`LogLevel`](../type-aliases/LogLevel.md)

***

### message

> **message**: `string`

Human-readable message — here, the event `type`.

***

### ts

> **ts**: `number`

Emit time (ms).
