/**
 * `BehaviourRegistry` — stores Behaviours and toggles their enabled state.
 *
 * Architecture: see `architecture-proposal.md` §2.2.
 *
 * **Responsibilities**
 *   - `register` / `unregister` (with register / destroy lifecycle).
 *   - `setEnabled(id, enabled)` — toggles + fires `'behaviour:enabled'` /
 *     `'behaviour:disabled'`.
 *   - Typed `get<T>(id)`.
 *   - **Gesture-conflict warning**: when two enabled behaviours claim the same
 *     `shortcut`, log a `console.warn`. Doesn't enforce — the developer
 *     decides whether two behaviours can coexist on the same gesture.
 */

import type { CanvasContext } from '../context/CanvasContext';
import type { CanvasEventBus } from '../events/CanvasEventBus';
import type { IBehaviour } from '../behaviours/Behaviour';

export interface BehaviourRegistryOptions {
  getContext: () => CanvasContext | undefined;
  bus: CanvasEventBus;
}

export class BehaviourRegistry {
  private readonly behaviours: Map<string, IBehaviour> = new Map();
  private readonly getContext: () => CanvasContext | undefined;
  private readonly bus: CanvasEventBus;

  constructor(opts: BehaviourRegistryOptions) {
    this.getContext = opts.getContext;
    this.bus = opts.bus;
  }

  get size(): number {
    return this.behaviours.size;
  }

  /**
   * Register a Behaviour. Wires it (`behaviour.register(ctx)` + events) now if
   * the Canvas is initialised; otherwise it's stored and wired later by
   * `registerAll()` (called by `Canvas.init`). Throws on duplicate id.
   */
  register(behaviour: IBehaviour): void {
    if (this.behaviours.has(behaviour.id)) {
      throw new Error(`BehaviourRegistry: behaviour "${behaviour.id}" already registered`);
    }
    this.behaviours.set(behaviour.id, behaviour);
    const ctx = this.getContext();
    if (ctx) this.wire(behaviour, ctx);
  }

  /** Wire every not-yet-registered behaviour. Called by `Canvas.init` (after layers mount). */
  registerAll(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    for (const behaviour of this.behaviours.values()) {
      if (!behaviour.isRegistered) this.wire(behaviour, ctx);
    }
  }

  /** `behaviour.register(ctx)` + the registered/enabled events. */
  private wire(behaviour: IBehaviour, ctx: CanvasContext): void {
    behaviour.register(ctx);
    this.bus.emit('behaviour:registered', { id: behaviour.id });
    if (behaviour.enabled) {
      this.bus.emit('behaviour:enabled', { id: behaviour.id });
      this.warnOnShortcutConflict(behaviour);
    }
  }

  /** Remove a behaviour. Calls `destroy()`. No-op if not registered. */
  unregister(id: string): void {
    const b = this.behaviours.get(id);
    if (!b) return;
    if (b.enabled) {
      b.disable();
      this.bus.emit('behaviour:disabled', { id });
    }
    this.behaviours.delete(id);
    b.destroy();
  }

  /** Enable / disable a behaviour. Fires the corresponding bus event. */
  setEnabled(id: string, enabled: boolean): void {
    const b = this.behaviours.get(id);
    if (!b) return;
    if (b.enabled === enabled) return;
    if (enabled) {
      b.enable();
      this.bus.emit('behaviour:enabled', { id });
      this.warnOnShortcutConflict(b);
    } else {
      b.disable();
      this.bus.emit('behaviour:disabled', { id });
    }
  }

  get<T extends IBehaviour = IBehaviour>(id: string): T | undefined {
    return this.behaviours.get(id) as T | undefined;
  }

  has(id: string): boolean {
    return this.behaviours.has(id);
  }

  list(): readonly IBehaviour[] {
    return Array.from(this.behaviours.values());
  }

  /** Tear down all behaviours. Called on Canvas destroy. */
  clear(): void {
    for (const id of [...this.behaviours.keys()]) this.unregister(id);
  }

  // ─── Conflict detection ──────────────────────────────────────────────────

  private warnOnShortcutConflict(b: IBehaviour): void {
    if (!b.shortcuts || b.shortcuts.length === 0) return;
    for (const peer of this.behaviours.values()) {
      if (peer === b) continue;
      if (!peer.enabled || !peer.shortcuts) continue;
      for (const gesture of b.shortcuts) {
        if (peer.shortcuts.includes(gesture)) {
          // eslint-disable-next-line no-console
          console.warn(
            `[canvas] Behaviour "${b.id}" claims gesture "${gesture}" already used by enabled behaviour "${peer.id}". Disable one before enabling the other.`,
          );
        }
      }
    }
  }
}
