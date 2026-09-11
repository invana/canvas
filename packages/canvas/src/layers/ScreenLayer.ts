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

import type { ISurface, SurfaceOptions } from '@invana/canvas-core';
import type { CanvasContext } from '@invana/canvas-core';
import type { EventMap } from '@invana/canvas-store';
import { Layer, type LayerOptions } from '@invana/canvas-core';

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
  /** Backing field — built on first {@link surface} access, cleared in `unmount`. */
  protected _surface?: ISurface;
  /** Kept from `mount` so the surface can be built lazily on first access. */
  private _surfaceCtx?: CanvasContext;

  /**
   * This layer's drawing surface, **built on first access**.
   *
   * Most screen layers never draw through one: the minimap, the legend, the dev
   * HUD and the layers panel paint through `ctx.createOverlay` or straight into
   * the DOM. Creating a surface for them eagerly allocated a whole
   * `PrimitivesRenderer` — a picking index and a spec projector — that never
   * held a single spec. Building on demand means a layer that doesn't draw
   * through a surface doesn't pay for one.
   *
   * Throws before `mount` / after `unmount`, as it always did.
   */
  protected get surface(): ISurface {
    if (!this._surface) {
      const ctx = this._surfaceCtx;
      if (!ctx) {
        throw new Error(`ScreenLayer "${this.id}" surface accessed before mount`);
      }
      const surface = ctx.createSurface('screen', this.id, this.surfaceOptions());
      // Read from the layer's own fields rather than captured values, so a
      // `setZIndex` / `setVisible` that landed before the first access is
      // carried onto the surface when it is finally built.
      if (this.zIndex !== 0) surface.setZIndex(this.zIndex);
      surface.setVisible(this.visible);
      this._surface = surface;
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
    // Record the context BEFORE `super.mount(ctx)` so `onMount(ctx)` can still
    // reach `this.surface` — it just builds it at that moment rather than here.
    this._surfaceCtx = ctx;
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
    this._surfaceCtx = undefined;
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
