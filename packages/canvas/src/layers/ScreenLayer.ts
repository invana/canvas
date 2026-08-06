/**
 * `ScreenLayer` — abstract base for layers that live in **screen / viewport coordinate space**.
 *
 * Architecture: see `architecture-proposal.md` §2.1.
 *
 * - Viewport-fixed: NOT camera-affected. Pans / zooms do not transform it.
 * - Owns a root pixi `Container` attached directly to `ctx.stage`.
 *   Plain `Container` (not a RenderGroup) — screen-space content is typically
 *   lightweight HUD-style rendering that doesn't need its own GPU batch boundary.
 * - `hitTest(screenX, screenY)` — input is in screen pixels.
 *
 * Examples: `MiniMapLayer`, `DevInfoLayer`, HUD, tool palettes.
 *
 * The type-distinct `hitTest` signature (vs. `WorldLayer`'s) is what stops
 * consumers passing world coords to a screen layer or vice versa.
 */

import type { Container } from 'pixi.js';
import type { ISurface } from '../renderer/ISurface';
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

  /**
   * Root pixi `Container` for this screen-space layer. Available from
   * `onMount(ctx)` for the layer's lifetime. Throws before mount / after unmount.
   *
   * Subclass-only — not part of the external layer API.
   */
  /**
   * This layer's slice of the renderer — its drawing device, overlays,
   * visibility and paint order. Available from `onMount(ctx)` for the layer's
   * lifetime; throws before mount / after unmount.
   *
   * Replaces the raw pixi `Container` layers used to be handed: a layer
   * describes what it wants drawn and never touches a display object.
   */
  /**
   * The pixi root of this layer's surface.
   *
   * @deprecated Renderer-side escape hatch for in-package layers that paint
   * objects the primitives and overlay vocabularies don't cover (currently only
   * `BackgroundLayer`'s tiling pattern). Everything else describes content as
   * specs, or draws transients through `surface.overlay(...)`. Goes away when
   * the drawing bodies move to `@invana/renderer-pixijs`.
   */
  protected get container(): Container {
    return (this.surface as unknown as { root: Container }).root;
  }

  protected get surface(): ISurface {
    if (!this._surface) {
      throw new Error(`ScreenLayer "${this.id}" surface accessed before mount`);
    }
    return this._surface;
  }

  constructor(opts: LayerOptions<TOptions>) {
    super(opts);
  }

  override mount(ctx: CanvasContext): void {
    // Build the surface BEFORE `super.mount(ctx)` so `onMount(ctx)` can rely on
    // `this.surface`.
    const surface = ctx.createSurface('screen', this.id);
    if (this.zIndex !== 0) surface.setZIndex(this.zIndex);
    surface.setVisible(this.visible);
    this._surface = surface;
    super.mount(ctx);
  }

  /** Keep the pixi container in sync when `layer.visible` is toggled. */
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
   * field (`this.zIndex`) and the pixi container's `zIndex` in sync, and
   * flips `ctx.stage` into sorted mode so the change renders.
   */
  setZIndex(z: number): void {
    this.zIndex = z;
    this._surface?.setZIndex(z);
  }

  /** Hit-test in screen / viewport coordinates. Top-most hit or `null`. */
  abstract hitTest(screenX: number, screenY: number): THit | null;
}
