/**
 * `Layer` — base class for everything composable onto `canvas.layers`.
 *
 * Architecture: see `architecture-proposal.md` §2.1.
 *
 * **What every Layer owns:**
 *   - `id` — stable identifier; used by registries, events, telemetry envelopes.
 *   - `options` — construction-time, mostly-immutable config.
 *   - `state` — UI / interaction state (`Store<T>` zustand+immer; small, observable).
 *   - `events` — typed `SourceEmitter` that auto-forwards to the canvas tap.
 *   - `dirty` — `DirtyBatcher` for per-frame batched flush.
 *   - `visible` / `hittable` / `zIndex` / `cullable` — composition flags.
 *
 * **Lifecycle:** `mount(ctx)` → … → `unmount()`. `Canvas` calls these via the
 * `LayerRegistry`. `flush()` is called once per Canvas tick when
 * `dirty.hasPending()` is true.
 *
 * **Bulk hot data (`data`)** is NOT on the base class — it lives on subclasses
 * that need it (e.g. `GraphLayer` ships `GraphNodeStore`). See
 * `architecture-proposal.md` §2.1 for the bifurcated state/data model.
 *
 * **What subclasses provide:**
 *   - `createState()` — initial UI state.
 *   - `applyDirty(snap)` — translate dirty buckets → renderer commands.
 *   - `onMount()` / `onUnmount()` — domain-specific setup/teardown
 *     (subscribe to feeds, register decorations, etc.).
 *   - `WorldLayer` / `ScreenLayer` add `hitTest(coord, coord)`.
 */

import type { CanvasContext } from '../context/CanvasContext';
import type { EventMap } from '@invana/canvas-store';
import { SourceEmitter } from '@invana/canvas-store';
import { createLayerStore, type Store } from '../state/Store';
import { DirtyBatcher, type DirtySnapshot } from '@invana/canvas-store';

// ─── Minimal interface that registries see ─────────────────────────────────

/**
 * The subset of `Layer` the `LayerRegistry` and `Canvas.tick` interact with.
 * Lets the registry stay decoupled from the abstract class implementation.
 */
export interface ILayer {
  readonly id: string;
  visible: boolean;
  hittable: boolean;
  zIndex: number;
  cullable: boolean;
  /** `true` between `mount(ctx)` and `unmount()`. Lets the registry skip already-mounted layers. */
  readonly mounted: boolean;
  mount(ctx: CanvasContext): void;
  unmount(): void;
  flush(): void;
  hasPending(): boolean;
  redraw(): void;
  setVisible(visible: boolean): void;
}

// ─── Constructor options ───────────────────────────────────────────────────

export interface LayerOptions<TOptions = unknown> {
  id: string;
  options: TOptions;
  visible?: boolean;
  hittable?: boolean;
  zIndex?: number;
  /**
   * Off-screen culling participation. Default `true`. Set `false` for
   * full-canvas effect layers (background gradient, overlay) that should
   * always render regardless of camera visibility.
   */
  cullable?: boolean;
  /** Optional: name shown in devtools. Default `'<ClassName>:<id>'`. */
  devtoolsName?: string;
}

// ─── Layer base class ──────────────────────────────────────────────────────

export abstract class Layer<
  TOptions = unknown,
  TState extends object = object,
  TEvents extends EventMap = EventMap,
  TDirtyBucket extends string = string,
