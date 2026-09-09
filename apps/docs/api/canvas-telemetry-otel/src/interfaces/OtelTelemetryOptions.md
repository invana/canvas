# Interface: OtelTelemetryOptions

Options for [otelTelemetry](../functions/otelTelemetry.md).

## Properties

### console?

> `optional` **console?**: `boolean`

Also print spans to the browser console (debugging). Default `false`.

***

### endpoint?

> `optional` **endpoint?**: `string`

OTLP/HTTP **base** URL of the collector (the `/v1/{traces,metrics,logs}` paths
are appended). Default `http://localhost:4318`.

***

### headers?

> `optional` **headers?**: `Record`\<`string`, `string`\>

Extra headers on every OTLP request (merged over the CORS-safe default).

***

### logging?

> `optional` **logging?**: `boolean` \| `LogLevel`

Emit lifecycle logs; a LogLevel sets the threshold (`true` → `'info'`). Default `false`.

***

### metricIntervalMs?

> `optional` **metricIntervalMs?**: `number`

Metric export interval (ms) — how often the FPS series ships. Default `2000`.

***

### metrics?

> `optional` **metrics?**: `boolean`

Emit the per-frame FPS / phase metrics. Default `false`.

***

### serviceName?

> `optional` **serviceName?**: `string`

`service.name` stamped on every signal's resource. Default `'invana-canvas'`.

***

### traces?

> `optional` **traces?**: `boolean`

Emit view/event/interaction spans. Default `false`.
