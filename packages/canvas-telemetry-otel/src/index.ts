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

import { metrics, trace, type Meter as OtelMeter, type Tracer as OtelTracer } from '@opentelemetry/api';
import { SeverityNumber, type Logger as OtelLogsLogger } from '@opentelemetry/api-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { LoggerProvider, SimpleLogRecordProcessor } from '@opentelemetry/sdk-logs';
import {
  AggregationTemporality,
  MeterProvider,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics';
import { ConsoleSpanExporter, SimpleSpanProcessor, type SpanProcessor } from '@opentelemetry/sdk-trace-base';
import { StackContextManager, WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

import type { CanvasTelemetryConfig, LogLevel } from '@invana/canvas-store';

/** Options for {@link otelTelemetry}. */
export interface OtelTelemetryOptions {
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

const DEFAULT_ENDPOINT = 'http://localhost:4318';
const DEFAULT_SERVICE = 'invana-canvas';
const DEFAULT_METRIC_INTERVAL_MS = 2000;

// Passing ANY headers keeps the OTLP web exporters on a non-credentialed XHR/fetch,
// so a collector's wildcard CORS (`Access-Control-Allow-Origin: *`) is accepted.
const CORS_SAFE_HEADERS: Record<string, string> = { 'Content-Type': 'application/json' };

const SEVERITY: Record<LogLevel, SeverityNumber> = {
  debug: SeverityNumber.DEBUG,
  info: SeverityNumber.INFO,
  warn: SeverityNumber.WARN,
  error: SeverityNumber.ERROR,
};

// OTel global providers are singletons — create once, reuse across calls.
let tracer: OtelTracer | undefined;
let meter: OtelMeter | undefined;
let otelLogger: OtelLogsLogger | undefined;

/**
 * Build a {@link CanvasTelemetryConfig} backed by OpenTelemetry OTLP/HTTP
 * exporters. Pass the result to `new Canvas({ telemetry })` /
 * `createCanvasStore({ telemetry })`. Only the streams you enable create a
 * provider; disabled streams are omitted from the config (so the kernel skips them).
 */
export function otelTelemetry(opts: OtelTelemetryOptions = {}): CanvasTelemetryConfig {
  const base = (opts.endpoint ?? DEFAULT_ENDPOINT).replace(/\/+$/, '');
  const serviceName = opts.serviceName ?? DEFAULT_SERVICE;
  const headers = { ...CORS_SAFE_HEADERS, ...opts.headers };
  const resource = resourceFromAttributes({ [ATTR_SERVICE_NAME]: serviceName });

  const config: CanvasTelemetryConfig = {};

  if (opts.traces) {
    if (!tracer) {
      const processors: SpanProcessor[] = [];
      if (opts.console) processors.push(new SimpleSpanProcessor(new ConsoleSpanExporter()));
      processors.push(
        new SimpleSpanProcessor(new OTLPTraceExporter({ url: `${base}/v1/traces`, headers })),
      );
      const provider = new WebTracerProvider({ resource, spanProcessors: processors });
      provider.register({ contextManager: new StackContextManager() });
      tracer = trace.getTracer(serviceName);
    }
    config.traces = { tracer };
  }

  if (opts.metrics) {
    if (!meter) {
      const reader = new PeriodicExportingMetricReader({
        exporter: new OTLPMetricExporter({
          url: `${base}/v1/metrics`,
          headers,
          temporalityPreference: AggregationTemporality.DELTA,
        }),
        exportIntervalMillis: opts.metricIntervalMs ?? DEFAULT_METRIC_INTERVAL_MS,
      });
      const provider = new MeterProvider({ resource, readers: [reader] });
      metrics.setGlobalMeterProvider(provider);
      meter = provider.getMeter(serviceName);
    }
    config.metrics = { meter };
  }

  if (opts.logging) {
    const level: LogLevel = typeof opts.logging === 'string' ? opts.logging : 'info';
    if (!otelLogger) {
      const provider = new LoggerProvider({
        resource,
        processors: [new SimpleLogRecordProcessor(new OTLPLogExporter({ url: `${base}/v1/logs`, headers }))],
      });
      otelLogger = provider.getLogger(serviceName);
    }
    const logger = otelLogger;
    config.logging = {
      level,
      logger: {
        log: (r) =>
          logger.emit({
            severityNumber: SEVERITY[r.level],
            severityText: r.level.toUpperCase(),
            body: r.message,
            attributes: r.attributes,
          }),
      },
    };
  }

  return config;
}
