// ── StarShape ─────────────────────────────────────────────────────────────────

import { buildStarPoints, rayPointAt, rayVsPolyline } from '@invana/canvas-deprecated';
import { BaseShape, LOD } from '../BaseShape.js';
import type { DrawContext } from '../DrawContext.js';
import type { BaseShapeSpec, BBox, Point } from '../spec/index.js';

/** Spec for a star shape. */
export interface StarShapeSpec extends BaseShapeSpec {
  /** Outer radius in world-space pixels. */
  radius: number;
  /** Number of points (default: 5). */
  points?: number;
  /** Inner radius as a fraction of the outer radius (default: 0.42). */
  innerRatio?: number;
  /** Initial rotation in radians (default: `–Math.PI / 2` = point up). */
  rotation?: number;
}

/** @deprecated Use {@link StarShapeSpec} instead. */
export type StarNodeSpec = StarShapeSpec;

/**
 * A star-shaped element.
 */
export class StarShape extends BaseShape<StarShapeSpec> {
  private _boundaryCache: number[] | null = null;
  private _cacheKey = '';

  private _polyline(): number[] {
    const { x, y, radius, points = 5, innerRatio = 0.42, rotation = -Math.PI / 2 } = this.spec;
    const key = `${x},${y},${radius},${points},${innerRatio},${rotation}`;
    if (this._boundaryCache && this._cacheKey === key) return this._boundaryCache;
    this._boundaryCache = buildStarPoints(x, y, radius, points, innerRatio, rotation);
    this._cacheKey = key;
    return this._boundaryCache;
  }

  drawBody(ctx: DrawContext, detail: LOD): void {
    const { x, y, radius, points = 5, innerRatio = 0.42, rotation } = this.spec;
    const style = this.resolveStyle();

    if (detail === LOD.DOT) {
      ctx.fillCircle(x, y, 2, { fill: style.fill ?? '#888888' });
      return;
    }

    ctx.fillStar(x, y, radius, { ...style, points, innerRatio, rotation });
  }

  drawHalo(ctx: DrawContext, detail: LOD): void {
    if (detail === LOD.DOT || !this.isHaloActive()) return;
    const { x, y, radius, points = 5, innerRatio = 0.42, rotation } = this.spec;
    const halo = this.resolveHalo();
    const r = radius + halo.offset + halo.width / 2;
    ctx.fillStar(x, y, r, {
      ...this.resolveHaloStyle(),
      points,
      innerRatio,
      rotation,
    });
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

/** @deprecated Use {@link StarShape} instead. */
export { StarShape as StarNode };
