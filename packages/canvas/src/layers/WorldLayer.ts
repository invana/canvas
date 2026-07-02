/**
 * `WorldLayer` — abstract base for layers that live in **world coordinate space**.
 *
 * Architecture: see `architecture-proposal.md` §2.1.
 *
 * - Camera-affected: pans / zooms with the camera.
 * - Owns a root pixi `Container` (RenderGroup) attached to `surfaces.world`.
 * - `hitTest(worldX, worldY)` — input is in world coordinates.
 *
 * Subclasses call `this.createGraphics(label?)` or `this.createContainer(label?)`
 * to add pixi display objects, and override `onMount(ctx)` to wire up renderers.
 * For stacked draw-order (e.g. edges below nodes), use separate Layer instances.
 *
 * The type-distinct `hitTest` signature (vs. `ScreenLayer`'s) is what stops
 * consumers passing screen coords to a world layer or vice versa.
 */

import { Container, Graphics } from 'pixi.js';
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
  protected _container?: Container;

  /**
   * Root pixi `Container` (RenderGroup) for this layer. Available from
   * `onMount(ctx)` for the layer's lifetime. Throws before mount / after unmount.
   *
   * Pass to `ShapesRenderer` as the `container` option when wiring up a renderer
   * inside `onMount`. Subclass-only — not part of the external layer API.
   */
  protected get container(): Container {
    if (!this._container) {
      throw new Error(`WorldLayer "${this.id}" container accessed before mount`);
    }
    return this._container;
  }

  constructor(opts: LayerOptions<TOptions>) {
    super(opts);
  }

  override mount(ctx: CanvasContext): void {
    // Build the root container BEFORE calling `super.mount(ctx)` so that
    // `onMount(ctx)` (invoked by `Layer.mount`) can rely on `this.container`.
    const root = new Container({ isRenderGroup: true });
    root.label = this.id;
    if (this.zIndex !== 0) {
      root.zIndex = this.zIndex;
      ctx.world.sortableChildren = true;
    }
    root.visible = this.visible;
    ctx.world.addChild(root);
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
   * painting via `@invana/canvas/draw` primitives — keeps pixi internal
   * (no `new Graphics()` in user code).
   */
  createGraphics(label?: string): Graphics {
    const g = new Graphics();
    if (label) g.label = label;
    this.container.addChild(g);
    return g;
  }

  /**
   * Create a plain pixi `Container` attached to this layer's root container.
   * Useful as a parent for mounted display objects (e.g. text sprites).
   */
  createContainer(label?: string): Container {
    const c = new Container();
    if (label) c.label = label;
    this.container.addChild(c);
    return c;
  }

  /**
   * Update this layer's z-order relative to its peers. Keeps the iteration
   * field (`this.zIndex`, used by `LayerRegistry.byZOrder()`) and the pixi
   * container's `zIndex` in sync, and flips `surfaces.world` into sorted mode
   * so the change renders.
   */
  setZIndex(z: number): void {
    this.zIndex = z;
    if (this._container) {
      this._container.zIndex = z;
      const parent = this._container.parent;
      if (parent) parent.sortableChildren = true;
    }
  }

  /**
   * Return the world-space AABB of everything currently rendered on this layer.
   * Delegates to Pixi's `getLocalBounds()` — a one-shot scene-graph traversal.
   * Suitable for "fit to content" calls; do not call every frame.
   */
  getBounds(): { x: number; y: number; width: number; height: number } {
    const b = this.container.getLocalBounds();
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
