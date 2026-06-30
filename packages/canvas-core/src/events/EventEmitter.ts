/** A typed listener for one event payload. */
export type Listener<P> = (payload: P) => void;

/**
 * A small typed event emitter over an event map `M` (`{ eventType: payload }`).
 * Renderer-free; the base for {@link SourceEmitter} and the building block under
 * {@link CanvasEventBus}.
 */
export class EventEmitter<M extends object> {
  private readonly map = new Map<keyof M, Set<Listener<unknown>>>();

  /** Subscribe; returns an unsubscribe. */
  on<K extends keyof M>(type: K, listener: Listener<M[K]>): () => void {
    let set = this.map.get(type);
    if (!set) {
      set = new Set();
      this.map.set(type, set);
    }
    set.add(listener as Listener<unknown>);
    return () => this.off(type, listener);
  }

  /** Subscribe for a single emission. */
  once<K extends keyof M>(type: K, listener: Listener<M[K]>): () => void {
    const off = this.on(type, (payload) => {
      off();
      listener(payload);
    });
    return off;
  }

  /** Unsubscribe a listener. */
  off<K extends keyof M>(type: K, listener: Listener<M[K]>): void {
    this.map.get(type)?.delete(listener as Listener<unknown>);
  }

  /** Emit to all listeners of `type` (snapshot, so handlers may unsubscribe). */
  emit<K extends keyof M>(type: K, payload: M[K]): void {
    const set = this.map.get(type);
    if (!set) return;
    for (const l of [...set]) (l as Listener<M[K]>)(payload);
  }

  removeAllListeners(): void {
    this.map.clear();
  }

  listenerCount<K extends keyof M>(type: K): number {
    return this.map.get(type)?.size ?? 0;
  }
}
