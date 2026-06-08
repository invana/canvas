/**
 * `Behaviour` — input subscriber that translates user input into state mutations.
 *
 * Architecture: see `architecture-proposal.md` §2.2.
 *
 * Behaviours own neither rendering output nor source-of-truth data. They
 * subscribe to layer events (`'node:hover'`, `'shape:click'`) or canvas events
 * (`'pointerdown'`) and mutate the appropriate `state` slice.
 *
 * **Default `enabled: false`.** Registration wires the behaviour up; the
 * developer explicitly enables it. Matches the rule that no input behaviour
 * is auto-active (`architecture-proposal.md` §2.2 + repo CLAUDE.md rule 7).
 *
 * **`shortcuts`** is advisory metadata — used by `BehaviourRegistry` to log
 * conflict warnings when two enabled behaviours claim the same gesture
 * (e.g. lasso vs. pan both wanting `'shift+drag'`). The framework warns;
 * it does not enforce — that's the developer's job.
 */

import type { CanvasContext } from '../context/CanvasContext';

/** What `BehaviourRegistry` sees. */
export interface IBehaviour {
  readonly id: string;
  readonly enabled: boolean;
  /** `true` once `register(ctx)` has run. Lets the registry skip already-wired behaviours. */
  readonly isRegistered: boolean;
  readonly scope: 'layer' | 'canvas';
  readonly layerId?: string;
  readonly shortcuts?: readonly string[];
  register(ctx: CanvasContext): void;
  destroy(): void;
  enable(): void;
  disable(): void;
}

export interface BehaviourOptions {
  id: string;
  /**
   * Layer-scoped behaviours target a specific Layer by id. Canvas-scoped
   * behaviours have no `layerId` and `scope: 'canvas'`.
   */
  layerId?: string;
  /** Default `false` — the developer explicitly enables. */
  enabled?: boolean;
  /**
   * Gesture identifiers this behaviour claims. Used by `BehaviourRegistry`
   * for conflict warnings. Format is convention-free (`'shift+drag'`,
   * `'wheel+ctrl'`, `'rclick'`); registries match strings as-is.
   */
  shortcuts?: readonly string[];
}

export abstract class Behaviour implements IBehaviour {
  readonly id: string;
  readonly layerId?: string;
  readonly shortcuts?: readonly string[];

  /**
   * `'layer'` if `layerId` is set, otherwise `'canvas'`. Set automatically
   * from the constructor — subclasses don't need to re-declare.
   */
  readonly scope: 'layer' | 'canvas';

  protected _enabled: boolean;
  protected ctx?: CanvasContext;

  constructor(opts: BehaviourOptions) {
    this.id = opts.id;
    this.layerId = opts.layerId;
    this.scope = opts.layerId !== undefined ? 'layer' : 'canvas';
    this.shortcuts = opts.shortcuts;
    this._enabled = opts.enabled ?? false;
  }

  get enabled(): boolean {
    return this._enabled;
  }

  get isRegistered(): boolean {
    return this.ctx !== undefined;
  }

  /** Called by `BehaviourRegistry.register(behaviour)`. Subscribes to inputs. */
  register(ctx: CanvasContext): void {
    if (this.ctx !== undefined) {
      throw new Error(`Behaviour "${this.id}" already registered`);
    }
    this.ctx = ctx;
    this.onRegister(ctx);
    if (this._enabled) this.onEnable();
  }

  /** Called by `BehaviourRegistry.unregister(id)`. Drops subscriptions. */
  destroy(): void {
    if (this.ctx === undefined) return;
    const ctx = this.ctx;
    this._enabled = false;
    this.onDestroy(ctx);
    this.ctx = undefined;
  }

  enable(): void {
    if (this._enabled) return;
    this._enabled = true;
    this.onEnable();
  }

  disable(): void {
    if (!this._enabled) return;
    this._enabled = false;
    this.onDisable();
  }

  // ─── Subclass hooks ──────────────────────────────────────────────────────

  /** Subscribe to events / setup any handler resources. */
  protected abstract onRegister(ctx: CanvasContext): void;

  /** Cleanup on destroy. Default no-op. */
  protected onDestroy(_ctx: CanvasContext): void {
    /* default no-op */
  }

  /** Hook fired when the developer enables the behaviour. */
  protected onEnable(): void {
    /* default no-op */
  }

  /** Hook fired on disable. */
  protected onDisable(): void {
    /* default no-op */
  }

  /**
   * Convenience `if (!enabled) return;` for use inside event handlers
   * (without rebinding `this` cost).
   */
  protected get isEnabled(): boolean {
    return this._enabled;
  }
}
