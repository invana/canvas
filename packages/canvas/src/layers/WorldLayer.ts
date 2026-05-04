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

import { Container, type Graphics } from 'pixi.js';
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
   * Create a child `SubLayer` of this layer's root. Use when you want a
   * z-ordered visual subdivision *within* this single layer (e.g. an
   * `edges` slot below a `nodes` slot, both projected from the same data).
   * For top-level peers, register a separate `Layer` on the canvas instead.
   *
   * Delegates to `this.subLayer.createSubLayer(id, options)`.
   */
  createSubLayer(subId: string, options?: { zIndex?: number }): SubLayer {
    return this.subLayer.createSubLayer(subId, options);
  }

  /**
   * Create a pixi `Graphics` attached to this layer's root container. The
   * sanctioned way for layer authors to obtain a `Graphics` for direct
   * painting via `@invana/canvas/draw` primitives — keeps pixi internal
   * (no `new Graphics()` in user code).
   *
   * Delegates to `this.subLayer.createGraphics(label)`.
   */
  createGraphics(label?: string): Graphics {
    return this.subLayer.createGraphics(label);
  }

  /**
   * Create a plain pixi `Container` attached to this layer's root container.
   * Useful as a parent for mounted display objects (e.g. text via
   * `mountPlainText(container, …)`). For an independent draw-order slot,
   * prefer `createSubLayer` (returns a `SubLayer` with hierarchical id and
   * a RenderGroup container).
   *
   * Delegates to `this.subLayer.createContainer(label)`.
   */
  createContainer(label?: string): Container {
    return this.subLayer.createContainer(label);
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
   * Return the world-space AABB of everything currently rendered on this layer.
   * Delegates to Pixi's `getLocalBounds()` — a one-shot scene-graph traversal.
   * Suitable for "fit to content" calls; do not call every frame.
   */
  getBounds(): { x: number; y: number; width: number; height: number } {
    const b = this.subLayer.container.getLocalBounds();
    return { x: b.minX, y: b.minY, width: b.maxX - b.minX, height: b.maxY - b.minY };
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
