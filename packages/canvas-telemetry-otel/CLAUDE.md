# CLAUDE.md — packages/canvas-telemetry-otel (`@invana/canvas-telemetry-otel`)

The **OpenTelemetry adapter** for the kernel's telemetry ports — and **the only
*package* that imports an OTel SDK** — one stray remains in `apps/`
(`apps/storybook/stories/canvas-store/otel.ts` hand-rolls its own web tracer;
it predates this package and should collapse into `otelTelemetry`). One tiny surface
(`src/index.ts`, ~170 lines): `otelTelemetry(opts)` → a `CanvasTelemetryConfig`
whose `traces` / `metrics` / `logging` ports are backed by real OTLP/HTTP
exporters.

```ts
import { Canvas } from '@invana/canvas';
import { otelTelemetry } from '@invana/canvas-telemetry-otel';

new Canvas({
  telemetry: otelTelemetry({
    endpoint: 'http://localhost:4318',   // HyperDX / collector OTLP-HTTP base
    traces: true, metrics: true, logging: 'info',
  }),
});
```

## Why it is a separate package

`@invana/canvas-store` defines telemetry as **ports** (`Tracer` / `Meter` /
`Logger`) with a dep-free console reference adapter, and takes **no vendor
dependency**. The OTel SDK is ~a dozen packages; a consumer who wants no
observability must pull in none of them. So the vendor wiring lives here,
**opt-in and inert by default** — nothing in the engine imports this package;
the consumer constructs the config and passes it in (`new Canvas({ telemetry })`
/ `createCanvasStore({ telemetry })` / `<Canvas telemetry={…}>`).

Corollary: **don't import `@opentelemetry/*` anywhere else.** If the engine
needs a new signal, add it to the port in
`packages/canvas-store/src/telemetry/` and map it here — the same rule shape as
the renderer and state boundaries (root `CLAUDE.md`).

## Constraints baked into the implementation

| Constraint | Why |
|---|---|
| **OTLP/HTTP**, never gRPC (`…/v1/{traces,metrics,logs}` off the `endpoint` base) | Browsers can't speak OTLP/gRPC. |
| Always sends `headers` (default `Content-Type: application/json`) | Passing *any* headers keeps the web exporters on a **non-credentialed** XHR/fetch, which a collector's wildcard CORS (`Access-Control-Allow-Origin: *`) accepts. Merged over by `opts.headers`. |
| Providers are created **once** (module-level `tracer` / `meter` / `otelLogger`, first call wins) | OTel global providers are process singletons — so `otelTelemetry()` is safe to call per canvas. |
| **Delta** temporality, `metricIntervalMs` default `2000` | So a dashboard shows a live FPS trace rather than a monotonic cumulative one. |
| Only enabled streams create a provider; disabled ones are **omitted** from the returned config | The kernel skips a stream that isn't present — no cost for what you didn't ask for. |

## Deps + boundaries

`peerDependencies`: `@invana/canvas-store` (mirrored in `devDependencies`) — it
consumes `CanvasTelemetryConfig` + `LogLevel` as **types only**. No drawing
library, no React, no `@invana/canvas` import (allowed by `backend-detach`, but
unnecessary — the config is plain data).

## Live examples

`story:canvas-react/Canvas/WithTelemetry` and
`story:canvas-react/GraphCanvas/WithTelemetry` in `apps/storybook`.
