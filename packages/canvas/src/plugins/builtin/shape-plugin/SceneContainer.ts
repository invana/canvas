// ── SceneContainer ────────────────────────────────────────────────────────────
// Manages the PixiJS scene graph slice — only visible shapes are children.
// On every viewport change: compute visible set, add new entries, remove old ones.
// ShapeObject containers are DETACHED (not destroyed) on viewport exit so they
// can be re-attached cheaply when the shape re-enters.

import type { Container } from 'pixi.js';
import type { ShapePool } from './ShapePool.js';
import type { CameraBounds } from './CameraTracker.js';
import { RenderDetail } from './LODController.js';

/**
 * `SceneContainer` manages the PixiJS scene graph slice for {@link ShapePlugin}.
 *
 * @remarks
 * Only **visible** shapes are attached to the layer as `Container` children.
 * On every camera change, the visible set is diffed against the incoming
 * RBush search result:
 * - Shapes that **entered** the viewport are drawn then attached.
 * - Shapes that **left** the viewport are detached (not destroyed) so
 *   re-entry is allocation-free.
 *
 * This class is internal to {@link ShapePlugin}.
 */
export class SceneContainer {
  private _layer: Container;
  private _pool: ShapePool;
  private _visible = new Set<string>();
  private _detail: RenderDetail = RenderDetail.FULL;

  constructor(layer: Container, pool: ShapePool) {
    this._layer = layer;
    this._pool = pool;
  }

  /**
   * Called by {@link CameraTracker} whenever the camera moves or zooms.
   * Diffs the current visible set against the new viewport AABB and
   * attaches/detaches shapes accordingly.
   *
   * @param bounds - New world-space viewport AABB (with padding).
   */
  onCameraChanged(bounds: CameraBounds): void {
    const incoming = new Set(
      this._pool.search(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY).map(o => o.id)
    );

    // Remove shapes that left the viewport
    for (const id of this._visible) {
      if (!incoming.has(id)) {
        const obj = this._pool.get(id);
        if (obj) this._layer.removeChild(obj.container);
        this._visible.delete(id);
      }
    }

    // Add shapes that entered the viewport
    for (const id of incoming) {
      if (!this._visible.has(id)) {
        const obj = this._pool.get(id);
        if (obj) {
          obj.draw(this._detail);
          this._layer.addChild(obj.container);
          this._visible.add(id);
        }
      }
    }
  }

  /**
   * Called by {@link LODController} when the zoom level crosses a threshold.
   * Redraws every currently-visible shape at the new detail level.
   *
   * @param detail - The new {@link RenderDetail} level.
   */
  onDetailChanged(detail: RenderDetail): void {
    this._detail = detail;
    for (const id of this._visible) {
      this._pool.get(id)?.draw(detail);
    }
  }

  /**
   * Force-redraw a single shape if it is currently in the visible set.
   * Called by {@link ShapePlugin.update} and {@link AnimationTicker}.
   *
   * @param id - Shape id.
   */
  redraw(id: string): void {
    if (!this._visible.has(id)) return;
    this._pool.get(id)?.draw(this._detail);
  }

  /** Returns `true` if the shape with the given id is currently in the visible set. */
  isVisible(id: string): boolean {
    return this._visible.has(id);
  }

  /** The current {@link RenderDetail} level applied to all visible shapes. */
  get detail(): RenderDetail {
    return this._detail;
  }

  /**
   * Detach a shape from the scene and remove it from the visible set.
   * Called by {@link ShapePlugin.remove} **before** `ShapePool.remove`.
   *
   * @param id - Shape id.
   */
  evict(id: string): void {
    const obj = this._pool.get(id);
    if (obj) this._layer.removeChild(obj.container);
    this._visible.delete(id);
  }

  /** Detach all visible shapes from the layer and clear the visible set. */
  clear(): void {
    for (const id of this._visible) {
      const obj = this._pool.get(id);
      if (obj) this._layer.removeChild(obj.container);
    }
    this._visible.clear();
  }
}
