/**
 * EventEmitter - Simple typed event emitter
 */

export type EventCallback<T = unknown> = (data: T) => void;

export class EventEmitter<TEvents extends object> {
  private readonly listeners: Map<keyof TEvents, Set<EventCallback<unknown>>> = new Map();

  /**
   * Subscribe to an event
   */
  on<K extends keyof TEvents>(event: K, callback: EventCallback<TEvents[K]>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as EventCallback<unknown>);

    return () => this.off(event, callback);
  }

  /**
   * Subscribe to an event (once)
   */
  once<K extends keyof TEvents>(event: K, callback: EventCallback<TEvents[K]>): () => void {
    const wrapper = (data: TEvents[K]) => {
      this.off(event, wrapper);
      callback(data);
    };
    return this.on(event, wrapper);
  }

  /**
   * Unsubscribe from an event
   */
  off<K extends keyof TEvents>(event: K, callback: EventCallback<TEvents[K]>): void {
    this.listeners.get(event)?.delete(callback as EventCallback<unknown>);
  }

  /**
   * Emit an event
   */
  emit<K extends keyof TEvents>(event: K, data: TEvents[K]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      for (const callback of callbacks) {
        callback(data);
      }
    }
  }

  /**
   * Remove all listeners for an event (or all events if no event specified)
   */
  removeAllListeners(event?: keyof TEvents): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get listener count for an event
   */
  listenerCount(event: keyof TEvents): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}
