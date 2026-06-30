/** Who emitted an event. */
export type EventSourceKind = 'canvas' | 'layer' | 'behaviour' | 'layout' | 'store' | 'data';

/** The emitting instance — `kind` + its id. */
export interface EventSource {
  kind: EventSourceKind;
  id: string;
}

/**
 * A structured event envelope as seen on the **tap** channel: the type, a
 * timestamp, the source instance, and the payload. One tap subscriber reading
 * these reconstructs the whole loop (input → state change → render) for telemetry
 * and collaboration.
 */
export interface CanvasEvent<P = unknown> {
  type: string;
  timestamp: number;
  source: EventSource;
  payload: P;
}

/** The default source for bus-level emits with no explicit origin. */
export const CANVAS_SOURCE: EventSource = { kind: 'canvas', id: 'canvas' };
