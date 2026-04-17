type EventHandler<T> = (payload: T) => void;

/**
 * Generic typed event emitter.
 *
 * `TMap` is a record mapping event name strings to their payload types.
 * This ensures all `on`/`emit` calls are fully type-checked at compile time.
 *
 * @example
 * ```ts
 * interface MyEvents { 'click': { x: number; y: number }; 'close': never }
 * const bus = new EventEmitter<MyEvents>();
 * bus.on('click', ({ x, y }) => console.log(x, y));
 * bus.emit('click', { x: 10, y: 20 });
 * ```
 */
export class EventEmitter<TMap extends Record<string, unknown>> {
  private _listeners: {
    [K in keyof TMap]?: Set<EventHandler<TMap[K]>>;
  } = {};

  /**
   * Subscribe to an event.
   * @param event - Event name
   * @param handler - Callback invoked with the event payload
   * @returns `this` for chaining
   */
  on<K extends keyof TMap>(event: K, handler: EventHandler<TMap[K]>): this {
    if (!this._listeners[event]) {
      this._listeners[event] = new Set();
    }
    this._listeners[event]!.add(handler);
    return this;
  }

  /**
   * Unsubscribe from an event.
   * @param event - Event name
   * @param handler - The exact function reference passed to `on`
   * @returns `this` for chaining
   */
  off<K extends keyof TMap>(event: K, handler: EventHandler<TMap[K]>): this {
    this._listeners[event]?.delete(handler);
    return this;
  }

  /**
   * Subscribe to an event for a single invocation.
   * The handler is automatically removed after the first call.
   * @param event - Event name
   * @param handler - Callback invoked once
   * @returns `this` for chaining
   */
  once<K extends keyof TMap>(event: K, handler: EventHandler<TMap[K]>): this {
    const wrapper: EventHandler<TMap[K]> = (payload) => {
      handler(payload);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  }

  /**
   * Emit an event, invoking all registered handlers synchronously.
   * @param event - Event name
   * @param payload - Data passed to every handler
   */
  emit<K extends keyof TMap>(event: K, payload: TMap[K]): void {
    this._listeners[event]?.forEach((h) => h(payload));
  }

  /**
   * Remove all listeners for a specific event, or all listeners on the emitter.
   * @param event - If provided, only listeners for this event are removed.
   *                If omitted, every listener on the emitter is cleared.
   */
  removeAllListeners(event?: keyof TMap): void {
    if (event) {
      delete this._listeners[event];
    } else {
      this._listeners = {};
    }
  }
}
