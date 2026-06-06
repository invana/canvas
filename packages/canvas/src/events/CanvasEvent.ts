/**
 * Telemetry envelope for events crossing into the canvas-wide tap channel.
 *
 * Architecture: see `architecture-proposal.md` §2.5.
 *
 * Two channels coexist:
 *   - **Typed events** — clean payloads on the emitter you care about
 *     (`canvas.events.on('camera:zoom', ...)`, `graphLayer.events.on('node:click', ...)`).
 *   - **Tap channel** — a single firehose receiving an envelope for every event
 *     emitted system-wide (`canvas.events.tap(handler)`). Telemetry sinks subscribe here.
 *
 * App code uses the first; observability uses the second.
 *
 * Type strings follow `<source-kind>:<source-id>:<event-name>` so a tap subscriber
 * can filter without inspecting `source` (e.g. `'layer:graph:node:click'`).
 */

export type EventSourceKind = 'canvas' | 'layer' | 'behaviour' | 'layout' | 'store';

export interface EventSource {
  readonly kind: EventSourceKind;
  readonly id: string;
}

export interface CanvasEvent<TPayload = unknown> {
  readonly type: string; // e.g. 'layer:graph:node:click'
  readonly timestamp: number; // performance.now()
  readonly source: EventSource;
  readonly payload: TPayload;
}

/**
 * Build a `<source-kind>:<source-id>:<event-name>` envelope-type string.
 * Centralised so the convention can't drift.
 */
export function makeEventType(source: EventSource, name: string): string {
  return `${source.kind}:${source.id}:${name}`;
}

/**
 * Construct a CanvasEvent envelope. The source is captured by reference, but the
 * caller is expected to honour the rule that source ids are immutable for the
 * lifetime of the source — so reading the envelope's `source.id` later is safe.
 */
export function makeCanvasEvent<TPayload>(
  source: EventSource,
  name: string,
  payload: TPayload,
): CanvasEvent<TPayload> {
  return {
    type: makeEventType(source, name),
    timestamp: performance.now(),
    source,
    payload,
  };
}

/**
 * Default exclude list for the tap channel.
 *
 * High-frequency events that would flood telemetry without adding signal.
 * Consumers can override per `tap()` registration:
 *   `canvas.events.tap(fn, { exclude: [] })` — see everything.
 *   `canvas.events.tap(fn, { exclude: ['canvas:camera:zoom'] })` — explicit override.
 *
 * The strings are matched as **suffixes** of the envelope `type` so we don't
 * have to enumerate every layer instance. `'pointermove'` excludes
 * `'layer:graph-1:shape:pointermove'`, `'layer:er-7:shape:pointermove'`, …
 */
export const DEFAULT_TAP_EXCLUDE: readonly string[] = Object.freeze([
  'pointermove',
  'render:tick',
  'shape:pointermove',
  'connector:pointermove',
  'state:dirty-flush',
]);

/**
 * Returns true if the given envelope type should be excluded from the tap
 * channel under the supplied exclude list. Exclusion is suffix-based so
 * source-id variations don't require enumerating every emitter.
 */
export function isExcludedFromTap(
  type: string,
  exclude: readonly string[] = DEFAULT_TAP_EXCLUDE,
): boolean {
  for (const pattern of exclude) {
    if (type.endsWith(pattern)) return true;
  }
  return false;
}
