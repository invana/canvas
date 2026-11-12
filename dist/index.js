import { trace, metrics } from '@opentelemetry/api';
import { SeverityNumber } from '@opentelemetry/api-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { LoggerProvider, SimpleLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { PeriodicExportingMetricReader, AggregationTemporality, MeterProvider } from '@opentelemetry/sdk-metrics';
import { SimpleSpanProcessor, ConsoleSpanExporter } from '@opentelemetry/sdk-trace-base';
import { WebTracerProvider, StackContextManager } from '@opentelemetry/sdk-trace-web';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

// src/index.ts
var DEFAULT_ENDPOINT = "http://localhost:4318";
var DEFAULT_SERVICE = "invana-canvas";
var DEFAULT_METRIC_INTERVAL_MS = 2e3;
var CORS_SAFE_HEADERS = { "Content-Type": "application/json" };
var SEVERITY = {
  debug: SeverityNumber.DEBUG,
  info: SeverityNumber.INFO,
  warn: SeverityNumber.WARN,
  error: SeverityNumber.ERROR
};
var tracer;
var meter;
var otelLogger;
function otelTelemetry(opts = {}) {
  const base = (opts.endpoint ?? DEFAULT_ENDPOINT).replace(/\/+$/, "");
  const serviceName = opts.serviceName ?? DEFAULT_SERVICE;
  const headers = { ...CORS_SAFE_HEADERS, ...opts.headers };
  const resource = resourceFromAttributes({ [ATTR_SERVICE_NAME]: serviceName });
  const config = {};
  if (opts.traces) {
    if (!tracer) {
      const processors = [];
      if (opts.console) processors.push(new SimpleSpanProcessor(new ConsoleSpanExporter()));
      processors.push(
        new SimpleSpanProcessor(new OTLPTraceExporter({ url: `${base}/v1/traces`, headers }))
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
          temporalityPreference: AggregationTemporality.DELTA
        }),
        exportIntervalMillis: opts.metricIntervalMs ?? DEFAULT_METRIC_INTERVAL_MS
      });
      const provider = new MeterProvider({ resource, readers: [reader] });
      metrics.setGlobalMeterProvider(provider);
      meter = provider.getMeter(serviceName);
    }
    config.metrics = { meter };
  }
  if (opts.logging) {
    const level = typeof opts.logging === "string" ? opts.logging : "info";
    if (!otelLogger) {
      const provider = new LoggerProvider({
        resource,
        processors: [
          new SimpleLogRecordProcessor({
            exporter: new OTLPLogExporter({ url: `${base}/v1/logs`, headers })
          })
        ]
      });
      otelLogger = provider.getLogger(serviceName);
    }
    const logger = otelLogger;
    config.logging = {
      level,
      logger: {
        log: (r) => logger.emit({
          severityNumber: SEVERITY[r.level],
          severityText: r.level.toUpperCase(),
          body: r.message,
          attributes: r.attributes
        })
      }
    };
  }
  return config;
}

export { otelTelemetry };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map