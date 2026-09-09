# Function: createTracingSink()

> **createTracingSink**(`tracer`, `opts?`): [`TelemetrySink`](../interfaces/TelemetrySink.md)

A [TelemetrySink](../interfaces/TelemetrySink.md) that emits one span per `view` update — wire it via
`createCanvasStore({ telemetry: createTracingSink(tracer) })`. Maps `action` →
span name; `changedPaths` / patch count / `durationMs` → attributes. Updates are
point-in-time, so the span opens and ends immediately (a marker span whose
`duration_ms` attribute carries the real produce+commit cost).

## Parameters

### tracer

[`Tracer`](../interfaces/Tracer.md)

### opts?

#### prefix?

`string`

## Returns

[`TelemetrySink`](../interfaces/TelemetrySink.md)
