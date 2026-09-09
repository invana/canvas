# Function: otelTelemetry()

> **otelTelemetry**(`opts?`): [`CanvasTelemetryConfig`](../../../canvas/src/interfaces/CanvasTelemetryConfig.md)

Build a [CanvasTelemetryConfig](../../../canvas/src/interfaces/CanvasTelemetryConfig.md) backed by OpenTelemetry OTLP/HTTP
exporters. Pass the result to `new Canvas({ telemetry })` /
`createCanvasStore({ telemetry })`. Only the streams you enable create a
provider; disabled streams are omitted from the config (so the kernel skips them).

## Parameters

### opts?

[`OtelTelemetryOptions`](../interfaces/OtelTelemetryOptions.md) = `{}`

## Returns

[`CanvasTelemetryConfig`](../../../canvas/src/interfaces/CanvasTelemetryConfig.md)
