// ── SceneContainer ────────────────────────────────────────────────────────────
// Manages the PixiJS scene graph slice — only visible shapes are children.
// On every viewport change: compute visible set, add new entries, remove old ones.
// ShapeObject containers are DETACHED (not destroyed) on viewport exit so they
// can be re-attached cheaply when the shape re-enters.

import type { Container } from 'pixi.js';
import type { ShapePool } from './ShapePool.js';
import type { CameraBounds } from './CameraTracker.js';
import { RenderDetail } from './LODController.js';

export class SceneContainer {
  private _layer: Container;
  private _pool: ShapePool;
  private _visible = new Set<string>();
  private _detail: RenderDetail = RenderDetail.FULL;

  constructor(layer: Container, pool: ShapePool) {
    this._layer = layer;
    this._pool = pool;
  }

  /** Called by CameraTracker whenever the camera moves */
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

  /** Called by LODController when zoom level changes — redraws all visible shapes */
  onDetailChanged(detail: RenderDetail): void {
    this._detail = detail;
    for (const id of this._visible) {
      this._pool.get(id)?.draw(detail);
    }
  }

  /** Force-redraw a single shape (used by update() and AnimationTicker) */
  redraw(id: string): void {
    if (!this._visible.has(id)) return;
    this._pool.get(id)?.draw(this._detail);
  }

  isVisible(id: string): boolean {
    return this._visible.has(id);
  }

  get detail(): RenderDetail {
    return this._detail;
  }

  /** Remove a shape from scene and visible set (called before ShapePool.remove) */
  evict(id: string): void {
    const obj = this._pool.get(id);
    if (obj) this._layer.removeChild(obj.container);
    this._visible.delete(id);
  }

  clear(): void {
    for (const id of this._visible) {
      const obj = this._pool.get(id);
      if (obj) this._layer.removeChild(obj.container);
    }
    this._visible.clear();
  }
}
