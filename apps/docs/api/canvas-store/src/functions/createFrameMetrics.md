# Function: createFrameMetrics()

> **createFrameMetrics**(`bus`, `meter`, `opts?`): () => `void`

Bridge the `render:loop:tick` stream to OpenTelemetry metrics. Per frame it
records:
- `<prefix>frame.duration` (ms histogram) — total inter-frame time, attr `interaction`.
- `<prefix>frame.cpu` (ms histogram) — engine CPU cost that frame, attr `interaction`.
- `<prefix>frame.phase` (ms histogram) — one record per phase, attr `phase` (+ `interaction`).
- `<prefix>frame.count` (counter) — frames, attr `interaction` (denominator for an FPS rate).
- `<prefix>frame.dropped` (counter) — long/jank frames, attr `interaction`.

Only bounded-cardinality attributes (`interaction`, `phase`) are attached, so the
series stay dashboard-safe. Returns an unsubscribe.

## Parameters

### bus

[`CanvasEventBus`](../../../canvas/src/classes/CanvasEventBus.md)

### meter

[`Meter`](../interfaces/Meter.md)

### opts?

[`FrameMetricsOptions`](../interfaces/FrameMetricsOptions.md) = `{}`

## Returns

() => `void`
