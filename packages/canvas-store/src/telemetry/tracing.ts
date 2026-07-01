/**
 * Tracing adapters — turn the kernel's observability streams into **spans**,
 * without the kernel taking an OpenTelemetry dependency. You inject a
 * {@link Tracer}; a real OpenTelemetry `Tracer` **structurally satisfies** it
 * (`trace.getTracer('canvas')`), so the "concrete OTel adapter" is just:
 *
 * ```ts
 * import { trace } from '@opentelemetry/api';
 * const tracer = trace.getTracer('canvas');
 * const store = createCanvasStore({ telemetry: createTracingSink(tracer) }); // view updates → spans
 * const off = createTapTracer(store.events, tracer);                          // whole event loop → spans
 * ```
 *
 * Two channels, two granularities (see `canvas-state-plan.md` §8):
 * - {@link createTracingSink} — one span per **`view` update** (action-labelled,
 *   with the patch diff + `durationMs`). Scoped to `view`, never the data hot path.
 * - {@link createTapTracer} — one span per **bus event** (input / state / data /
 *   scene / layout / render), with `exclude` / `sampleRate` so machine-rate types
 *   can be filtered or sampled.
 *
 * {@link createConsoleTracer} + {@link createCollectorTracer} are dep-free
 * reference tracers for debugging / tests / the playground.
 */

import type { CanvasEvent } from '../events/CanvasEvent';
import type { CanvasEventBus, TapOptions } from '../events/CanvasEventBus';
import type { TelemetryEvent, TelemetrySink } from './withTelemetry';

/** Attribute value types a span accepts (the OpenTelemetry-compatible subset). */
export type SpanAttrValue = string | number | boolean;
export type SpanAttributes = Record<string, SpanAttrValue>;

/** Minimal span — structurally satisfied by an OpenTelemetry `Span`. */
export interface TraceSpan {
  setAttribute(key: string, value: SpanAttrValue): void;
  end(): void;
}

/**
 * Minimal tracer — structurally satisfied by an OpenTelemetry `Tracer`. Inject a
 * real one; the kernel keeps **no** OTel dependency (stays a renderer-free leaf).
 */
export interface Tracer {
  startSpan(name: string, options?: { attributes?: SpanAttributes }): TraceSpan;
}

/**
 * A {@link TelemetrySink} that emits one span per `view` update — wire it via
 * `createCanvasStore({ telemetry: createTracingSink(tracer) })`. Maps `action` →
 * span name; `changedPaths` / patch count / `durationMs` → attributes. Updates are
 * point-in-time, so the span opens and ends immediately (a marker span whose
 * `duration_ms` attribute carries the real produce+commit cost).
 */
export function createTracingSink(tracer: Tracer, opts: { prefix?: string } = {}): TelemetrySink {
  const prefix = opts.prefix ?? '';
  return {
    emit(e: TelemetryEvent): void {
      const attributes: SpanAttributes = {
        'canvas.changed_paths': e.changedPaths.join(','),
        'canvas.patch_count': e.patches.length,
      };
      if (e.durationMs !== undefined) attributes['canvas.duration_ms'] = e.durationMs;
      tracer.startSpan(prefix + e.action, { attributes }).end();
    },
  };
}

/**
 * Bridge the whole event **tap** stream to spans — every {@link CanvasEvent}
 * envelope becomes a span named by its `type`, with its `source` as attributes.
 * Returns an unsubscribe. Honours `exclude` / `sampleRate` (default
 * {@link CanvasEventBus} tap filters apply) so machine-rate types don't flood.
 */
export function createTapTracer(
  bus: CanvasEventBus,
  tracer: Tracer,
  opts: TapOptions & { prefix?: string } = {},
): () => void {
  const { prefix = '', ...tap } = opts;
  return bus.tap((ev: CanvasEvent) => {
    tracer
      .startSpan(prefix + ev.type, {
        attributes: { 'canvas.source.kind': ev.source.kind, 'canvas.source.id': ev.source.id },
      })
      .end();
  }, tap);
}

/** A dep-free reference {@link Tracer} that logs each span on `end()`. */
export function createConsoleTracer(
  log: (name: string, attrs: SpanAttributes) => void = (n, a) => console.debug(`span ${n}`, a),
): Tracer {
  return {
    startSpan(name, options) {
      const attrs: SpanAttributes = { ...(options?.attributes ?? {}) };
      return {
        setAttribute(k, v) {
          attrs[k] = v;
        },
        end() {
          log(name, attrs);
        },
      };
    },
  };
}

/** One finished span collected in memory. */
export interface CollectedSpan {
  name: string;
  attributes: SpanAttributes;
  endedAt: number;
}

/**
 * An in-memory {@link Tracer} that pushes finished spans into `spans` — for tests,
 * the playground, or a debug overlay. Not for production export.
 */
export function createCollectorTracer(
  now: () => number = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()),
): { tracer: Tracer; spans: CollectedSpan[] } {
  const spans: CollectedSpan[] = [];
  const tracer: Tracer = {
    startSpan(name, options) {
      const attributes: SpanAttributes = { ...(options?.attributes ?? {}) };
      return {
        setAttribute(k, v) {
          attributes[k] = v;
        },
        end() {
          spans.push({ name, attributes, endedAt: now() });
        },
      };
    },
  };
  return { tracer, spans };
}
