// ── ElementObject ─────────────────────────────────────────────────────────────
// Owns the PixiJS Container + Graphics for one element.
// Created by ElementPlugin.addSolid() / addConnector(); reused across viewport
// exits (container is detached, not destroyed).

import { Container, Graphics } from 'pixi.js';
import type { BaseSolid } from './BaseSolid.js';
import type { BaseConnector } from './BaseConnector.js';
import type { LOD } from './LODController.js';
import type { BBox } from './spec/index.js';
import { PixiDrawContext } from './DrawContext.js';

/** Union type accepted by ElementPlugin. */
export type AnyElement = BaseSolid | BaseConnector;

/**
 * `ElementObject` wraps one {@link AnyElement} instance together with the
 * PixiJS rendering objects it needs (`Container` + `Graphics` + `PixiDrawContext`).
 *
 * @remarks
 * Mirrors the role of `ShapeObject` in `ShapePlugin` but delegates all drawing
 * logic to the element class via {@link DrawContext} — no geometry code lives here.
 *
 * The `container` is **detached** (not destroyed) when a shape leaves the
 * viewport so it can be re-attached cheaply on re-entry.
 */
export class ElementObject {
  /** The element id — mirrors `element.spec.id`. */
  readonly id: string;

  /** The underlying element instance (BaseSolid or BaseConnector). */
  readonly element: AnyElement;

  /** The PixiJS Container to add/remove from the scene layer. */
  readonly container: Container;

  private _g: Graphics;
  private _ctx: PixiDrawContext;
  private _dirty = true;
  private _mounted = false;
  /** LOD level used during the last completed draw. `null` = never drawn. */
  private _lastDrawnLOD: LOD | null = null;

  constructor(element: AnyElement) {
    this.id      = element.spec.id;
    this.element = element;

    this.container = new Container();
    this._g        = new Graphics();
    this.container.addChild(this._g);

    // Apply z-index
    if (element.spec.zIndex !== undefined) {
      this.container.zIndex = element.spec.zIndex;
    }

    // Apply opacity
    if (element.spec.opacity !== undefined) {
      this.container.alpha = element.spec.opacity;
    }

    // Enable pointer events if interactive
    if (element.spec.interactive) {
      this.container.eventMode = 'static';
      this.container.cursor    = element.spec.cursor ?? 'pointer';
    }

    this._ctx = new PixiDrawContext(this._g, this.container);

    // Wire the element's dirty-flag callback back to this object
    element._onDirty = () => { this._dirty = true; };

    // Wire the container reference for animation handlers (scale, alpha transforms)
    if ('_container' in element) {
      (element as import('./BaseSolid.js').BaseSolid)._container = this.container;
    }
  }

  // ── Rendering ─────────────────────────────────────────────────────────────

  /**
   * Redraw the element at the given detail level.
   * Clears the Graphics, calls `element.draw(ctx, detail)`, then resets dirty flag.
   *
   * @param detail - Current {@link LOD} level.
   */
  draw(detail: LOD): void {
    // Skip redraw when the element is clean and was last drawn at the same LOD.
    // The PixiJS Graphics already hold the correct rendering — just re-attaching
    // the Container is enough (happens in ElementScene.onCameraChanged).
    if (!this._dirty && this._lastDrawnLOD === detail) return;

    this._ctx.reset();
    this.element.draw(this._ctx, detail);
    this._dirty = false;
    this._lastDrawnLOD = detail;

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

  /** Force a redraw on the next pass regardless of mutation tracking. */
  markDirty(): void {
    this._dirty = true;
  }

  // ── Geometry ──────────────────────────────────────────────────────────────

  /** Axis-aligned bounding box; delegated to `element.getBBox()`. */
  getBBox(): BBox {
    return this.element.getBBox();
  }

  /**
   * Precise hit-test for a world-space pointer position.
   * Delegates to `element.hitTest()`.
   */
  hitTest(wx: number, wy: number): boolean {
    return this.element.hitTest(wx, wy);
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  /**
   * Fully destroy this object: clears graphics, destroys PixiJS objects,
   * and calls `element.onDestroy()`.
   *
   * @remarks
   * Must only be called after removing `container` from the scene graph.
   */
  destroy(): void {
    this._ctx.reset();
    this._g.destroy();
    this.container.destroy({ children: true });
    this.element.onDestroy?.();
  }
}
