// ── ElementHaloPool ───────────────────────────────────────────────────────────
// Fixed pool of Graphics objects for per-element pulse animation rings.
// Rented by pulseHandler.init() and returned by pulseHandler.cleanup().

import { Graphics } from 'pixi.js';
import type { Container } from 'pixi.js';
import type { BaseSolid } from './BaseSolid.js';

/**
 * `ElementHaloPool` is a fixed-size pool of pre-allocated `PIXI.Graphics` for
 * rendering pulse animation rings without allocating at runtime.
 *
 * @remarks
 * Adapted from `HaloPool` in `shape-plugin` — uses {@link BaseSolid.getCenter}
 * and {@link BaseSolid.getBBox} instead of `ShapeObject.spec` for coordinates.
 * Ring geometry is always circular for simplicity; the radius is derived from
 * the bounding box extents.
 *
 * This class is internal to {@link ElementPlugin}.
 */
export class ElementHaloPool {
  private _pool: Graphics[] = [];
  private _rented = new Map<string, Graphics>();
  private _scene: Container;

  constructor(scene: Container, poolSize = 40) {
    this._scene = scene;
    for (let i = 0; i < poolSize; i++) {
      this._pool.push(new Graphics());
    }
  }

  /**
   * Rent a `Graphics` instance for a pulse animation on the given element.
   * No-op if the element already has a rented graphics.
   */
  rentForPulse(element: BaseSolid): void {
    const id = element.spec.id;
    if (this._rented.has(id)) return;
    const g = this._pool.pop();
    if (!g) return; // pool exhausted — silently skip
    this._scene.addChild(g);
    this._rented.set(id, g);
  }

  /**
   * Redraw expanding ripple rings for a pulse animation frame.
   * Called by `pulseHandler.apply()` each frame with the current progress.
   *
   * @param element    - The element to draw rings around.
   * @param progress   - Current cycle progress (0–1).
   * @param maxRadius  - Maximum ring expansion beyond the element's base radius in px.
   * @param color      - Ring stroke color.
   */
  redrawPulse(element: BaseSolid, progress: number, maxRadius: number, color: string): void {
    const g = this._rented.get(element.spec.id);
    if (!g) return;
    g.clear();

    const center = element.getCenter();
    const bbox = element.getBBox();
    const baseRadius = Math.max(
      bbox.maxX - bbox.minX,
      bbox.maxY - bbox.minY,
    ) / 2;
    const expandedMax = baseRadius + maxRadius;
    const ringCount = 3;
    const baseAlpha = 0.6;

    for (let i = 0; i < ringCount; i++) {
      const phase = (progress + i / ringCount) % 1;
      const r = baseRadius + phase * (expandedMax - baseRadius);
      const alpha = baseAlpha * (1 - phase);
      if (alpha <= 0.01 || r <= 0) continue;
      g.circle(center.x, center.y, r).stroke({ color, width: 2, alpha, alignment: 0.5 });
    }
  }

  /**
   * Return the rented graphics for an element back to the pool.
   *
   * @param elementId - Id of the element whose halo should be returned.
   */
  return(elementId: string): void {
    const g = this._rented.get(elementId);
    if (!g) return;
    this._scene.removeChild(g);
    g.clear();
    this._pool.push(g);
    this._rented.delete(elementId);
  }

  /** Return all currently rented graphics to the pool. */
  returnAll(): void {
    for (const [id] of this._rented) {
      this.return(id);
    }
  }

  /**
   * Return all rented graphics and destroy all `Graphics` instances.
   * Called by {@link ElementPlugin.destroy}.
   */
  destroy(): void {
    this.returnAll();
    for (const g of this._pool) g.destroy();
    this._pool = [];
  }
}
