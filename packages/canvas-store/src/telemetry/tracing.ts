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

import type { LayerFlush } from '../data/LayerData';
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
  /**
   * Run `fn` with `span` as the **active parent**, so any {@link startSpan} called
   * synchronously inside `fn` auto-nests beneath it (a causal trace). Optional on the
   * port — OpenTelemetry's `Tracer` provides it; {@link traceActions} falls back to a
   * flat span when a tracer omits it. Does **not** auto-end the span (the caller does).
   */
  startActiveSpan?<T>(name: string, fn: (span: TraceSpan) => T): T;
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
 * Derive span attributes from a {@link CanvasEvent} envelope — the `source`, plus
 * the dashboard-useful fields off the kernel's well-known payload shapes:
 * `action` / `changed_paths` / `duration_ms` (view mutations), `layer_id` +
 * `ids_count` (data intents), the per-kind `data:flush` delta counts, and `id`
 * (input on an element). Defensive — only sets an attribute when the field exists,
 * so foreign / future event types degrade to just the source attributes.
 */
export function tapAttributes(ev: CanvasEvent): SpanAttributes {
  const attrs: SpanAttributes = {
    'canvas.source.kind': ev.source.kind,
    'canvas.source.id': ev.source.id,
  };
  const p = ev.payload as Record<string, unknown> | undefined;
  if (!p || typeof p !== 'object') return attrs;

  if (typeof p.action === 'string') attrs['canvas.action'] = p.action;
  if (typeof p.layerId === 'string') attrs['canvas.layer_id'] = p.layerId;
  if (typeof p.id === 'string') attrs['canvas.id'] = p.id;
  if (typeof p.durationMs === 'number') attrs['canvas.duration_ms'] = p.durationMs;
  if (Array.isArray(p.changedPaths)) attrs['canvas.changed_paths'] = (p.changedPaths as string[]).join(',');
  if (Array.isArray(p.ids)) attrs['canvas.ids_count'] = (p.ids as unknown[]).length;

  // data:flush — per-frame coalesced delta. `moved: -1` encodes movedAll (whole graph
  // moved; the kernel never enumerates it), keeping the attribute O(1).
  const delta = p.delta as LayerFlush | undefined;
  if (delta && typeof delta === 'object' && delta.nodes) {
    attrs['canvas.flush.version'] = delta.version;
    attrs['canvas.flush.nodes_added'] = delta.nodes.added.length;
    attrs['canvas.flush.nodes_changed'] = delta.nodes.changed.length;
    attrs['canvas.flush.nodes_moved'] = delta.nodes.movedAll ? -1 : delta.nodes.moved.length;
    attrs['canvas.flush.nodes_removed'] = delta.nodes.removed.length;
    attrs['canvas.flush.edges_added'] = delta.edges.added.length;
    attrs['canvas.flush.groups_added'] = delta.groups.added.length;
    attrs['canvas.flush.annotations_added'] = delta.annotations.added.length;
  }
  return attrs;
}

/**
 * Bridge the whole event **tap** stream to spans — every {@link CanvasEvent}
 * envelope becomes a span named by its `type`, attributed via {@link tapAttributes}
 * (source + payload fields). With a real OpenTelemetry tracer, each span
 * **auto-parents to the active context**, so wrapping an interaction in
 * `tracer.startActiveSpan(...)` nests the whole synchronous ripple (input →
 * `state:change` → `data:flush`) into one causal trace. Returns an unsubscribe.
 * Honours `exclude` / `sampleRate` so machine-rate types don't flood.
 */
export function createTapTracer(
  bus: CanvasEventBus,
  tracer: Tracer,
  opts: TapOptions & { prefix?: string } = {},
): () => void {
  const { prefix = '', ...tap } = opts;
  return bus.tap((ev: CanvasEvent) => {
    tracer.startSpan(prefix + ev.type, { attributes: tapAttributes(ev) }).end();
  }, tap);
}

/**
 * Set span attributes from a command's arguments — bounded, low-cardinality: a
 * scalar arg verbatim, an array's length, or an object's `id`. Enough to see *which*
 * node/layer/layout a manipulation touched without capturing whole records.
 */
function setArgAttributes(span: TraceSpan, args: readonly unknown[]): void {
  args.forEach((arg, i) => {
    if (arg === null || arg === undefined) return;
    const t = typeof arg;
    if (t === 'string' || t === 'number' || t === 'boolean') {
      span.setAttribute(`canvas.arg.${i}`, arg as SpanAttrValue);
    } else if (Array.isArray(arg)) {
      span.setAttribute(`canvas.arg.${i}.count`, arg.length);
    } else if (t === 'object') {
      const id = (arg as { id?: unknown }).id;
      if (typeof id === 'string') span.setAttribute(`canvas.arg.${i}.id`, id);
    }
  });
}

/**
 * **Decorator that traces the command API.** Wraps a {@link CanvasActions}-shaped
 * object (a `Record` of grouped methods — `node.add`, `camera.zoom`,
 * `layers.setStyle`, …) so **every call opens a span** named `<prefix><group>.<method>`,
 * captures its arguments as attributes, and (with an active-span-capable {@link Tracer})
 * runs the call as the active parent — so the mutation's whole synchronous ripple
 * (`state:change` / granular / `data:intent`, traced by {@link createTapTracer})
 * **nests beneath it** as one causal trace. This is the port-decorator idiom (cf.
 * {@link withTelemetry}) applied to the actions: query + interaction patterns become
 * traces without the caller wrapping anything.
 *
 * Returns a **new** object with the same shape (the original is untouched). Non-function
 * members and functions are wrapped; nested groups recurse.
 */
export function traceActions<A extends object>(actions: A, tracer: Tracer, opts: { prefix?: string } = {}): A {
  const prefix = opts.prefix ?? 'action:';

  const wrap = (node: Record<string, unknown>, path: string): Record<string, unknown> => {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(node)) {
      const name = path ? `${path}.${key}` : key;
      if (typeof value === 'function') {
        const method = value as (...args: unknown[]) => unknown;
        out[key] = (...args: unknown[]): unknown => {
          const invoke = (span: TraceSpan): unknown => {
            setArgAttributes(span, args);
            try {
              return method(...args);
            } finally {
              span.end();
            }
          };
          return tracer.startActiveSpan
            ? tracer.startActiveSpan(prefix + name, invoke)
            : invoke(tracer.startSpan(prefix + name));
        };
      } else if (value !== null && typeof value === 'object') {
        out[key] = wrap(value as Record<string, unknown>, name);
      } else {
        out[key] = value;
      }
    }
    return out;
  };

  return wrap(actions as Record<string, unknown>, '') as A;
}

/** A dep-free reference {@link Tracer} that logs each span on `end()`. */
export function createConsoleTracer(
  log: (name: string, attrs: SpanAttributes) => void = (n, a) => console.debug(`span ${n}`, a),
): Tracer {
  const tracer: Tracer = {
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
    startActiveSpan(name, fn) {
      return fn(tracer.startSpan(name));
    },
  };
  return tracer;
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
    startActiveSpan(name, fn) {
      return fn(tracer.startSpan(name));
    },
  };
  return { tracer, spans };
}
