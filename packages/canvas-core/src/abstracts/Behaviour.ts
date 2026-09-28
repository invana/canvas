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
 *
 * **`modes`** ties a behaviour to the canvas's interaction mode
 * (`view.interaction.viewMode` — the modeller "tool"). An enabled behaviour with
 * `modes: ['add']` is only *live* while the mode is `'add'`: outside it the base
 * runs {@link Behaviour.onDisable} (cancelling any gesture) and back inside it
 * runs {@link Behaviour.onEnable}. `enabled` stays the developer's flag — a mode
 * switch never changes it, never fires `scene:behaviour:enable`, and never shows
 * up in {@link Behaviour.getOptions}.
 */

import type { CanvasContext } from './CanvasContext';
import type { GestureClaimOptions } from './GestureArbiter';

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
  /**
   * Replace the interaction modes this behaviour is live in (`undefined` = all).
   * The engine calls it directly for a `modes` patch, like it routes `enabled`
   * through the registry, because some behaviours override `setOptions`
   * without calling `super`.
   */
  setModes?(modes: readonly string[] | undefined): void;
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
  /**
   * Interaction modes (`view.interaction.viewMode` values) this behaviour is live
   * in. Omitted = every mode. An enabled behaviour outside its modes is
   * suspended — its `onDisable` runs, `enabled` is unchanged — and resumes when
   * the mode comes back. E.g. `modes: ['connect']` on an edge-drawing behaviour
   * makes the modeller's Connect tool switch it on and off with no host wiring.
   */
  modes?: readonly string[];
}

