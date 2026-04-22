// ── HaloPool ──────────────────────────────────────────────────────────────────
// Fixed pool of Graphics objects for halos.
// Rented on pointerover/select, returned on pointerout/deselect.
// Pool size is constant — at most poolSize halos exist in the scene at once.

import { Graphics } from 'pixi.js';
import type { Container } from 'pixi.js';
import type { ShapeObject } from './ShapeObject.js';
import { drawCircleGlow } from '../../../graphics-utils/index.js';

/**
 * `HaloPool` is a fixed-size pool of pre-allocated `PIXI.Graphics` objects used
 * to render hover/selection halos without allocating at runtime.
 *
 * @remarks
 * Graphics instances are **rented** when a shape is hovered and **returned** on
 * pointer-out. The pool size caps the number of simultaneous halos (default 40).
 * When the pool is exhausted, additional halos are silently skipped rather than
 * allocating new objects.
 *
 * This class is internal to {@link ShapePlugin}.
 */
export class HaloPool {
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
   * Rent a halo `Graphics` for a shape and attach it to the scene layer.
   * Draws the halo immediately using the shape’s `halo` spec.
   * No-op if the shape already has a rented halo.
   *
   * @param shape - The {@link ShapeObject} to render a halo for.
   */
  rent(shape: ShapeObject): void {
    if (this._rented.has(shape.id)) return; // already rented
    const g = this._pool.pop();
    if (!g) return; // pool exhausted — silently skip

    this._drawHalo(g, shape);
    this._scene.addChild(g);
    this._rented.set(shape.id, g);
  }

  /**
   * Return the halo for a shape back to the pool.
   * Removes it from the scene layer and clears the `Graphics` for reuse.
   *
   * @param shapeId - Id of the shape whose halo should be returned.
   */
  return(shapeId: string): void {
    const g = this._rented.get(shapeId);
    if (!g) return;
    this._scene.removeChild(g);
    g.clear();
    this._pool.push(g);
    this._rented.delete(shapeId);
  }

  /**
   * Redraw the currently-rented halo for a shape.
   * Called by {@link AnimationTicker} on each frame for animated halos.
   *
   * @param shape - The {@link ShapeObject} whose halo should be redrawn.
   */
  redraw(shape: ShapeObject): void {
    const g = this._rented.get(shape.id);
    if (!g) return;
    g.clear();
    this._drawHalo(g, shape);
  }

  /** Return all currently rented halos to the pool. */
  returnAll(): void {
    for (const [id] of this._rented) {
      this.return(id);
    }
  }

  /**
   * Return all halos and destroy all `Graphics` instances.
   * Called by {@link ShapePlugin.destroy}.
   */
  destroy(): void {
    this.returnAll();
    for (const g of this._pool) g.destroy();
    this._pool = [];
  }

  private _drawHalo(g: Graphics, shape: ShapeObject): void {
    const halo = shape.spec.halo;
    if (!halo) return;

    const cx = 'x' in shape.spec ? (shape.spec as { x: number }).x : shape.bbox.minX + (shape.bbox.maxX - shape.bbox.minX) / 2;
    const cy = 'y' in shape.spec ? (shape.spec as { y: number }).y : shape.bbox.minY + (shape.bbox.maxY - shape.bbox.minY) / 2;
    const baseRadius = 'radius' in shape.spec ? (shape.spec as { radius: number }).radius : 20;

    drawCircleGlow(g, {
      x: cx,
      y: cy,
      radius: baseRadius,
      glowSize: halo.radius,
      layers: 8,
    }, {
      color: halo.color,
      alpha: halo.alpha ?? 0.35,
    });
  }
}
