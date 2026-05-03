/**
 * `WorldLayer` — abstract Layer that sits in the **world coordinate space**.
 *
 * Architecture: see `architecture-proposal.md` §2.1.
 *
 * - Camera-affected: pans / zooms with the camera.
 * - Owns a root `SubLayer` (`this.subLayer`) attached to `surfaces.world`.
 *   The subLayer's `Container` is a pixi RenderGroup, so the layer is an
 *   independent GPU batch / cull unit.
 * - `hitTest(worldX, worldY)` — input is in world coordinates.
 *
 * Subclasses access `this.subLayer` directly, or call `this.createSubLayer(id)`
 * to subdivide rendering (e.g. an `edges` sub-layer below a `nodes` sub-layer).
 *
 * The type-distinct `hitTest` signature (vs. `ScreenLayer`'s) is what stops
 * consumers passing screen coords to a world layer or vice versa.
 */

import { Container } from 'pixi.js';
import type { CanvasContext } from '../context/CanvasContext';
import type { EventMap } from '../events/EventEmitter';
import { Layer, type LayerOptions } from './Layer';
import { SubLayer } from './SubLayer';

export interface WorldLayerHit {
  /** Whatever the subclass chooses to return — a node id, a sub-region, etc. */
  readonly id: string;
  readonly subId?: string;
  readonly kind?: string;
}

export abstract class WorldLayer<
  TOptions = unknown,
  TState extends object = object,
  TEvents extends EventMap = EventMap,
  TDirtyBucket extends string = string,
  THit extends WorldLayerHit = WorldLayerHit,
> extends Layer<TOptions, TState, TEvents, TDirtyBucket> {
  /** Backing field — assigned in `mount`, cleared in `unmount`. */
  private _subLayer?: SubLayer;

  /**
   * Root `SubLayer` for this layer. Set on `mount`, cleared on `unmount`.
   * Available inside `onMount(ctx)` and for the layer's lifetime thereafter.
   *
   * **Public-readable** so cross-layer code can access peer sub-layers via
   * `ctx.layers.get<MyLayer>('id').subLayer`. Reading is safe; mutating a
   * peer's subLayer (e.g. `peer.subLayer.createSubLayer(...)` from outside)
   * violates layer ownership and should be avoided.
   *
   * Throws if accessed before `mount` or after `unmount`.
   */
  get subLayer(): SubLayer {
    if (!this._subLayer) {
      throw new Error(`WorldLayer "${this.id}" subLayer accessed before mount`);
    }
    return this._subLayer;
  }

  constructor(opts: LayerOptions<TOptions>) {
    super(opts);
  }

  override mount(ctx: CanvasContext): void {
    // Build the root container BEFORE calling `super.mount(ctx)` so that
    // `onMount(ctx)` (invoked by `Layer.mount`) can rely on `this.subLayer`.
    const root = new Container({ isRenderGroup: true });
    root.label = this.id;
    if (this.zIndex !== 0) {
      root.zIndex = this.zIndex;
      ctx.world.sortableChildren = true;
    }
    ctx.world.addChild(root);
    this._subLayer = new SubLayer(this.id, root);
    super.mount(ctx);
  }

  override unmount(): void {
    if (!this.mounted) return;
    super.unmount();
    this._subLayer?.container.destroy({ children: true });
    this._subLayer = undefined;
  }

  /**
   * Create a child `SubLayer` of this layer's root. Convenience wrapper for
   * `this.subLayer.createSubLayer(id, options)`.
   */
  protected createSubLayer(subId: string, options?: { zIndex?: number }): SubLayer {
    return this.subLayer.createSubLayer(subId, options);
  }

  /**
   * Update this layer's z-order relative to its peers. Keeps the iteration
   * field (`this.zIndex`, used by `LayerRegistry.byZOrder()`) and the pixi
   * container's `zIndex` in sync, and flips `surfaces.world` into sorted mode
   * so the change renders.
   */
  setZIndex(z: number): void {
    this.zIndex = z;
    if (this.mounted) this.subLayer.setZIndex(z);
  }

  /**
   * Hit-test in world coordinates. Returns the topmost hit or `null`.
   * Concrete layers implement this against their own data + spatial index.
   *
   * The `Canvas`-level hit-test orchestration (top-down by z-order, stop on
   * first hit, screen-layers-before-world per proposal Q6) calls this.
   */
  abstract hitTest(worldX: number, worldY: number): THit | null;
}
