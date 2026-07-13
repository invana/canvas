/**
 * Logging adapters — turn the kernel's event stream into structured **logs**,
 * without the kernel taking a logging-vendor dependency. Sibling of `tracing.ts`
 * (spans) and `metrics.ts` (metrics): you inject a {@link Logger}; the concrete
 * adapter (`@invana/canvas-telemetry-otel`) maps it onto OTel logs, and
 * {@link createConsoleLogger} is the dep-free default so the `logging` toggle
 * works out of the box with zero extra installs.
 *
 * {@link createLogBridge} taps the bus and emits a {@link LogRecord} for the
 * **lifecycle-worthy** events (scene composition, layout runs, renderer
 * lifecycle, theme, drops) — deliberately *not* the per-frame / per-input
 * firehose (`render:loop:tick`, `data:flush`, `input:*` below `debug`), so the
 * log stays a readable audit trail rather than noise. A `level` filter gates it.
 */

import type { CanvasEvent } from '../events/CanvasEvent';
import type { CanvasEventBus, TapOptions } from '../events/CanvasEventBus';

/** Log severities, low → high. */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** Numeric ordering for {@link LogLevel} threshold comparisons. */
const LEVEL_RANK: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

/** Log attribute values (the OpenTelemetry-compatible subset). */
export type LogAttributes = Record<string, string | number | boolean>;

/** One structured log record. */
export interface LogRecord {
  level: LogLevel;
  /** Human-readable message — here, the event `type`. */
  message: string;
  /** Bounded, low-cardinality context. */
  attributes?: LogAttributes;
  /** Emit time (ms). */
  ts: number;
}

/**
 * Minimal logger port. The kernel keeps **no** logging-vendor dependency; inject
 * a real one (or use {@link createConsoleLogger}). Unlike the tracer/meter ports
 * this is not structurally an OTel type — the OTel *logs* SDK has a different
 * shape, so the `@invana/canvas-telemetry-otel` adapter maps this → OTel.
 */
export interface Logger {
  log(record: LogRecord): void;
}

/** Per-event-type log level. Unlisted types default to `debug` (filtered out at the default threshold). */
const LEVEL_BY_TYPE: Record<string, LogLevel> = {
  'canvas:renderer:fallback': 'error',
  'tap:dropped': 'warn',
  'canvas:renderer:ready': 'info',
  'scene:layer:add': 'info',
  'scene:layer:remove': 'info',
  'scene:layer:visibilitychange': 'info',
  'scene:behaviour:register': 'info',
  'scene:behaviour:enable': 'info',
  'scene:behaviour:disable': 'info',
  'scene:layout:add': 'info',
  'scene:layout:remove': 'info',
  'layout:run:start': 'info',
  'layout:run:end': 'info',
  'theme:change': 'info',
};

/**
 * Per-frame / per-tick / high-frequency event types the log bridge never emits —
 * they are the metrics/trace domain, not an audit log. Always excluded regardless
 * of level.
 */
const NEVER_LOG = new Set<string>(['render:loop:tick', 'data:flush', 'layout:run:tick']);

/** Derive bounded log attributes from an event envelope (source + a few payload ids). */
function logAttributes(ev: CanvasEvent): LogAttributes {
  const attrs: LogAttributes = {
    'canvas.source.kind': ev.source.kind,
    'canvas.source.id': ev.source.id,
  };
  const p = ev.payload as Record<string, unknown> | undefined;
  if (p && typeof p === 'object') {
    if (typeof p.id === 'string') attrs['canvas.id'] = p.id;
    if (typeof p.layerId === 'string') attrs['canvas.layer_id'] = p.layerId;
    if (typeof p.action === 'string') attrs['canvas.action'] = p.action;
    if (typeof p.reason === 'string') attrs['canvas.reason'] = p.reason;
    if (typeof p.visible === 'boolean') attrs['canvas.visible'] = p.visible;
  }
  return attrs;
}

/**
 * Bridge the event **tap** stream to structured logs. Each lifecycle-worthy
 * {@link CanvasEvent} at or above `opts.level` (default `'info'`) becomes a
 * {@link LogRecord} named by its `type`. High-frequency types are always
 * dropped. Honours `exclude` / `sampleRate` and returns an unsubscribe.
 */
export function createLogBridge(
  bus: CanvasEventBus,
  logger: Logger,
  opts: TapOptions & { level?: LogLevel; now?: () => number } = {},
): () => void {
  const { level = 'info', now, ...tap } = opts;
  const threshold = LEVEL_RANK[level];
  const clock = now ?? (() => (typeof performance !== 'undefined' ? performance.now() : Date.now()));
  return bus.tap((ev: CanvasEvent) => {
    if (NEVER_LOG.has(ev.type)) return;
    const evLevel = LEVEL_BY_TYPE[ev.type] ?? 'debug';
    if (LEVEL_RANK[evLevel] < threshold) return;
    logger.log({ level: evLevel, message: ev.type, attributes: logAttributes(ev), ts: clock() });
  }, tap);
}

/** A dep-free reference {@link Logger} that routes to the matching `console` method. */
export function createConsoleLogger(
  sink: Pick<Console, 'debug' | 'info' | 'warn' | 'error'> = console,
): Logger {
  return {
    log(r) {
      const fn = r.level === 'debug' ? sink.debug : r.level === 'info' ? sink.info : r.level === 'warn' ? sink.warn : sink.error;
      fn(`[canvas] ${r.message}`, r.attributes ?? {});
    },
  };
}

/** An in-memory {@link Logger} that collects records — for tests / a debug overlay. */
export function createCollectorLogger(): { logger: Logger; records: LogRecord[] } {
  const records: LogRecord[] = [];
  return { logger: { log: (r) => records.push(r) }, records };
}
