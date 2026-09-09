# Interface: CreateCanvasStoreOptions

## Properties

### backend?

> `optional` **backend?**: `"zustand"` \| `"memory"`

View-store backend. Default `'zustand'`; `'memory'` is dependency-free.

***

### telemetry?

> `optional` **telemetry?**: [`CanvasTelemetryConfig`](CanvasTelemetryConfig.md)

Telemetry to emit — independently toggle `traces` / `metrics` / `logging`
(see [CanvasTelemetryConfig](CanvasTelemetryConfig.md)). `true` per stream uses the dep-free
console adapter; inject a real port for OTLP/HyperDX export via the opt-in
`@invana/canvas-telemetry-otel` package. Omitted → no telemetry.
