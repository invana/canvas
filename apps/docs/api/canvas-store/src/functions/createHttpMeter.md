# Function: createHttpMeter()

> **createHttpMeter**(`endpoint`, `opts?`): [`Meter`](../interfaces/Meter.md)

A dep-free [Meter](../interfaces/Meter.md) that **batches every record and POSTs it as JSON** to
an HTTP endpoint — the local counterpart to the OTLP exporter. Where
`createConsoleMeter` prints and the OTLP meter ships aggregated protobuf to a
collector, this ships the **raw per-record stream** (`[{ name, value, attrs }]`)
to any plain HTTP sink, so a lightweight collector can write it to a file for
offline inspection with **no OpenTelemetry backend required**.

Wire it through the normal telemetry config —
`telemetry: { metrics: { meter: createHttpMeter('http://localhost:4319/metrics') } }`
— so it rides the exact same [createFrameMetrics](createFrameMetrics.md) path as OTLP; only the
destination differs.

Fire-and-forget (`fetch` failures are swallowed) and self-scheduling (a single
`setTimeout` per batch window, cleared when the stream goes idle — no leaked
interval). No-ops gracefully where `fetch` / timers are unavailable.

## Parameters

### endpoint

`string`

### opts?

[`HttpMeterOptions`](../interfaces/HttpMeterOptions.md) = `{}`

## Returns

[`Meter`](../interfaces/Meter.md)
