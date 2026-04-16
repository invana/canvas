type EventHandler<T> = (payload: T) => void;

/** Typed event emitter. TMap maps event name → payload type. */
export class EventEmitter<TMap extends Record<string, unknown>> {
  private _listeners: {
    [K in keyof TMap]?: Set<EventHandler<TMap[K]>>;
  } = {};

  on<K extends keyof TMap>(event: K, handler: EventHandler<TMap[K]>): this {
    if (!this._listeners[event]) {
      this._listeners[event] = new Set();
    }
    this._listeners[event]!.add(handler);
    return this;
  }

  off<K extends keyof TMap>(event: K, handler: EventHandler<TMap[K]>): this {
    this._listeners[event]?.delete(handler);
    return this;
  }

  once<K extends keyof TMap>(event: K, handler: EventHandler<TMap[K]>): this {
    const wrapper: EventHandler<TMap[K]> = (payload) => {
      handler(payload);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  }

  emit<K extends keyof TMap>(event: K, payload: TMap[K]): void {
    this._listeners[event]?.forEach((h) => h(payload));
  }

  removeAllListeners(event?: keyof TMap): void {
    if (event) {
      delete this._listeners[event];
    } else {
      this._listeners = {};
    }
  }
}
