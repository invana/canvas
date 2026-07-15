/**
 * Metrics adapters — turn the engine's per-frame {@link FrameTick} stream into
 * OpenTelemetry **metrics** (histograms + counters) and per-gesture **spans**,
 * without the kernel taking an OpenTelemetry dependency. Sibling of
 * `tracing.ts`: you inject a {@link Meter} / {@link Tracer}; a real OpenTelemetry
 * `Meter` (`metrics.getMeter('canvas')`) / `Tracer` **structurally satisfies**
 * them, so the concrete adapter is just:
 *
 * ```ts
 * import { metrics, trace } from '@opentelemetry/api';
 * const offMetrics = createFrameMetrics(canvas.events, metrics.getMeter('canvas'));
 * const offSpans   = createInteractionTracer(canvas.events, trace.getTracer('canvas'));
 * ```
 *
 * This is the "F1 telemetry" wiring:
 * - {@link createFrameMetrics} — the continuous **speed trace**: one histogram
 *   record per frame for total frame time + CPU time, one per phase, and a
 *   dropped-frame counter. Every instrument is tagged with the frame's
 *   {@link InteractionKind}, so a dashboard can `group by interaction` and see
 *   which gesture owns each FPS dip.
 * - {@link createInteractionTracer} — the **event markers**: one span per gesture
 *   (`zoom` / `pan` / `drag` / `hover` / `layout`), carrying how far FPS dipped
 *   during it (`fps.baseline` → `fps.min` = `fps.drop`) and the worst frame.
 *   Derived purely from the tick stream's `interaction` transitions — no extra
 *   subscriptions.
 *
 * {@link createConsoleMeter} is a dep-free reference meter for debugging / tests.
 */

import type { CanvasEventBus } from '../events/CanvasEventBus';
import type { FrameTick, InteractionKind } from '../perf/frame';
import type { Tracer, TraceSpan } from './tracing';

/** Metric attribute values (the OpenTelemetry-compatible subset). */
export type MetricAttributes = Record<string, string | number | boolean>;

/** A recorded-value instrument — structurally satisfied by an OTel `Histogram`. */
export interface Histogram {
  record(value: number, attributes?: MetricAttributes): void;
}

/** A monotonic instrument — structurally satisfied by an OTel `Counter`. */
export interface Counter {
  add(value: number, attributes?: MetricAttributes): void;
}

/**
 * Minimal meter — structurally satisfied by an OpenTelemetry `Meter`. Inject a
 * real one; the kernel keeps **no** OTel dependency (stays a renderer-free leaf).
 */
export interface Meter {
  createHistogram(name: string, options?: { description?: string; unit?: string }): Histogram;
  createCounter(name: string, options?: { description?: string; unit?: string }): Counter;
}

/** Options shared by the frame recorders. */
export interface FrameMetricsOptions {
  /** Instrument-name prefix. Default `'canvas.'`. */
  prefix?: string;
}

/**
 * Bridge the `render:loop:tick` stream to OpenTelemetry metrics. Per frame it
 * records:
 * - `<prefix>frame.duration` (ms histogram) — total inter-frame time, attr `interaction`.
 * - `<prefix>frame.cpu` (ms histogram) — engine CPU cost that frame, attr `interaction`.
 * - `<prefix>frame.phase` (ms histogram) — one record per phase, attr `phase` (+ `interaction`).
 * - `<prefix>frame.count` (counter) — frames, attr `interaction` (denominator for an FPS rate).
 * - `<prefix>frame.dropped` (counter) — long/jank frames, attr `interaction`.
 *
 * Only bounded-cardinality attributes (`interaction`, `phase`) are attached, so the
 * series stay dashboard-safe. Returns an unsubscribe.
 */
