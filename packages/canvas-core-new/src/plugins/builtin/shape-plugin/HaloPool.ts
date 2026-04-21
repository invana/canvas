// ── HaloPool ──────────────────────────────────────────────────────────────────
// Fixed pool of Graphics objects for halos.
// Rented on pointerover/select, returned on pointerout/deselect.
// Pool size is constant — at most poolSize halos exist in the scene at once.

import { Graphics } from 'pixi.js';
import type { Container } from 'pixi.js';
import type { ShapeObject } from './ShapeObject.js';
import { drawCircleGlow } from '../../../graphics-utils/index.js';

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

  /** Rent a halo Graphics for a shape. Draws the halo immediately. */
  rent(shape: ShapeObject): void {
    if (this._rented.has(shape.id)) return; // already rented
    const g = this._pool.pop();
    if (!g) return; // pool exhausted — silently skip

    this._drawHalo(g, shape);
    this._scene.addChild(g);
    this._rented.set(shape.id, g);
  }

  /** Return the halo for a shape back to the pool. */
  return(shapeId: string): void {
    const g = this._rented.get(shapeId);
    if (!g) return;
    this._scene.removeChild(g);
    g.clear();
    this._pool.push(g);
    this._rented.delete(shapeId);
  }

  /** Redraw a currently-rented halo (called by AnimationTicker for animated halos) */
  redraw(shape: ShapeObject): void {
    const g = this._rented.get(shape.id);
    if (!g) return;
    g.clear();
    this._drawHalo(g, shape);
  }

  returnAll(): void {
    for (const [id] of this._rented) {
      this.return(id);
    }
  }

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
