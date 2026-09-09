# Function: createTapTracer()

> **createTapTracer**(`bus`, `tracer`, `opts?`): () => `void`

Bridge the whole event **tap** stream to spans — every [CanvasEvent](../../../canvas/src/interfaces/CanvasEvent.md)
envelope becomes a span named by its `type`, attributed via [tapAttributes](tapAttributes.md)
(source + payload fields). With a real OpenTelemetry tracer, each span
**auto-parents to the active context**, so wrapping an interaction in
`tracer.startActiveSpan(...)` nests the whole synchronous ripple (input →
`state:change` → `data:flush`) into one causal trace. Returns an unsubscribe.
Honours `exclude` / `sampleRate` so machine-rate types don't flood.

## Parameters

### bus

[`CanvasEventBus`](../../../canvas/src/classes/CanvasEventBus.md)

### tracer

[`Tracer`](../interfaces/Tracer.md)

### opts?

[`TapOptions`](../../../canvas/src/interfaces/TapOptions.md) & `object` = `{}`

## Returns

() => `void`
