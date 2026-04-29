// ── HaloPool ───────────────────────────────────────────────────────────────────
// Fixed pool of Graphics objects for per-node pulse animation rings.
// Rented by pulseHandler.init() and returned by pulseHandler.cleanup().

import { Graphics } from 'pixi.js';
import type { Container } from 'pixi.js';
import type { BaseNode } from './BaseNode.js';

/**
 * `HaloPool` is a fixed-size pool of pre-allocated `PIXI.Graphics` for
 * rendering pulse animation rings without allocating at runtime.
 *
 * @remarks
 * Uses {@link BaseNode.getCenter} and {@link BaseNode.getBBox} for coordinates.
 * Ring geometry is always circular; radius is derived from the bounding box extents.
 *
 * This class is internal to {@link GraphPlugin}.
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
   * Rent a `Graphics` instance for a pulse animation on the given node.
   * No-op if the node already has a rented graphics.
   */
  rentForPulse(node: BaseNode): void {
    const id = node.spec.id;
    if (this._rented.has(id)) return;
    const g = this._pool.pop();
    if (!g) return;
    this._scene.addChild(g);
    this._rented.set(id, g);
  }

  /**
   * Redraw expanding ripple rings for a pulse animation frame.
   */
  redrawPulse(node: BaseNode, progress: number, maxRadius: number, color: string): void {
    const g = this._rented.get(node.spec.id);
    if (!g) return;
    g.clear();

    const center = node.getCenter();
    const bbox = node.getBBox();
    const baseRadius = Math.max(bbox.maxX - bbox.minX, bbox.maxY - bbox.minY) / 2;
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
   * Return the rented graphics for a node back to the pool.
   */
  return(nodeId: string): void {
    const g = this._rented.get(nodeId);
    if (!g) return;
    this._scene.removeChild(g);
    g.clear();
    this._pool.push(g);
    this._rented.delete(nodeId);
  }

  /** Return all currently rented graphics to the pool. */
  returnAll(): void {
    for (const [id] of this._rented) {
      this.return(id);
    }
  }

  /**
   * Return all rented graphics and destroy all `Graphics` instances.
   * Called by {@link GraphPlugin.destroy}.
   */
  destroy(): void {
    this.returnAll();
    for (const g of this._pool) g.destroy();
    this._pool = [];
  }
}
