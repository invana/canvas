# Interface: TelemetrySink

Where telemetry events go. The engine stays exporter-agnostic; the app wires this.

## Methods

### emit()

> **emit**(`event`): `void`

#### Parameters

##### event

[`TelemetryEvent`](TelemetryEvent.md)

#### Returns

`void`
