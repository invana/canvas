// ── PolylineShape ─────────────────────────────────────────────────────────────
// Free-form shape backed by a closed polyline. Use this for any custom shape
// (leaf, guitar, toy, country outline) that can be expressed as a list of
// perimeter points. Connectors automatically anchor at the perimeter via
// `rayBoundaryHit`; no per-shape geometry code required.

import { rayPointAt, rayVsPolyline } from '@invana/canvas-deprecated';
import { BaseShape, LOD } from '../BaseShape.js';
import type { DrawContext } from '../DrawContext.js';
import type { BaseShapeSpec, BBox, Point } from '../spec/index.js';

/** Spec for a free-form polyline / polygon shape. */
export interface PolylineShapeSpec extends BaseShapeSpec {
  /**
   * Perimeter points in world coordinates, ordered (CW or CCW).
   * The shape's `(x, y)` from {@link BaseShapeSpec} is ignored — points carry
   * their own absolute positions. To translate the shape, update every point.
   *
   * For a closed shape, do **not** repeat the first point at the end; the
   * closing edge is implicit.
   */
  points: Point[];
  /**
   * Whether to treat the polyline as closed (filled). Default: `true`.
   * Set to `false` for an open path (stroke only).
   */
  closed?: boolean;
}

/**
 * A free-form shape defined by a list of perimeter points.
 *
 * @remarks
 * Caches a flat `Float32Array` of the perimeter for fast ray-cast boundary
 * tests. The cache is invalidated whenever {@link BaseShape.onUpdate} fires.
 *
 * @example
 * ```ts
 * shapesPlugin.registerShape('leaf', PolylineShape);
 * shapesPlugin.addShape('leaf', {
 *   id: 'leaf-1', x: 0, y: 0,    // x,y are unused for polylines but required
 *   points: leafOutlineWorldPoints,
 *   style: { fill: '#22c55e', stroke: '#15803d', strokeWidth: 2 },
 * });
 * ```
 */
export class PolylineShape extends BaseShape<PolylineShapeSpec> {
  private _flat: Float32Array | null = null;
  private _bbox: BBox | null = null;
  private _centre: Point | null = null;

  private _ensureCache(): Float32Array {
    if (this._flat) return this._flat;
    const pts = this.spec.points;
    const out = new Float32Array(pts.length * 2);
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let sumX = 0, sumY = 0;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i]!;
      out[i * 2]     = p.x;
      out[i * 2 + 1] = p.y;
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
      sumX += p.x;
      sumY += p.y;
    }
    this._flat = out;
    this._bbox = { minX, minY, maxX, maxY };
    this._centre = { x: sumX / pts.length, y: sumY / pts.length };
    return out;
  }

  drawBody(ctx: DrawContext, detail: LOD): void {
    const flat = this._ensureCache();
    const c    = this._centre!;
    const style = this.resolveStyle();

    if (detail === LOD.DOT) {
      ctx.fillCircle(c.x, c.y, 2, { fill: style.fill ?? '#888888' });
      return;
    }

    ctx.fillPolyline(flat, { ...style, closed: this.spec.closed ?? true });
  }

  /**
   * Halo for free-form shapes: push every perimeter vertex outward from the
   * centroid by `halo.offset + halo.width / 2`. Approximates a polygon offset
   * for convex shapes and gives a visually correct ring for concave ones.
   */
  drawHalo(ctx: DrawContext, detail: LOD): void {
    if (detail === LOD.DOT || !this.isHaloActive()) return;
    const flat = this._ensureCache();
    const c    = this._centre!;
    const halo = this.resolveHalo();
    const push = halo.offset + halo.width / 2;
    const offset = new Float32Array(flat.length);
    for (let i = 0; i < flat.length; i += 2) {
      const dx = flat[i]! - c.x;
      const dy = flat[i + 1]! - c.y;
      const len = Math.hypot(dx, dy);
      if (len < 1e-6) {
        offset[i]     = flat[i]!;
        offset[i + 1] = flat[i + 1]!;
      } else {
        const k = (len + push) / len;
        offset[i]     = c.x + dx * k;
        offset[i + 1] = c.y + dy * k;
      }
    }
    ctx.fillPolyline(offset, {
      ...this.resolveHaloStyle(),
      closed: this.spec.closed ?? true,
    });
  }

  getBBox(): BBox {
    this._ensureCache();
    return { ...this._bbox! };
  }

  getCenter(): Point {
    this._ensureCache();
    return { ...this._centre! };
  }

  rayBoundaryHit(origin: Point, dir: Point): Point | null {
    const flat = this._ensureCache();
    const closed = this.spec.closed ?? true;
    const hit = rayVsPolyline(origin.x, origin.y, dir.x, dir.y, flat, closed);
    if (hit === null) return null;
    return rayPointAt(origin.x, origin.y, dir.x, dir.y, hit.t);
  }

  override onUpdate(): void {
    this._flat = null;
    this._bbox = null;
    this._centre = null;
  }
}
