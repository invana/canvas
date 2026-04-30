// ── PolygonShape ──────────────────────────────────────────────────────────────

import { BaseShape, LOD } from '../BaseShape.js';
import { buildPolygonPoints, rayPointAt, rayVsPolyline } from '@invana/canvas';
import type { DrawContext } from '../DrawContext.js';
import type { BaseShapeSpec, BBox, Point } from '../spec/index.js';

/** Spec for a regular polygon shape. */
export interface PolygonShapeSpec extends BaseShapeSpec {
  /** Circumscribed radius in world-space pixels. */
  radius: number;
  /** Number of sides (3 = triangle, 4 = diamond/square, 6 = hexagon, …). */
  sides: number;
  /** Initial rotation offset in radians.  Default: `–Math.PI / 2` (point up). */
  rotation?: number;
}

/** @deprecated Use {@link PolygonShapeSpec} instead. */
export type PolygonNodeSpec = PolygonShapeSpec;

/**
 * A regular polygon shape (triangle, pentagon, hexagon, etc.).
 */
export class PolygonShape extends BaseShape<PolygonShapeSpec> {
  /**
   * Cached perimeter polyline as a flat `[x0,y0,x1,y1,...]` array.
   * Rebuilt lazily; invalidated whenever a geometry-affecting spec field changes.
   * @internal
   */
  private _boundaryCache: number[] | null = null;
  private _cacheKey = '';

  /** Build (or reuse) the flat polygon vertex array used for boundary tests. */
  private _polyline(): number[] {
    const { x, y, radius, sides, rotation = -Math.PI / 2 } = this.spec;
    const key = `${x},${y},${radius},${sides},${rotation}`;
    if (this._boundaryCache && this._cacheKey === key) return this._boundaryCache;
    this._boundaryCache = buildPolygonPoints(x, y, radius, sides, rotation);
    this._cacheKey = key;
    return this._boundaryCache;
  }

  draw(ctx: DrawContext, detail: LOD): void {
    const { x, y, radius, sides, rotation, label } = this.spec;
    const style = this.resolveStyle();

    if (detail === LOD.DOT) {
      ctx.fillCircle(x, y, 2, { fill: style.fill ?? '#888888' });
      return;
    }

    ctx.fillPolygon(x, y, radius, sides, { ...style, rotation });

    if (detail >= LOD.DETAIL && label) {
      ctx.drawLabel(label, x, y);
    }
  }

  getBBox(): BBox {
    const { x, y, radius } = this.spec;
    return { minX: x - radius, minY: y - radius, maxX: x + radius, maxY: y + radius };
  }

  getCenter(): Point {
    return { x: this.spec.x, y: this.spec.y };
  }

  rayBoundaryHit(origin: Point, dir: Point): Point | null {
    const verts = this._polyline();
    const hit = rayVsPolyline(origin.x, origin.y, dir.x, dir.y, verts, true);
    if (hit === null) return null;
    return rayPointAt(origin.x, origin.y, dir.x, dir.y, hit.t);
  }

  override onUpdate(): void {
    this._boundaryCache = null;
  }
}

/** @deprecated Use {@link PolygonShape} instead. */
export { PolygonShape as PolygonNode };