export function createFrameMetrics(
  bus: CanvasEventBus,
  meter: Meter,
  opts: FrameMetricsOptions = {},
): () => void {
  const p = opts.prefix ?? 'canvas.';
  const duration = meter.createHistogram(`${p}frame.duration`, {
    description: 'Inter-frame period (wall clock)',
    unit: 'ms',
  });
  const cpu = meter.createHistogram(`${p}frame.cpu`, {
    description: 'Engine CPU cost per frame (camera + data flush + layers)',
    unit: 'ms',
  });
  const phase = meter.createHistogram(`${p}frame.phase`, {
    description: 'Per-phase CPU cost per frame',
    unit: 'ms',
  });
  const count = meter.createCounter(`${p}frame.count`, {
    description: 'Rendered frames',
    unit: '{frame}',
  });
  const dropped = meter.createCounter(`${p}frame.dropped`, {
    description: 'Long (jank) frames over the threshold',
    unit: '{frame}',
  });

  return bus.on('render:loop:tick', (t: FrameTick) => {
    const at: MetricAttributes = { interaction: t.interaction };
    duration.record(t.dt, at);
    cpu.record(t.cpuMs, at);
    phase.record(t.phases.camera, { interaction: t.interaction, phase: 'camera' });
    phase.record(t.phases.dataFlush, { interaction: t.interaction, phase: 'dataFlush' });
    phase.record(t.phases.layers, { interaction: t.interaction, phase: 'layers' });
    count.add(1, at);
    if (t.longFrame) dropped.add(1, at);
  });
}

/** Options for the interaction tracer. */
export interface InteractionTracerOptions {
  /** Span-name prefix. Default `'canvas.interaction.'`. */
  prefix?: string;
}

/**
 * Emit one span per user gesture, derived purely from the `render:loop:tick`
 * stream's {@link InteractionKind} transitions — no extra bus subscriptions.
 *
 * A span opens when the attributed interaction leaves `'idle'` and closes when it
 * returns to `'idle'` (or switches to a different gesture). While open it tracks
 * the FPS floor and worst frame, so on close the span carries:
 * `interaction.kind`, `frames`, `fps.baseline` (the idle FPS just before),
 * `fps.min`, **`fps.drop`** (`baseline - min`, ≥0), `frame.max_ms`, and
 * `duration_ms`. Overlaid on the FPS metric these are the "braking markers": the
 * action, when it happened, and how much it cost. Returns an unsubscribe.
 */
export function createInteractionTracer(
  bus: CanvasEventBus,
  tracer: Tracer,
  opts: InteractionTracerOptions = {},
): () => void {
  const prefix = opts.prefix ?? 'canvas.interaction.';

  let activeKind: InteractionKind = 'idle';
  let span: TraceSpan | undefined;
  let startTs = 0;
  let frames = 0;
  let minFps = Infinity;
  let maxDt = 0;
  let baselineFps = 0;
  /** FPS of the most recent idle frame — the pre-gesture reference. */
  let lastIdleFps = 0;

  const closeSpan = (endTs: number): void => {
    if (!span) return;
    span.setAttribute('canvas.interaction.kind', activeKind);
    span.setAttribute('canvas.frames', frames);
    span.setAttribute('canvas.fps.baseline', Math.round(baselineFps));
    const min = minFps === Infinity ? 0 : Math.round(minFps);
    span.setAttribute('canvas.fps.min', min);
    span.setAttribute('canvas.fps.drop', Math.max(0, Math.round(baselineFps) - min));
    span.setAttribute('canvas.frame.max_ms', Math.round(maxDt * 100) / 100);
    span.setAttribute('canvas.duration_ms', Math.round((endTs - startTs) * 100) / 100);
    span.end();
    span = undefined;
  };

  const openSpan = (kind: InteractionKind, ts: number): void => {
    startTs = ts;
    frames = 0;
    minFps = Infinity;
    maxDt = 0;
    baselineFps = lastIdleFps;
    span = tracer.startSpan(prefix + kind);
  };

  return bus.on('render:loop:tick', (t: FrameTick) => {
    if (t.interaction !== activeKind) {
      // Gesture boundary: close the old span, open a new one (unless now idle).
      if (span) closeSpan(t.ts);
      if (t.interaction !== 'idle') openSpan(t.interaction, t.ts);
      activeKind = t.interaction;
    }
    if (t.interaction === 'idle') {
      lastIdleFps = t.fps;
      return;
    }
    // Accumulate the dip while the gesture is live.
    frames += 1;
    if (t.fps < minFps) minFps = t.fps;
    if (t.dt > maxDt) maxDt = t.dt;
  });
}

