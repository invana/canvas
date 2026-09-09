# Interface: CanvasTelemetryConfig

What telemetry to emit. Every field is off unless set. A boolean `true` uses the
built-in console adapter; the object form injects a real port + tuning.

## Properties

### logging?

> `optional` **logging?**: `boolean` \| [`LogLevel`](../type-aliases/LogLevel.md) \| \{ `level?`: [`LogLevel`](../type-aliases/LogLevel.md); `logger?`: [`Logger`](Logger.md); \}

Structured lifecycle logs off the event stream. `true` → console at `'info'`;
a bare [LogLevel](../type-aliases/LogLevel.md) sets the threshold; `{ logger, level }` injects a sink.

***

### metrics?

> `optional` **metrics?**: `boolean` \| \{ `meter?`: [`Meter`](Meter.md); \}

Per-frame FPS / frame-time / phase histograms + a dropped-frame counter (the
"speed trace"). `true` → console meter; `{ meter }` injects a real one.

***

### sink?

> `optional` **sink?**: [`TelemetrySink`](TelemetrySink.md)

Low-level raw hook — one [TelemetrySink](TelemetrySink.md) event per `view` mutation
(`action` + `changedPaths` + patch diff + `durationMs`), exporter-agnostic.
This is the primitive `traces` builds on; use it directly when you want the
raw event stream without spans / the event-bus tap.

***

### traces?

> `optional` **traces?**: `boolean` \| \{ `tap?`: [`TapOptions`](../../../canvas/src/interfaces/TapOptions.md); `tracer?`: [`Tracer`](Tracer.md); \}

View-mutation spans + event-bus spans + per-gesture interaction spans. `true`
→ console tracer; `{ tracer }` injects a real one (e.g. OpenTelemetry). `tap`
tunes the event-bus tap (`exclude` / `sampleRate`); the per-frame
`render:loop:tick` is always excluded (it is the metrics source, not a span).
