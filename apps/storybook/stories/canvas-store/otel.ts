/**
 * OpenTelemetry web-tracer setup for the canvas-store Playground — a real OTel
 * `Tracer` the kernel's tracing adapters ({@link createTapTracer}) plug straight
 * into (they only need the structural `Tracer` port; a browser OTel tracer
 * satisfies it). This is the "concrete OTel adapter" the kernel deliberately does
 * **not** ship — the renderer-free leaf stays vendor-free; the vendor lives here.
 *
 * **Transport — direct OTLP/HTTP, non-credentialed XHR.** Browsers can't speak
 * OTLP/gRPC (`:4317`, Node-only), so the web uses OTLP/HTTP to `:4318/v1/traces`. The
 * catch: the OTLP web exporter defaults to the **Beacon API**, which *always* attaches
 * credentials, and the CORS spec forbids a wildcard `Access-Control-Allow-Origin: *`
 * (what the bundled HyperDX collector returns) on a **credentialed** request — hence
 * “cannot use wildcard … when credentials flag is true”. The exporter switches to
 * **XHR** (which we leave non-credentialed) the moment a `headers` option is passed —
 * see `EXPORTER_HEADERS` below. A non-credentialed request is fine with `*`, so we POST
 * straight to the collector: no proxy, no collector reconfiguration. The collector
 * forwards to HyperDX; swapping backends is a collector-config change, not a code one.
 *
 * **Pushes by default.** Spans always print via a {@link ConsoleSpanExporter}, **and**
 * export over OTLP/HTTP unless explicitly disabled with `VITE_INVANA_TELEMETRY_ENABLED=false`.
 * Override the URL with `VITE_INVANA_TELEMETRY_OTLP_HTTP_ENDPOINT`. Exports use a
 * {@link SimpleSpanProcessor} (one request per span, **no batch delay**) so spans reach
 * the collector immediately — this is a debugging harness. {@link DiagConsoleLogger} is
 * wired at WARN, so any export failure prints to the browser console.
 *
 * **Context propagation.** A synchronous {@link StackContextManager} — every action
 * runs its ripple synchronously (see `traceActions` in the story), so sync context is
 * enough to nest `state:change` / `data:intent` under the action span. No zone.js.
 */

import { diag, DiagConsoleLogger, DiagLogLevel, trace, type Tracer } from '@opentelemetry/api';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  ConsoleSpanExporter,
  SimpleSpanProcessor,
  type SpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import { StackContextManager, WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

/** Vite injects `import.meta.env`; type it loosely so we don't depend on `vite/client`. */
const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};

const DEFAULT_OTLP_HTTP_ENDPOINT = 'http://localhost:4318/v1/traces';

// Passing ANY `headers` flips the OTLP web exporter from the (credentialed) Beacon API
// to a plain XHR, which we leave non-credentialed — so the collector's wildcard CORS
// (`Access-Control-Allow-Origin: *`) is accepted. Without this, every export is blocked.
const EXPORTER_HEADERS: Record<string, string> = { 'Content-Type': 'application/json' };

/** Resolved telemetry config — surfaced to the UI so it can show where spans go. */
export interface TelemetryInfo {
  /** OTLP export enabled (else console-only). */
  readonly otlpEnabled: boolean;
  /** The OTLP/HTTP endpoint spans export to (when enabled). */
  readonly endpoint: string;
  /** Service name stamped on every span's resource. */
  readonly serviceName: string;
}

const SERVICE_NAME = 'invana-canvas-store';
// Push by default — set VITE_INVANA_TELEMETRY_ENABLED=false to fall back to console-only.
const otlpEnabled = env.VITE_INVANA_TELEMETRY_ENABLED !== 'false';
const endpoint = env.VITE_INVANA_TELEMETRY_OTLP_HTTP_ENDPOINT ?? DEFAULT_OTLP_HTTP_ENDPOINT;

export const telemetryInfo: TelemetryInfo = { otlpEnabled, endpoint, serviceName: SERVICE_NAME };

let tracer: Tracer | undefined;

/**
 * Get the canvas-store tracer, initialising the OTel {@link WebTracerProvider} on
 * first call (idempotent — Storybook keeps the iframe alive across stories). Wire
 * it into the kernel via `createTapTracer(store.events, getCanvasTracer())`, and
 * root each interaction with `getCanvasTracer().startActiveSpan(...)`.
 */
export function getCanvasTracer(): Tracer {
  if (tracer) return tracer;

  // Surface OTel's own diagnostics (export attempts + failures, incl. CORS/network) in
  // the browser console — the first place to look when spans don't reach the collector.
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.WARN);

  // SimpleSpanProcessor → export each span on end, immediately (no batch delay). Console
  // always on; OTLP/HTTP → collector when enabled.
  const processors: SpanProcessor[] = [new SimpleSpanProcessor(new ConsoleSpanExporter())];
  if (otlpEnabled) {
    processors.push(new SimpleSpanProcessor(new OTLPTraceExporter({ url: endpoint, headers: EXPORTER_HEADERS })));
  }

  const provider = new WebTracerProvider({
    resource: resourceFromAttributes({ [ATTR_SERVICE_NAME]: SERVICE_NAME }),
    spanProcessors: processors,
  });
  // register → sets the global tracer provider + the sync context manager that
  // makes startActiveSpan/startSpan auto-nest across the synchronous ripple.
  provider.register({ contextManager: new StackContextManager() });

  // Loud, one-time confirmation of what's actually wired — so "is it even enabled?" is
  // answerable from the console at a glance.
  // eslint-disable-next-line no-console
  console.info(
    `[canvas-store otel] service=${SERVICE_NAME} · OTLP ${otlpEnabled ? `→ ${endpoint} (XHR, non-credentialed)` : 'DISABLED (console only)'} · SimpleSpanProcessor (immediate). If spans don't reach HyperDX, check the Network tab for the POST to ${endpoint}.`,
  );

  tracer = trace.getTracer('canvas-store');
  return tracer;
}