/**
 * A dep-free reference {@link Meter} that logs each record/add — for debugging,
 * tests, or a console-only harness. Not for production export.
 */
export function createConsoleMeter(
  log: (name: string, value: number, attrs: MetricAttributes) => void = (n, v, a) =>
    console.debug(`metric ${n}=${v}`, a),
): Meter {
  return {
    createHistogram(name) {
      return { record: (value, attributes = {}) => log(name, value, attributes) };
    },
    createCounter(name) {
      return { add: (value, attributes = {}) => log(name, value, attributes) };
    },
  };
}

/** One buffered metric record shipped by {@link createHttpMeter}. */
export interface HttpMetricRecord {
  /** Instrument name, e.g. `canvas.frame.phase`. */
  name: string;
  /** Recorded value (histogram) or increment (counter). */
  value: number;
  /** Bounded-cardinality attributes, e.g. `{ interaction, phase }`. */
  attrs: MetricAttributes;
}

/** Options for {@link createHttpMeter}. */
export interface HttpMeterOptions {
  /** Max time (ms) a record waits before its batch is POSTed. Default `1000`. */
  batchMs?: number;
  /** Force a flush once the buffer reaches this many records. Default `600`. */
  maxBatch?: number;
}

/**
 * A dep-free {@link Meter} that **batches every record and POSTs it as JSON** to
 * an HTTP endpoint — the local counterpart to the OTLP exporter. Where
 * `createConsoleMeter` prints and the OTLP meter ships aggregated protobuf to a
 * collector, this ships the **raw per-record stream** (`[{ name, value, attrs }]`)
 * to any plain HTTP sink, so a lightweight collector can write it to a file for
 * offline inspection with **no OpenTelemetry backend required**.
 *
 * Wire it through the normal telemetry config —
 * `telemetry: { metrics: { meter: createHttpMeter('http://localhost:4319/metrics') } }`
 * — so it rides the exact same {@link createFrameMetrics} path as OTLP; only the
 * destination differs.
 *
 * Fire-and-forget (`fetch` failures are swallowed) and self-scheduling (a single
 * `setTimeout` per batch window, cleared when the stream goes idle — no leaked
 * interval). No-ops gracefully where `fetch` / timers are unavailable.
 */
export function createHttpMeter(endpoint: string, opts: HttpMeterOptions = {}): Meter {
  const batchMs = opts.batchMs ?? 1000;
  const maxBatch = opts.maxBatch ?? 600;
  const post =
    typeof fetch === 'function'
      ? (records: HttpMetricRecord[]): void => {
          void fetch(endpoint, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(records),
          }).catch(() => {});
        }
      : (): void => {};

  let buffer: HttpMetricRecord[] = [];
  let scheduled = false;
  const flush = (): void => {
    scheduled = false;
    if (buffer.length === 0) return;
    const batch = buffer;
    buffer = [];
    post(batch);
  };
  const schedule = (): void => {
    if (scheduled || typeof setTimeout !== 'function') return;
    scheduled = true;
    setTimeout(flush, batchMs);
  };
  const push = (name: string, value: number, attrs: MetricAttributes): void => {
    buffer.push({ name, value, attrs });
    if (buffer.length >= maxBatch) flush();
    else schedule();
  };

  return {
    createHistogram(name) {
      return { record: (value, attributes = {}) => push(name, value, attributes) };
    },
    createCounter(name) {
      return { add: (value, attributes = {}) => push(name, value, attributes) };
    },
  };
}
