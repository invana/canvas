/**
 * `WorldLayer` — abstract base for layers that live in **world coordinate space**.
 *
 * Architecture: see `architecture-proposal.md` §2.1.
 *
 * - Camera-affected: pans / zooms with the camera.
 * - Owns a `world`-space surface, obtained from the renderer at mount.
 * - `hitTest(worldX, worldY)` — input is in world coordinates.
 *
 * Subclasses publish specs (durable content) or draw through
 * `this.surface.overlay(...)` (transient visuals), and override `onMount(ctx)`
 * to wire themselves up. No display object is ever constructed by a layer.
 * For stacked draw-order (e.g. edges below nodes), use separate Layer instances.
 *
 * The type-distinct `hitTest` signature (vs. `ScreenLayer`'s) is what stops
 * consumers passing screen coords to a world layer or vice versa.
 */

import type { ISurface, SurfaceOptions } from '../renderer/ISurface';
import type { CanvasContext } from '../context/CanvasContext';
import type { EventMap } from '@invana/canvas-store';
import { Layer, type LayerOptions } from './Layer';

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
  protected _surface?: ISurface;


  protected get surface(): ISurface {
    if (!this._surface) {
      throw new Error(`WorldLayer "${this.id}" surface accessed before mount`);
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
    const surface = ctx.createSurface('world', this.id, this.surfaceOptions());
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
   * field (`this.zIndex`, used by `LayerRegistry.byZOrder()`) and the surface's
   * paint order in sync, and flips `surfaces.world` into sorted mode
   * so the change renders.
   */
  setZIndex(z: number): void {
    this.zIndex = z;
    this._surface?.setZIndex(z);
  }

  /**
   * Return the world-space AABB of everything currently rendered on this layer.
   * Delegates to Pixi's `getLocalBounds()` — a one-shot scene-graph traversal.
   * Suitable for "fit to content" calls; do not call every frame.
   */
  getBounds(): { x: number; y: number; width: number; height: number } | null {
    // Subclasses that know their own data override this (see `GraphLayer`).
    // Without a scene-graph walk there is nothing generic to measure, so the
    // honest answer is "nothing to fit" rather than a zero rect.
    return null;
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
