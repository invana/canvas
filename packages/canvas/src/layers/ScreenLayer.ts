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

import { Container, Graphics } from 'pixi.js';
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
  protected _container?: Container;

  /**
   * Root pixi `Container` for this screen-space layer. Available from
   * `onMount(ctx)` for the layer's lifetime. Throws before mount / after unmount.
   *
   * Subclass-only — not part of the external layer API.
   */
  protected get container(): Container {
    if (!this._container) {
      throw new Error(`ScreenLayer "${this.id}" container accessed before mount`);
    }
    return this._container;
  }

  constructor(opts: LayerOptions<TOptions>) {
    super(opts);
  }

  override mount(ctx: CanvasContext): void {
    // Build the root container BEFORE calling `super.mount(ctx)` so that
    // `onMount(ctx)` can rely on `this.container`.
    const root = new Container();
    root.label = this.id;
    if (this.zIndex !== 0) {
      root.zIndex = this.zIndex;
      ctx.stage.sortableChildren = true;
    }
    root.visible = this.visible;
    ctx.stage.addChild(root);
    this._container = root;
    super.mount(ctx);
  }

  /** Keep the pixi container in sync when `layer.visible` is toggled. */
  protected override onVisibleChange(value: boolean): void {
    if (this._container) this._container.visible = value;
  }

  override unmount(): void {
    if (!this.mounted) return;
    super.unmount();
    this._container?.destroy({ children: true });
    this._container = undefined;
  }

  /**
   * Create a pixi `Graphics` attached to this layer's root container. The
   * sanctioned way for layer authors to obtain a `Graphics` for direct
   * painting via `@invana/canvas/draw` primitives.
   */
  createGraphics(label?: string): Graphics {
    const g = new Graphics();
    if (label) g.label = label;
    this.container.addChild(g);
    return g;
  }

  /**
   * Create a plain pixi `Container` attached to this layer's root container.
   * Useful as a parent for mounted display objects.
   */
  createContainer(label?: string): Container {
    const c = new Container();
    if (label) c.label = label;
    this.container.addChild(c);
    return c;
  }

  /**
   * Update this layer's z-order relative to its peers. Keeps the iteration
   * field (`this.zIndex`) and the pixi container's `zIndex` in sync, and
   * flips `ctx.stage` into sorted mode so the change renders.
   */
  setZIndex(z: number): void {
    this.zIndex = z;
    if (this._container) {
      this._container.zIndex = z;
      const parent = this._container.parent;
      if (parent) parent.sortableChildren = true;
    }
  }

  /** Hit-test in screen / viewport coordinates. Top-most hit or `null`. */
  abstract hitTest(screenX: number, screenY: number): THit | null;
}
