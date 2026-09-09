# Function: wireTelemetry()

> **wireTelemetry**(`target`, `config`): () => `void`

Attach the telemetry streams a [CanvasTelemetryConfig](../interfaces/CanvasTelemetryConfig.md) enables to a
store + bus, and return a disposer that detaches them all. Called by
`createCanvasStore` when a `telemetry` config is supplied — so the toggles are
honoured wherever a `CanvasStore` is created.

## Parameters

### target

[`TelemetryTarget`](../interfaces/TelemetryTarget.md)

### config

[`CanvasTelemetryConfig`](../interfaces/CanvasTelemetryConfig.md)

## Returns

() => `void`
