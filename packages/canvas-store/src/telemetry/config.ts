/**
 * Unified telemetry configuration — the single toggle surface baked into the
 * kernel so **any** consumer (not just the engine, not just Storybook) can turn
 * traces / metrics / logging on or off, passed as `createCanvasStore({ telemetry })`
 * (and forwarded by `new Canvas({ telemetry })`).
 *
 * Each stream is independently toggleable and works with **zero extra installs**:
 * `true` uses the dep-free console reference adapter, so `telemetry: { traces: true }`
 * prints spans to the console immediately. To ship to a backend (OTLP → HyperDX,
 * …), inject a real port — `traces: { tracer }`, `metrics: { meter }`,
 * `logging: { logger }` — which the opt-in `@invana/canvas-telemetry-otel` package
 * produces. The kernel itself takes **no** vendor dependency (renderer-free leaf).
 *
 * {@link wireTelemetry} is the engine-agnostic wiring: given the resolved
 * store + bus, it attaches exactly the streams the config enables and returns one
 * disposer that detaches them all.
 */

import type { CanvasEventBus, TapOptions } from '../events/CanvasEventBus';
import type { ReactiveStore } from '../port/types';
import type { CanvasView } from '../view/CanvasView';
import {
  createConsoleLogger,
  createLogBridge,
  type LogLevel,
  type Logger,
} from './logging';
import {
  createConsoleMeter,
  createFrameMetrics,
  createInteractionTracer,
  type Meter,
} from './metrics';
import {
  createConsoleTracer,
  createTapTracer,
  createTracingSink,
  type Tracer,
} from './tracing';
import { withTelemetry, type TelemetrySink } from './withTelemetry';

/**
 * What telemetry to emit. Every field is off unless set. A boolean `true` uses the
 * built-in console adapter; the object form injects a real port + tuning.
 */
export interface CanvasTelemetryConfig {
  /**
   * Low-level raw hook — one {@link TelemetrySink} event per `view` mutation
   * (`action` + `changedPaths` + patch diff + `durationMs`), exporter-agnostic.
   * This is the primitive `traces` builds on; use it directly when you want the
   * raw event stream without spans / the event-bus tap.
   */
  sink?: TelemetrySink;
  /**
   * View-mutation spans + event-bus spans + per-gesture interaction spans. `true`
   * → console tracer; `{ tracer }` injects a real one (e.g. OpenTelemetry). `tap`
   * tunes the event-bus tap (`exclude` / `sampleRate`); the per-frame
   * `render:loop:tick` is always excluded (it is the metrics source, not a span).
   */
  traces?: boolean | { tracer?: Tracer; tap?: TapOptions };
  /**
   * Per-frame FPS / frame-time / phase histograms + a dropped-frame counter (the
   * "speed trace"). `true` → console meter; `{ meter }` injects a real one.
   */
  metrics?: boolean | { meter?: Meter };
  /**
   * Structured lifecycle logs off the event stream. `true` → console at `'info'`;
   * a bare {@link LogLevel} sets the threshold; `{ logger, level }` injects a sink.
   */
  logging?: boolean | LogLevel | { logger?: Logger; level?: LogLevel };
}

/** The kernel surfaces {@link wireTelemetry} needs — the view store + the bus. */
export interface TelemetryTarget {
  view: ReactiveStore<CanvasView>;
  events: CanvasEventBus;
}

/**
 * Attach the telemetry streams a {@link CanvasTelemetryConfig} enables to a
 * store + bus, and return a disposer that detaches them all. Called by
 * `createCanvasStore` when a `telemetry` config is supplied — so the toggles are
 * honoured wherever a `CanvasStore` is created.
 */
export function wireTelemetry(target: TelemetryTarget, config: CanvasTelemetryConfig): () => void {
  const { view, events } = target;
  const offs: Array<() => void> = [];

  // Raw view-mutation sink (the primitive) — independent of the spans path.
  if (config.sink) offs.push(withTelemetry(view, config.sink));

  if (config.traces) {
    const t = config.traces === true ? {} : config.traces;
    const tracer = t.tracer ?? createConsoleTracer();
    // View mutations → spans (carries the produce+commit `durationMs`).
    offs.push(withTelemetry(view, createTracingSink(tracer)));
    // The causal event loop → spans. Always drop the per-frame tick — it fires
    // every frame and is already the metrics source; tracing it floods the view.
    const tap = t.tap ?? {};
    const exclude = tap.exclude ? [...tap.exclude, 'render:loop:tick'] : ['render:loop:tick'];
    offs.push(createTapTracer(events, tracer, { ...tap, exclude }));
    // Per-gesture interaction spans (the FPS-dip "markers") — spans, so they ride
    // the traces toggle; they read the frame stream for the dip magnitude.
    offs.push(createInteractionTracer(events, tracer));
  }

  if (config.metrics) {
    const m = config.metrics === true ? {} : config.metrics;
    const meter = m.meter ?? createConsoleMeter();
    offs.push(createFrameMetrics(events, meter));
  }

  if (config.logging) {
    const l =
      config.logging === true
        ? {}
        : typeof config.logging === 'string'
          ? { level: config.logging }
          : config.logging;
    const logger = l.logger ?? createConsoleLogger();
    offs.push(createLogBridge(events, logger, { level: l.level ?? 'info' }));
  }

  return () => {
    for (const off of offs) off();
    offs.length = 0;
  };
}
