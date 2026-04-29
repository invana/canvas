// ── PolygonElement ────────────────────────────────────────────────────────────

import { BaseNode, LOD } from '../BaseNode.js';
import { buildPolygonPoints } from '@invana/canvas';
import type { DrawContext } from '../DrawContext.js';
import type { BaseNodeSpec, BBox, Point } from '../spec/index.js';

/** Spec for a regular polygon element. */
export interface PolygonElementSpec extends BaseNodeSpec {
  /** Circumscribed radius in world-space pixels. */
  radius: number;
  /** Number of sides (3 = triangle, 4 = diamond/square, 6 = hexagon, …). */
  sides: number;
  /** Initial rotation offset in radians.  Default: `–Math.PI / 2` (point up). */
  rotation?: number;
}

/**
 * A regular polygon element (triangle, pentagon, hexagon, etc.).
 *
 * @remarks
 * `x`, `y` refer to the **centre** of the polygon.
 * `getConnectionPoint()` finds the nearest polygon edge and returns the
 * intersection of the edge with the line from centre to target.
 *
 * For diamond (4-sided, rotated 45°) use {@link DiamondElement} instead.
 */
export class PolygonElement extends BaseNode<PolygonElementSpec> {
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
    // Circumscribed circle bbox is always safe for culling
    return { minX: x - radius, minY: y - radius, maxX: x + radius, maxY: y + radius };
  }

  getCenter(): Point {
    return { x: this.spec.x, y: this.spec.y };
  }

  getConnectionPoint(toX: number, toY: number): Point {
    const { x, y, radius, sides, rotation = -Math.PI / 2 } = this.spec;
    const verts = buildPolygonPoints(x, y, radius, sides, rotation);
    const angle = Math.atan2(toY - y, toX - x);

    // Find the edge that the ray from centre in `angle` crosses
    const n = verts.length / 2;
    for (let i = 0; i < n; i++) {
      const ax = verts[i * 2]!, ay = verts[i * 2 + 1]!;
      const bx = verts[((i + 1) % n) * 2]!, by = verts[((i + 1) % n) * 2 + 1]!;
      const pt = this._rayEdgeIntersect(x, y, angle, ax, ay, bx, by);
      if (pt) return pt;
    }
    // Fallback: circumscribed circle point
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
