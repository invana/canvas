// ── PolygonShape ──────────────────────────────────────────────────────────────

import { BaseShape, LOD } from '../BaseShape.js';
import { buildPolygonPoints } from '@invana/canvas';
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

  getConnectionPoint(toX: number, toY: number): Point {
    const { x, y, radius, sides, rotation = -Math.PI / 2 } = this.spec;
    const verts = buildPolygonPoints(x, y, radius, sides, rotation);
    const angle = Math.atan2(toY - y, toX - x);

    const n = verts.length / 2;
    for (let i = 0; i < n; i++) {
      const ax = verts[i * 2]!, ay = verts[i * 2 + 1]!;
      const bx = verts[((i + 1) % n) * 2]!, by = verts[((i + 1) % n) * 2 + 1]!;
      const pt = this._rayEdgeIntersect(x, y, angle, ax, ay, bx, by);
      if (pt) return pt;
    }
    return { x: x + Math.cos(angle) * radius, y: y + Math.sin(angle) * radius };
  }

  private _rayEdgeIntersect(
    ox: number, oy: number, angle: number,
    ax: number, ay: number, bx: number, by: number,
  ): Point | null {
    const dx = Math.cos(angle), dy = Math.sin(angle);
    const ex = bx - ax, ey = by - ay;
    const denom = dx * ey - dy * ex;
    if (Math.abs(denom) < 1e-8) return null;
    const t = ((ax - ox) * ey - (ay - oy) * ex) / denom;
    const s = ((ax - ox) * dy - (ay - oy) * dx) / denom;
    if (t > 0 && s >= 0 && s <= 1) {
      return { x: ox + dx * t, y: oy + dy * t };
    }
    return null;
  }
}

/** @deprecated Use {@link PolygonShape} instead. */
export { PolygonShape as PolygonNode };
