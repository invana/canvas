# Function: withTelemetry()

> **withTelemetry**\<`T`\>(`store`, `sink`, `now?`): () => `void`

Attach telemetry to a [ReactiveStore](../../../canvas/src/interfaces/ReactiveStore.md) — a **port decorator**, not a zustand
middleware, so it survives a backend swap (zustand → Yjs) and is scoped to this
(view) store, never the bulk data hot path. One event per change, carrying the
action label + the patch diff. Returns an **unsubscribe** so the caller can
detach the sink (e.g. when tearing telemetry down).

## Type Parameters

### T

`T`

## Parameters

### store

[`ReactiveStore`](../../../canvas/src/interfaces/ReactiveStore.md)\<`T`\>

### sink

[`TelemetrySink`](../interfaces/TelemetrySink.md)

### now?

() => `number`

## Returns

() => `void`