export abstract class Behaviour<TOptions extends BehaviourOptions = BehaviourOptions>
  implements IBehaviour
{
  readonly id: string;
  readonly targetLayerId?: string;
  readonly shortcuts?: readonly string[];

  /**
   * Stable **class kind** — a minification-safe discriminator matching the
   * `@invana/canvas-ui` settings-editor registry key (e.g. `'drag-pan'`,
   * `'wheel-zoom'`). Distinct from {@link id} (the per-instance key): all
   * `DragPanBehaviour` instances share `kind: 'drag-pan'`. Concrete behaviours
   * set it as a class field; left `undefined` on any that haven't, so consumers
   * fall back (e.g. to the class name). Lets domain-free tooling resolve an
   * instance's editor without an `instanceof` ladder.
   */
  readonly kind?: string;

  /**
   * `'layer'` if `targetLayerId` is set, otherwise `'canvas'`. Set automatically
   * from the constructor — subclasses don't need to re-declare.
   */
  readonly scope: 'layer' | 'canvas';

  /**
   * Whether the behaviour is **live**: the developer's flag ({@link enabled})
   * *and* the current interaction mode being one of {@link BehaviourOptions.modes}.
   * Subclasses gate their handlers on this (or {@link isEnabled}); only the base
   * writes it.
   */
  protected _enabled: boolean;
  protected ctx?: CanvasContext;

  /** The developer's enable flag — what {@link enabled} reports and snapshots capture. */
  private _wanted: boolean;
  /** `false` while the canvas's mode is outside {@link BehaviourOptions.modes}. */
  private _inMode = true;
  /** Releases the `viewMode` subscription, or `null` when not watching. */
  private _modeUnsub: (() => void) | null = null;

  /**
   * The construction options, merged in-place by {@link setOptions}. Named
   * `_options` (not `options`) so subclasses that expose a bespoke
   * `get options()` snapshot don't collide with it. Subclasses read their live
   * config from here (or from fields re-synced in {@link onOptionsChanged}).
   */
  protected _options: TOptions;

  /**
   * Release function for this behaviour's live gesture claim, or `null` when it
   * holds none. Held privately (not `protected`) so the only way to end a claim
   * is {@link releaseGesture} — which nulls the field *before* invoking it, so a
   * double release can't happen even under re-entrancy.
   */
  private _gestureRelease: (() => void) | null = null;

  constructor(opts: TOptions) {
    this.id = opts.id;
    this.targetLayerId = opts.targetLayerId;
    this.scope = opts.targetLayerId !== undefined ? 'layer' : 'canvas';
    this.shortcuts = opts.shortcuts;
    this._wanted = opts.enabled ?? false;
    this._enabled = this._wanted;
    this._options = opts;
  }

  /** The developer's enable flag. A behaviour suspended by its `modes` still reports `true`. */
  get enabled(): boolean {
    return this._wanted;
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
    this.watchMode();
    this._enabled = this._wanted && this._inMode;
    if (this._enabled) this.onEnable();
  }

  /** Called by `BehaviourRegistry.unregister(id)`. Drops subscriptions. */
  destroy(): void {
    if (this.ctx === undefined) return;
    const ctx = this.ctx;
    this._enabled = false;
    this._wanted = false;
    this.unwatchMode();
    this.onDestroy(ctx);
    // Safety net (see `GestureArbiter`): a claim stranded by an unmount would
    // freeze the camera and every other gesture for the life of the canvas.
    this.releaseGesture();
    this.ctx = undefined;
  }

  enable(): void {
    if (this._wanted) return;
    this._wanted = true;
    this.syncLive();
  }

  disable(): void {
    if (!this._wanted) return;
    this._wanted = false;
    this.syncLive();
  }

  /**
   * Bring {@link _enabled} in line with `_wanted && _inMode`, running the
   * matching hook on a change. The single place a behaviour goes live or idle.
   */
  private syncLive(): void {
    const live = this._wanted && this._inMode;
    if (live === this._enabled) return;
    this._enabled = live;
    if (live) {
      this.onEnable();
    } else {
      this.onDisable();
      // Same safety net as `destroy()` — disabling mid-gesture must not strand
      // the claim, even if the subclass forgot to end its drag.
      this.releaseGesture();
    }
  }

  /** Is `mode` one this behaviour is live in? */
  private matchesMode(mode: string): boolean {
    const modes = this._options.modes;
    return modes === undefined || modes.includes(mode);
  }

  /**
   * Follow `view.interaction.viewMode` while registered and `modes` is set;
   * otherwise stop following and count as in-mode. Idempotent — `setOptions`
   * calls it again when `modes` changes.
   */
  private watchMode(): void {
    const ctx = this.ctx;
    if (ctx === undefined || this._options.modes === undefined) {
      this.unwatchMode();
      this._inMode = true;
      return;
    }
    const view = ctx.store.view;
    this._inMode = this.matchesMode(view.getState().interaction.viewMode);
    if (this._modeUnsub !== null) return;
    this._modeUnsub = view.subscribe((state, prev) => {
      if (state.interaction.viewMode === prev.interaction.viewMode) return;
      this._inMode = this.matchesMode(state.interaction.viewMode);
      this.syncLive();
    });
  }

  private unwatchMode(): void {
    this._modeUnsub?.();
    this._modeUnsub = null;
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
    if ('modes' in changes) this.setModes(changes.modes);
    if (changes.enabled !== undefined) {
      if (changes.enabled) this.enable();
      else this.disable();
    }
    this.onOptionsChanged(changes);
  }

  /**
   * Replace {@link BehaviourOptions.modes} and re-evaluate liveness against the
   * current interaction mode. `undefined` = live in every mode.
   */
  setModes(modes: readonly string[] | undefined): void {
    this._options = { ...this._options, modes };
    this.watchMode();
    this.syncLive();
  }

  /**
   * Merge `changes` into the options {@link getOptions} returns — and nothing
   * else: no enable / disable, no mode re-wiring, no {@link onOptionsChanged}.
   *
   * For subclasses that override {@link setOptions} with their own apply logic
   * and don't call `super`: call this first so `getOptions()` (a settings
   * editor's seed, the engine's undo baseline) stays current. Prefer it to
   * `super.setOptions` there: the engine routes `enabled` / `modes` through
   * the registry itself, and the base's direct `enable()` would pre-empt the
   * registry's `scene:behaviour:enable` event.
   */
  protected recordOptions(changes: Partial<TOptions>): void {
    this._options = { ...this._options, ...changes };
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
    const modes = this._options.modes;
    return modes === undefined ? { enabled: this._wanted } : { enabled: this._wanted, modes: [...modes] };
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
   * (without rebinding `this` cost). `false` while suspended by `modes`.
   */
  protected get isEnabled(): boolean {
    return this._enabled;
  }

  // ─── Gesture arbitration ─────────────────────────────────────────────────

  /**
   * Take exclusive ownership of the pointer gesture for the duration of a drag
   * (`ctx.gestures`, see `input/GestureArbiter.ts`). Returns `false` when
   * another behaviour already owns it — the caller must then **not** start its
   * gesture, because two behaviours steering the same pointer is exactly what
   * the arbiter exists to prevent.
   *
   * Claiming also suspends camera panning: `DragPanBehaviour` watches the
   * arbiter and yields while anybody else owns the gesture. That replaces the
   * old `camera.viewport.plugins.pause('drag')` reach-through, which put a
   * `pixi-viewport` internal in the hands of domain behaviours.
   *
   * Pair every successful claim with {@link releaseGesture} on **every** exit
   * path — pointerup, pointercancel, abort. `disable()` and `destroy()` release
   * automatically as a backstop.
   */
  protected claimGesture(opts?: GestureClaimOptions): boolean {
    const gestures = this.ctx?.gestures;
    if (!gestures) return false;
    const release = gestures.claim(this.id, opts);
    if (release === null) return false;
    this._gestureRelease = release;
    return true;
  }

  /**
   * End this behaviour's gesture claim. Safe to call any number of times and
   * when no claim is held — the arbiter identifies claims by token, so a stale
   * release can never evict a later owner.
   */
  protected releaseGesture(): void {
    const release = this._gestureRelease;
    this._gestureRelease = null;
    release?.();
  }

  /** Does this behaviour currently hold the gesture? */
  protected get hasGestureClaim(): boolean {
    return this._gestureRelease !== null;
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