> implements ILayer
{
  readonly id: string;

  /**
   * Stable **class kind** — a minification-safe discriminator matching the
   * `@invana/canvas-ui` settings-editor registry key (e.g. `'background-layer'`,
   * `'minimap-layer'`). Distinct from {@link id} (the per-instance key): all
   * `BackgroundLayer` instances share `kind: 'background-layer'`. Concrete layers
   * set it as a class field; left `undefined` on any that haven't, so consumers
   * fall back (e.g. to the class name). Lets domain-free tooling resolve an
   * instance's editor without an `instanceof` ladder.
   */
  readonly kind?: string;
  readonly options: TOptions;
  readonly state: Store<TState>;
  readonly events: SourceEmitter<TEvents>;
  readonly dirty: DirtyBatcher<TDirtyBucket>;

  /** Backing field for the `visible` accessor. */
  private _visible: boolean = true;
  hittable: boolean;
  zIndex: number;
  cullable: boolean;

  /**
   * Whether this layer renders. Setting `false` hides the layer's pixi
   * container (via `onVisibleChange`, overridden by `WorldLayer` /
   * `ScreenLayer`) and the Canvas tick skips its flush.
   */
  get visible(): boolean {
    return this._visible;
  }
  set visible(value: boolean) {
    if (this._visible === value) return;
    this._visible = value;
    this.onVisibleChange(value);
  }

  /**
   * Toggle whole-layer visibility, repaint, and announce it. Unlike assigning
   * `visible` (which only hides the pixi container via {@link onVisibleChange}),
   * this also forces a {@link redraw} and emits `scene:layer:visibilitychange`
   * on the canvas bus so dependent layers (minimap) and the render loop react
   * automatically. No-op if the value is unchanged.
   */
  setVisible(visible: boolean): void {
    if (this._visible === visible) return;
    this.visible = visible; // runs onVisibleChange (container.visible sync)
    // Repaint from current state so a re-shown renderer-backed layer restores
    // its content without waiting for the next mutation.
    if (visible) this.redraw();
    this.ctx?.events.emit('scene:layer:visibilitychange', { id: this.id, visible });
  }

  /** Set by `mount(ctx)`; cleared by `unmount()`. */
  protected ctx?: CanvasContext;

  /** True between `mount` and `unmount`. */
  get mounted(): boolean {
    return this.ctx !== undefined;
  }

  constructor(opts: LayerOptions<TOptions>) {
    this.id = opts.id;
    this.options = opts.options;
    this._visible = opts.visible ?? true;
    this.hittable = opts.hittable ?? true;
    this.zIndex = opts.zIndex ?? 0;
    this.cullable = opts.cullable ?? true;

    // State lives on the layer for its full lifetime. Created via the
    // `createState()` hook so subclass generic types flow through cleanly.
    this.state = createLayerStore<TState>(this.createState(), {
      name: opts.devtoolsName ?? `${this.constructor.name}:${opts.id}`,
    });

    // Events emitter without bus initially; `mount()` attaches it to ctx.events.
    this.events = new SourceEmitter<TEvents>({ kind: 'layer', id: this.id });

    this.dirty = new DirtyBatcher<TDirtyBucket>();
  }

  // ─── Lifecycle ───────────────────────────────────────────────────────────

  mount(ctx: CanvasContext): void {
    if (this.ctx !== undefined) {
      throw new Error(`Layer "${this.id}" already mounted`);
    }
    this.ctx = ctx;
    this.events.setBus(ctx.events);
    this.onMount(ctx);
  }

  unmount(): void {
    if (this.ctx === undefined) return;
    const ctx = this.ctx;
    this.onUnmount(ctx);
    this.events.setBus(null);
    this.dirty.reset();
    this.ctx = undefined;
  }

  /** Convenience accessor; throws when called pre-mount. */
  protected get context(): CanvasContext {
    if (!this.ctx) {
      throw new Error(`Layer "${this.id}" is not mounted`);
    }
    return this.ctx;
  }

  // ─── Per-tick flush ──────────────────────────────────────────────────────

  /** Whether `flush()` has work to do this frame. */
  hasPending(): boolean {
    return this.dirty.hasPending();
  }

  /**
   * Called by Canvas tick when `hasPending()` is true. Swaps the dirty
   * snapshot, hands it to `applyDirty`. Subclasses normally don't override.
   */
  flush(): void {
    if (!this.dirty.hasPending()) return;
    const snap = this.dirty.flush();
    this.applyDirty(snap);
  }

  /**
   * Force a full repaint of this layer from its current state, bypassing the
   * per-frame dirty path. Base implementation is a no-op — only layers that
   * mount a renderer override it (e.g. `GraphLayer.redraw` re-renders every
   * node and edge). Driven by {@link Canvas.redraw}; reach for it after an
   * external change that sidestepped the normal mutate-and-flush path (theme
   * swap, palette change) or to recover from a suspected render desync.
   */
  redraw(): void {
    /* default no-op — renderer-backed layers override this */
  }

  // ─── Subclass hooks ──────────────────────────────────────────────────────

  /** Build the initial UI / interaction state. Called once in the constructor. */
  protected abstract createState(): TState;

  /**
   * Translate a dirty snapshot into renderer / pixi commands.
   * Default: no-op. Override when the layer batches work via `dirty.mark(...)`.
   */
  protected applyDirty(_snap: DirtySnapshot<TDirtyBucket>): void {
    /* default no-op */
  }

  /** Domain-specific mount setup (subscribe to peers, attach renderer, etc.). */
  protected onMount(_ctx: CanvasContext): void {
    /* default no-op */
  }

  /** Domain-specific unmount teardown. */
  protected onUnmount(_ctx: CanvasContext): void {
    /* default no-op */
  }

  /**
   * Called whenever `visible` changes (setter only — not on initial
   * construction). Subclasses override to keep their pixi container's
   * `.visible` in sync. Default: no-op.
   */
  protected onVisibleChange(_value: boolean): void {
    /* default no-op */
  }
}
