/**
 * Base class for all canvas events.
 * Every event emitted on the EventBus extends this class.
 */
export class CanvasEvent {
  /** The event type string (e.g. `'canvas:clicked'`, `'shape:click'`) */
  readonly type: string;

  /** Unix timestamp (ms) when the event was created */
  readonly timestamp: number;

  /** Set to true if a listener called stopPropagation() */
  propagationStopped = false;

  /** Set to true if a listener called preventDefault() */
  defaultPrevented = false;

  constructor(type: string) {
    this.type = type;
    this.timestamp = Date.now();
  }

  /** Prevent further listeners from being called for this event */
  stopPropagation(): void {
    this.propagationStopped = true;
  }

  /** Signal that the default action should be suppressed */
  preventDefault(): void {
    this.defaultPrevented = true;
  }
}
