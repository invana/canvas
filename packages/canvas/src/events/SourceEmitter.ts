/**
 * `SourceEmitter` — typed event emitter that auto-forwards every emit to a
 * `CanvasEventBus.tap()` channel as a structured envelope.
 *
 * Architecture: see `architecture-proposal.md` §2.5.
 *
 * Each source (a `Layer`, a `Behaviour`, a `Layout`, the `Canvas` itself)
 * holds one of these. Local subscribers see the plain payload (`on(name, fn)`);
 * the bus's tap subscribers see the envelope (`{ type, timestamp, source, payload }`).
 *
 * The forward path is a single method call (`bus.publish(envelope)`). Tap
 * filtering (exclude / sampleRate) lives in the bus, not here, so the emit
 * cost stays constant whether 0 or 100 taps are subscribed.
 *
 * In dev, payloads are run through `assertSerialisableInDev` so violations
 * surface immediately with the offending path.
 *
 * @example
 * class GraphLayer {
 *   readonly events: SourceEmitter<{ 'node:click': { id: string } }>;
 *
 *   constructor(id: string, ctx: CanvasContext) {
 *     this.events = new SourceEmitter({ kind: 'layer', id }, ctx.events);
 *   }
 *
 *   onShapeClick(id: string) {
 *     // local handlers + bus tap, both fired:
 *     this.events.emit('node:click', { id });
 *   }
 * }
 */

import { EventEmitter } from './EventEmitter';
import type { EventHandler, EventMap } from './EventEmitter';
import type { CanvasEventBus } from './CanvasEventBus';
import type { EventSource } from './CanvasEvent';
import { makeCanvasEvent } from './CanvasEvent';
import { assertSerialisableInDev } from './assertSerialisable';

export class SourceEmitter<E extends EventMap = EventMap> extends EventEmitter<E> {
  /**
   * @param source — `{ kind: 'layer' | 'behaviour' | 'layout' | 'canvas', id }`.
   *   Identity of this emitter; used as the `source` field of each envelope.
   * @param bus — Optional. When present, every `emit()` also publishes a
   *   `CanvasEvent` envelope to this bus's tap channel. Pass `undefined`
   *   for emitters that should be local-only (rare; mostly tests).
   */
  private bus?: CanvasEventBus;

  constructor(private readonly source: EventSource, bus?: CanvasEventBus) {
    super();
    this.bus = bus;
  }

  /**
   * Attach (or detach) the bus this emitter forwards to.
   *
   * Use case: a `Layer` is constructed before it knows which `Canvas` it'll be
   * mounted on. The Layer creates its `SourceEmitter` upfront with no bus,
   * then `mount(ctx)` calls `events.setBus(ctx.events)` to start forwarding.
   * Pass `undefined` to detach (e.g. on unmount).
   */
  setBus(bus: CanvasEventBus | undefined): void {
    this.bus = bus;
  }

  /**
   * Emit to local subscribers AND publish to the bus's tap channel.
   * Order: local handlers run first (synchronous, in registration order),
   * then the envelope is published. A throwing local handler is caught
   * (logged via `console.error` per `EventEmitter`) and does not block the
   * tap publish.
   */
  emit<K extends keyof E>(event: K, payload: E[K]): void {
    // Dev-mode serialisability check. Stripped in production builds.
    assertSerialisableInDev(payload, `emit('${String(event)}')`);

    // Local subscribers — clean payload.
    super.emit(event, payload);

    // Bus tap — envelope.
    if (this.bus !== undefined) {
      this.bus.publish(makeCanvasEvent(this.source, String(event), payload));
    }
  }

  /** Convenience: source identity (read-only). */
  get sourceInfo(): EventSource {
    return this.source;
  }
}

// Re-export types so consumers can import in one line.
export type { EventHandler, EventMap };
