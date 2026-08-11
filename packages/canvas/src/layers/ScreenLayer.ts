/**
 * `ScreenLayer` — abstract base for layers that live in **screen / viewport coordinate space**.
 *
 * Architecture: see `architecture-proposal.md` §2.1.
 *
 * - Viewport-fixed: NOT camera-affected. Pans / zooms do not transform it.
 * - Owns a `screen`-space surface, obtained from the renderer at mount.
 *   Plain `Container` (not a RenderGroup) — screen-space content is typically
 *   lightweight HUD-style rendering that doesn't need its own GPU batch boundary.
 * - `hitTest(screenX, screenY)` — input is in screen pixels.
 *
 * Examples: `MiniMapLayer`, `DevInfoLayer`, HUD, tool palettes.
 *
 * The type-distinct `hitTest` signature (vs. `WorldLayer`'s) is what stops
 * consumers passing world coords to a screen layer or vice versa.
 */

import type { ISurface, SurfaceOptions } from '../renderer/ISurface';
import type { CanvasContext } from '../context/CanvasContext';
import type { EventMap } from '@invana/canvas-store';
import { Layer, type LayerOptions } from './Layer';

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
  protected _surface?: ISurface;


  protected get surface(): ISurface {
    if (!this._surface) {
      throw new Error(`ScreenLayer "${this.id}" surface accessed before mount`);
    }
    return this._surface;
  }

  constructor(opts: LayerOptions<TOptions>) {
    super(opts);
  }

  /**
   * Per-layer options for the drawing device this layer's surface builds.
   * Override when the layer owns policy the renderer can't know — a graph layer
   * with pinpoint nodes wants a larger hit floor than one of big cards.
   * Read once, at mount.
   */
  protected surfaceOptions(): SurfaceOptions | undefined {
    return undefined;
  }

  override mount(ctx: CanvasContext): void {
    // Build the surface BEFORE `super.mount(ctx)` so `onMount(ctx)` can rely on
    // `this.surface`.
    const surface = ctx.createSurface('screen', this.id, this.surfaceOptions());
    if (this.zIndex !== 0) surface.setZIndex(this.zIndex);
    surface.setVisible(this.visible);
    this._surface = surface;
    super.mount(ctx);
  }

  /** Keep the surface in sync when `layer.visible` is toggled. */
  protected override onVisibleChange(value: boolean): void {
    this._surface?.setVisible(value);
  }

  override unmount(): void {
    if (!this.mounted) return;
    super.unmount();
    this._surface?.destroy();
    this._surface = undefined;
  }



  /**
   * Update this layer's z-order relative to its peers. Keeps the iteration
   * field (`this.zIndex`) and the surface's paint order in sync, and
   * flips `ctx.stage` into sorted mode so the change renders.
   */
  setZIndex(z: number): void {
    this.zIndex = z;
    this._surface?.setZIndex(z);
  }

  /** Hit-test in screen / viewport coordinates. Top-most hit or `null`. */
  abstract hitTest(screenX: number, screenY: number): THit | null;
}
