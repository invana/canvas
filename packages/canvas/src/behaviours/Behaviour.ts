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
  readonly targetLayerId?: string;
  readonly shortcuts?: readonly string[];
  register(ctx: CanvasContext): void;
  destroy(): void;
  enable(): void;
  disable(): void;
  /**
   * Merge a serialisable options patch and apply it live. Every behaviour
   * supports this (the base provides a generic implementation) so the engine's
   * `canvas.update({ behaviours })` path can retune any behaviour uniformly.
   */
  setOptions(changes: Record<string, unknown>): void;
}

export interface BehaviourOptions {
  id: string;
  /**
   * Layer-scoped behaviours target a specific Layer by id. Canvas-scoped
   * behaviours have no `targetLayerId` and `scope: 'canvas'`.
   */
  targetLayerId?: string;
  /** Default `false` — the developer explicitly enables. */
  enabled?: boolean;
  /**
   * Gesture identifiers this behaviour claims. Used by `BehaviourRegistry`
   * for conflict warnings. Format is convention-free (`'shift+drag'`,
   * `'wheel+ctrl'`, `'rclick'`); registries match strings as-is.
   */
  shortcuts?: readonly string[];
}

export abstract class Behaviour<TOptions extends BehaviourOptions = BehaviourOptions>
  implements IBehaviour
{
  readonly id: string;
  readonly targetLayerId?: string;
  readonly shortcuts?: readonly string[];

  /**
   * `'layer'` if `targetLayerId` is set, otherwise `'canvas'`. Set automatically
   * from the constructor — subclasses don't need to re-declare.
   */
  readonly scope: 'layer' | 'canvas';

  protected _enabled: boolean;
  protected ctx?: CanvasContext;

  /**
   * The construction options, merged in-place by {@link setOptions}. Named
   * `_options` (not `options`) so subclasses that expose a bespoke
   * `get options()` snapshot don't collide with it. Subclasses read their live
   * config from here (or from fields re-synced in {@link onOptionsChanged}).
   */
  protected _options: TOptions;

  constructor(opts: TOptions) {
    this.id = opts.id;
    this.targetLayerId = opts.targetLayerId;
    this.scope = opts.targetLayerId !== undefined ? 'layer' : 'canvas';
    this.shortcuts = opts.shortcuts;
    this._enabled = opts.enabled ?? false;
    this._options = opts;
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

  /**
   * Merge a serialisable options patch and apply it live. Reflects an `enabled`
   * change by enabling/disabling, then calls {@link onOptionsChanged} so the
   * subclass can apply the rest (re-sync cached fields, re-arm a viewport
   * plugin, recompute). This is the seam the engine's
   * `canvas.update({ behaviours: { [id]: patch } })` path invokes — so a settings
   * editor can retune any behaviour without remounting it.
   *
   * Subclasses with bespoke apply logic (e.g. clearing selection state on a
   * mode change) override this and should call `super.setOptions(changes)` first
   * to keep `_options` — and thus {@link getOptions} — coherent.
   */
  setOptions(changes: Partial<TOptions>): void {
    this._options = { ...this._options, ...changes };
    if (changes.enabled !== undefined) {
      if (changes.enabled) this.enable();
      else this.disable();
    }
    this.onOptionsChanged(changes);
  }

  /** Snapshot of the current (merged) options — seeds a settings editor. */
  getOptions(): Readonly<TOptions> {
    return this._options;
  }

  /**
   * Contribute this behaviour's serialisable config to a canvas-state snapshot
   * (the engine's `DefinitionSerializable` contract). The base implementation
   * captures the explicit `enabled` flag (rule 7). Subclasses with additional
   * JSON-serialisable options should override and spread `super.serializeDefinition()`.
   */
  serializeDefinition(): Record<string, unknown> | undefined {
    return { enabled: this._enabled };
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
   * Hook fired after {@link setOptions} merges a patch (and after any `enabled`
   * toggle is applied). Default no-op. Override to apply an option change live:
   * a behaviour whose effect is wired in {@link onEnable} (a pixi-viewport
   * plugin, a DOM listener) re-arms here; one that caches option values in
   * fields re-syncs them from `this._options` here. `changes` is the raw patch;
   * `this._options` already holds the merged result.
   */
  protected onOptionsChanged(_changes: Partial<TOptions>): void {
    /* default no-op */
  }

  /**
   * Convenience `if (!enabled) return;` for use inside event handlers
   * (without rebinding `this` cost).
   */
  protected get isEnabled(): boolean {
    return this._enabled;
  }

  /**
   * Re-run {@link onDisable} then {@link onEnable} when the behaviour is live, so
   * an option change wired at enable-time (a pixi-viewport plugin, a listener
   * bound with the old config) picks up `this._options`. No-op when disabled or
   * unregistered (the next {@link onEnable} will read the fresh options anyway).
   * The idiomatic body of an {@link onOptionsChanged} override for such
   * behaviours.
   */
  protected reArm(): void {
    if (this._enabled && this.ctx !== undefined) {
      this.onDisable();
      this.onEnable();
    }
  }
}
