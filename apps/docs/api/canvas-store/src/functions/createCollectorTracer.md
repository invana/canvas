# Function: createCollectorTracer()

> **createCollectorTracer**(`now?`): `object`

An in-memory [Tracer](../interfaces/Tracer.md) that pushes finished spans into `spans` — for tests,
the playground, or a debug overlay. Not for production export.

## Parameters

### now?

() => `number`

## Returns

`object`

### spans

> **spans**: [`CollectedSpan`](../interfaces/CollectedSpan.md)[]

### tracer

> **tracer**: [`Tracer`](../interfaces/Tracer.md)
