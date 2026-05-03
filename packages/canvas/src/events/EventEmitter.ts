/**
 * Typed event emitter — generic over an event-map shape.
 *
 * Used by `Canvas`, every `Layer`, every `Behaviour`, and the `ShapesRenderer`.
 * Hard-wired to play nicely with `CanvasEventBus.tap()` (see `events/CanvasEventBus.ts`)
 * but functions standalone.
 *
 * @example
 * type GraphLayerEvents = {
 *   'node:hover': { id: string };
 *   'selection:changed': { ids: ReadonlySet<string> };
 * };
 * const events = new EventEmitter<GraphLayerEvents>();
 * const off = events.on('node:hover', ({ id }) => console.log(id));
 * events.emit('node:hover', { id: 'n-42' });
 * off();
 */

export type EventMap = Record<string, unknown>;

export type EventHandler<TPayload> = (payload: TPayload) => void;

export class EventEmitter<E extends EventMap = EventMap> {
  // Map of event name → Set of handlers. Set keeps insertion order and
  // gives O(1) add/remove. Sets are reused across emit calls; never reallocated.
  private readonly handlers: Map<keyof E, Set<EventHandler<unknown>>> = new Map();

  /**
   * Subscribe to an event. Returns an unsubscribe function for ergonomic cleanup.
   */
  on<K extends keyof E>(event: K, handler: EventHandler<E[K]>): () => void {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(handler as EventHandler<unknown>);
    return () => this.off(event, handler);
  }

  /**
   * Subscribe once. The handler fires at most once and auto-removes itself.
   * Returns an unsubscribe function in case you want to cancel before it fires.
   */
  once<K extends keyof E>(event: K, handler: EventHandler<E[K]>): () => void {
    const wrapped: EventHandler<E[K]> = (payload) => {
      this.off(event, wrapped);
      handler(payload);
    };
    return this.on(event, wrapped);
  }

  /**
   * Unsubscribe a specific handler.
   * No-op if the handler wasn't registered.
   */
  off<K extends keyof E>(event: K, handler: EventHandler<E[K]>): void {
    const set = this.handlers.get(event);
    if (!set) return;
    set.delete(handler as EventHandler<unknown>);
    if (set.size === 0) this.handlers.delete(event);
  }

  /**
   * Emit an event. Each registered handler is called synchronously in registration order.
   *
   * If a handler throws, the error is logged via `console.error` and subsequent
   * handlers still run. This prevents one buggy subscriber from breaking the
   * whole event chain. Errors are not re-thrown: subscribers should not be able
   * to crash unrelated code paths through the event bus.
   */
  emit<K extends keyof E>(event: K, payload: E[K]): void {
    const set = this.handlers.get(event);
    if (!set || set.size === 0) return;

    // Snapshot the handlers so a handler that mutates the set during iteration
    // (off/on inside a handler) doesn't break the loop.
    // Set iteration is otherwise mutation-safe in practice, but the spec is
    // permissive enough that a snapshot is the conservative choice.
    const snapshot = Array.from(set);
    for (const handler of snapshot) {
      try {
        (handler as EventHandler<E[K]>)(payload);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`[EventEmitter] handler for event "${String(event)}" threw:`, err);
      }
    }
  }

  /**
   * Remove all listeners for one event, or all events if no event is given.
   */
  removeAllListeners(event?: keyof E): void {
    if (event === undefined) {
      this.handlers.clear();
    } else {
      this.handlers.delete(event);
    }
  }

  /**
   * Number of handlers registered for an event. Useful in tests.
   */
  listenerCount(event: keyof E): number {
    return this.handlers.get(event)?.size ?? 0;
  }
}
