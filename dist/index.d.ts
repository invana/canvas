import { LogLevel, CanvasTelemetryConfig } from '@invana/canvas-store';

/**
 * `@invana/canvas-telemetry-otel` — the concrete OpenTelemetry adapter the
 * vendor-free canvas kernel deliberately does not ship. It turns
 * {@link otelTelemetry} options into a {@link CanvasTelemetryConfig} whose
 * `tracer` / `meter` / `logger` ports are backed by real OTLP/HTTP exporters, so
 * a single line lights up traces + metrics (FPS) + logs to HyperDX or any OTel
 * collector:
 *
 * ```ts
 * import { Canvas } from '@invana/canvas';
 * import { otelTelemetry } from '@invana/canvas-telemetry-otel';
 *
 * new Canvas({
 *   telemetry: otelTelemetry({
 *     endpoint: 'http://localhost:4318',   // HyperDX / collector OTLP-HTTP base
 *     traces: true, metrics: true, logging: 'info',
 *   }),
 * });
 * ```
 *
 * **Transport.** Browsers can't speak OTLP/gRPC, so this uses OTLP/HTTP to
 * `…/v1/{traces,metrics,logs}`. Passing `headers` keeps the exporters on a
 * non-credentialed XHR/fetch, which the common collector wildcard-CORS setup
 * (`Access-Control-Allow-Origin: *`) accepts. **Metrics** use delta temporality
 * on a short interval so a dashboard shows a live FPS trace.
 *
 * The OTel global providers are process singletons, so the providers here are
 * created **once** (first call wins) and reused — safe to call `otelTelemetry`
 * per canvas.
 */

/** Options for {@link otelTelemetry}. */
interface OtelTelemetryOptions {
    /**
     * OTLP/HTTP **base** URL of the collector (the `/v1/{traces,metrics,logs}` paths
     * are appended). Default `http://localhost:4318`.
     */
    endpoint?: string;
    /** `service.name` stamped on every signal's resource. Default `'invana-canvas'`. */
    serviceName?: string;
    /** Emit view/event/interaction spans. Default `false`. */
    traces?: boolean;
    /** Emit the per-frame FPS / phase metrics. Default `false`. */
    metrics?: boolean;
    /** Emit lifecycle logs; a {@link LogLevel} sets the threshold (`true` → `'info'`). Default `false`. */
    logging?: boolean | LogLevel;
    /** Also print spans to the browser console (debugging). Default `false`. */
    console?: boolean;
    /** Metric export interval (ms) — how often the FPS series ships. Default `2000`. */
    metricIntervalMs?: number;
    /** Extra headers on every OTLP request (merged over the CORS-safe default). */
    headers?: Record<string, string>;
}
/**
 * Build a {@link CanvasTelemetryConfig} backed by OpenTelemetry OTLP/HTTP
 * exporters. Pass the result to `new Canvas({ telemetry })` /
 * `createCanvasStore({ telemetry })`. Only the streams you enable create a
 * provider; disabled streams are omitted from the config (so the kernel skips them).
 */
declare function otelTelemetry(opts?: OtelTelemetryOptions): CanvasTelemetryConfig;

export { type OtelTelemetryOptions, otelTelemetry };
