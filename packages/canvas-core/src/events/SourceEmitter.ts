import type { CanvasEventBus } from './CanvasEventBus';
import type { EventSource } from './CanvasEvent';
import { EventEmitter } from './EventEmitter';

/**
 * A scoped {@link EventEmitter} stamped with an {@link EventSource}. When connected
 * to a bus via {@link setBus}, every emit is **also** forwarded to the bus tap as a
 * structured envelope — so a store/layer/behaviour's own events reach the
 * canvas-wide tap (telemetry / collaboration) without each one re-plumbing.
 *
 * Local `on(...)` subscribers still get the raw typed payload as usual.
 */
export class SourceEmitter<M extends object> extends EventEmitter<M> {
  private bus: CanvasEventBus | null = null;

  constructor(public readonly source: EventSource) {
    super();
  }

  /** Connect (or disconnect with `null`) this emitter's stream to a bus tap. */
  setBus(bus: CanvasEventBus | null): void {
    this.bus = bus;
  }

  override emit<K extends keyof M>(type: K, payload: M[K]): void {
    super.emit(type, payload);
    this.bus?.publish(type as string, payload, this.source);
  }
}
