/**
 * `ScreenLayer` — abstract Layer that sits in **screen / viewport coordinate space**.
 *
 * Architecture: see `architecture-proposal.md` §2.1.
 *
 * - Viewport-fixed: NOT camera-affected. Pans / zooms do not transform it.
 * - Owns a root `SubLayer` (`this.subLayer`) attached **directly to**
 *   `ctx.stage` (the pixi `Application.stage`) — there is no wrapper
 *   "screen" container. `world` was added to stage first, so any ScreenLayer
 *   added afterwards sits above world in pixi's child-order draw model.
 *   The subLayer's `Container` is a plain `Container` (not a RenderGroup):
 *   screen-space content is typically lightweight HUD-style rendering and
 *   doesn't need its own GPU batch boundary.
 * - `hitTest(screenX, screenY)` — input is in screen pixels.
 *
 * Examples: `MiniMapLayer`, `DevInfoLayer`, HUD, tool palettes.
 *
 * The type-distinct `hitTest` signature (vs. `WorldLayer`'s) is what stops
 * consumers passing world coords to a screen layer or vice versa.
 */

import { Container, type Graphics } from 'pixi.js';
import type { CanvasContext } from '../context/CanvasContext';
import type { EventMap } from '../events/EventEmitter';
import { Layer, type LayerOptions } from './Layer';
import { SubLayer } from './SubLayer';

export interface ScreenLayerHit {
  readonly id: string;
  readonly subId?: string;
  readonly kind?: string;
}

export abstract class ScreenLayer<
  TOptions = unknown,
  TState extends object = object,
  TEvents extends EventMap = EventMap,
  TDirtyBucket extends string = string,
  THit extends ScreenLayerHit = ScreenLayerHit,
> extends Layer<TOptions, TState, TEvents, TDirtyBucket> {
  /** Backing field — assigned in `mount`, cleared in `unmount`. */
  private _subLayer?: SubLayer;

  /**
   * Root `SubLayer` for this screen-space layer. Set on `mount`, cleared on
   * `unmount`. Available inside `onMount(ctx)` for the layer's lifetime.
   *
   * **Public-readable** so cross-layer code can access peer sub-layers via
   * `ctx.layers.get<MyLayer>('id').subLayer`. Reading is safe; mutating a
   * peer's subLayer from outside violates layer ownership.
   */
  get subLayer(): SubLayer {
    if (!this._subLayer) {
      throw new Error(`ScreenLayer "${this.id}" subLayer accessed before mount`);
    }
    return this._subLayer;
  }

  constructor(opts: LayerOptions<TOptions>) {
    super(opts);
  }

  override mount(ctx: CanvasContext): void {
    // Build the root container BEFORE calling `super.mount(ctx)` so that
    // `onMount(ctx)` can rely on `this.subLayer`.
    const root = new Container();
    root.label = this.id;
    if (this.zIndex !== 0) {
      root.zIndex = this.zIndex;
      ctx.stage.sortableChildren = true;
    }
    ctx.stage.addChild(root);
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
   * Create a child `SubLayer` of this layer's root. Use for z-ordered visual
   * subdivision *within* this single screen-space layer. For top-level peers,
   * register a separate `Layer` on the canvas instead.
   */
  createSubLayer(subId: string, options?: { zIndex?: number }): SubLayer {
    return this.subLayer.createSubLayer(subId, options);
  }

  /**
   * Create a pixi `Graphics` attached to this layer's root container. The
   * sanctioned way for layer authors to obtain a `Graphics` for direct
   * painting via `@invana/canvas/draw` primitives.
   */
  createGraphics(label?: string): Graphics {
    return this.subLayer.createGraphics(label);
  }

  /**
   * Create a plain pixi `Container` attached to this layer's root container.
   * Useful as a parent for mounted display objects (e.g. text via
   * `mountPlainText(container, …)`).
   */
  createContainer(label?: string): Container {
    return this.subLayer.createContainer(label);
  }

  /**
   * Update this layer's z-order relative to its peers. Keeps the iteration
   * field (`this.zIndex`) and the pixi container's `zIndex` in sync, and
   * flips `ctx.stage` into sorted mode so the change renders.
   */
  setZIndex(z: number): void {
    this.zIndex = z;
    if (this.mounted) this.subLayer.setZIndex(z);
  }

  /** Hit-test in screen / viewport coordinates. Top-most hit or `null`. */
  abstract hitTest(screenX: number, screenY: number): THit | null;
}
