// ── ShapeObject ───────────────────────────────────────────────────────────────
// Owns the PixiJS Container + Graphics for one shape or connector.
// Created by ShapesPlugin.addShape() / addConnector(); reused across viewport exits.

import { Container, Graphics } from 'pixi.js';
import { BaseShape } from './BaseShape.js';
import { BaseConnector } from './BaseConnector.js';
import type { LOD } from './LODController.js';
import type { BBox } from './spec/index.js';
import { PixiDrawContext } from './DrawContext.js';
import { ShapeLabels } from './ShapeLabels.js';

/** Union type for any shape element (shape or connector). */
export type AnyShapeObject = BaseShape | BaseConnector;

/**
 * `ShapeObject` wraps one {@link AnyShapeObject} instance together with the
 * PixiJS rendering objects it needs (`Container` + `Graphics` + `PixiDrawContext`).
 *
 * @remarks
 * The `container` is **detached** (not destroyed) when a shape leaves the
 * viewport so it can be re-attached cheaply on re-entry.
 */
export class ShapeObject {
  /** The element id — mirrors `element.spec.id`. */
  readonly id: string;

  /** The underlying element instance (BaseShape or BaseConnector). */
  readonly element: AnyShapeObject;

  /** The PixiJS Container to add/remove from the scene layer. */
  readonly container: Container;

  private _g: Graphics;
  private _ctx: PixiDrawContext;
  /** Underlay graphics for state-driven halos. Sits below `_g`. */
  private _haloG: Graphics;
  private _haloCtx: PixiDrawContext;
  /**
   * Per-element label pool. Labels render into a shared label layer (passed
   * from `ShapesPlugin`), not as children of `container`, so they sit above
   * neighbouring shape bodies and can be hidden as a group via the layer.
   */
  private _labels: ShapeLabels | null;
  private _dirty = true;
  private _haloDirty = true;
  private _mounted = false;
  /** LOD level used during the last completed draw. `null` = never drawn. */
  private _lastDrawnLOD: LOD | null = null;

  /**
   * @param element     - The shape or connector to wrap.
   * @param labelLayer  - Container for this element's labels. When omitted,
   *                      labels are not rendered (ShapeObject still works
   *                      headlessly — useful for tests).
   */
  constructor(element: AnyShapeObject, labelLayer?: Container) {
    this.id      = element.spec.id;
    this.element = element;
    this._labels = labelLayer ? new ShapeLabels(labelLayer) : null;

    this.container = new Container();
    // Halo first so it sits underneath the body.
    this._haloG    = new Graphics();
    this._g        = new Graphics();
    this.container.addChild(this._haloG);
    this.container.addChild(this._g);

    if (element.spec.zIndex !== undefined) {
      this.container.zIndex = element.spec.zIndex;
    }

    if (element.spec.opacity !== undefined) {
      this.container.alpha = element.spec.opacity;
    }

    if (element.spec.interactive) {
      this.container.eventMode = 'static';
      this.container.cursor    = element.spec.cursor ?? 'pointer';
    }

    this._ctx     = new PixiDrawContext(this._g, this.container);
    this._haloCtx = new PixiDrawContext(this._haloG, this.container);

    element._onDirty     = () => { this._dirty = true; };
    element._onHaloDirty = () => { this._haloDirty = true; };

    if ('_container' in element) {
      (element as BaseShape)._container = this.container;
    }
  }

  // ── Rendering ─────────────────────────────────────────────────────────────

  /**
   * Redraw the element (and its halo, if dirty) at the given detail level.
   */
  draw(detail: LOD): void {
    const bodyNeedsRedraw = this._dirty || this._lastDrawnLOD !== detail;
    if (!bodyNeedsRedraw && !this._haloDirty) return;

    if (this._haloDirty) {
      this._haloCtx.reset();
      this.element.drawHalo?.(this._haloCtx, detail);
      this._haloDirty = false;
    }

    if (bodyNeedsRedraw) {
      this._ctx.reset();
      this.element.draw(this._ctx, detail);
      this._dirty = false;
      this._lastDrawnLOD = detail;
      this._syncLabels(detail);
    }

    if (!this._mounted) {
      this._mounted = true;
      this.element.onMount?.();
    }
  }

  // ── State ─────────────────────────────────────────────────────────────────

  /** `true` if the element has mutated since the last `draw()` call. */
  get isDirty(): boolean {
    return this._dirty;
  }

  /**
   * Per-element label pool, or `null` when this object was constructed
   * without a label layer. Exposed for behaviour plugins (e.g. label
   * re-rasterization on zoom) that need to iterate every label.
   */
  get labels(): ShapeLabels | null {
    return this._labels;
  }

  /** Force a redraw on the next pass regardless of mutation tracking. */
  markDirty(): void {
    this._dirty = true;
    this._haloDirty = true;
  }

  // ── Geometry ──────────────────────────────────────────────────────────────

  /** Axis-aligned bounding box; delegated to `element.getBBox()`. */
  getBBox(): BBox {
    return this.element.getBBox();
  }

  /**
   * Precise hit-test for a world-space pointer position.
   */
  hitTest(wx: number, wy: number): boolean {
    return this.element.hitTest(wx, wy);
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  /**
   * Fully destroy this object: clears graphics, destroys PixiJS objects,
   * and calls `element.onDestroy()`.
   */
  destroy(): void {
    this._ctx.reset();
    this._haloCtx.reset();
    this._labels?.destroy();
    this._labels = null;
    this._g.destroy();
    this._haloG.destroy();
    this.container.destroy({ children: true });
    this.element.onDestroy?.();
  }

  private _syncLabels(detail: LOD): void {
    if (!this._labels) return;
    if (this.element instanceof BaseShape) {
      this._labels.syncShape(this.element, detail);
    } else if (this.element instanceof BaseConnector) {
      this._labels.syncConnector(this.element, detail);
    }
  }
}

// ── Backward-compatibility alias ─────────────────────────────────────────────
/** @deprecated Use {@link ShapeObject} instead. */
export { ShapeObject as GraphObject };
/** @deprecated Use {@link AnyShapeObject} instead. */
export type { AnyShapeObject as AnyGraphObject };
