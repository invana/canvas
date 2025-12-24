/**
 * Event Emitter - Simple pub/sub pattern
 */

export type EventHandler<T = unknown> = (data: T) => void;

export class EventEmitter {
  private _handlers: Map<string, EventHandler[]> = new Map();

  /**
   * Subscribe to an event
   */
  on<T = unknown>(event: string, handler: EventHandler<T>): () => void {
    const handlers = this._handlers.get(event) ?? [];
    handlers.push(handler as EventHandler);
    this._handlers.set(event, handlers);

    // Return unsubscribe function
    return () => this.off(event, handler);
  }

  /**
   * Subscribe to an event (fires only once)
   */
  once<T = unknown>(event: string, handler: EventHandler<T>): () => void {
    const wrapper: EventHandler<T> = (data) => {
      this.off(event, wrapper);
      handler(data);
    };
    return this.on(event, wrapper);
  }

  /**
   * Unsubscribe from an event
   */
  off<T = unknown>(event: string, handler: EventHandler<T>): void {
    const handlers = this._handlers.get(event);
    if (!handlers) return;

    const index = handlers.indexOf(handler as EventHandler);
    if (index >= 0) {
      handlers.splice(index, 1);
    }
  }

  /**
   * Emit an event
   */
  emit<T = unknown>(event: string, data?: T): void {
    const handlers = this._handlers.get(event);
    if (!handlers) return;

    for (const handler of [...handlers]) {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in event handler for "${event}":`, error);
      }
    }
  }

  /**
   * Remove all handlers for an event
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this._handlers.delete(event);
    } else {
      this._handlers.clear();
    }
  }

  /**
   * Get listener count for an event
   */
  listenerCount(event: string): number {
    return this._handlers.get(event)?.length ?? 0;
  }
}
