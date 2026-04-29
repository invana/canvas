// ── StarShape ─────────────────────────────────────────────────────────────────

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
  draw(ctx: DrawContext, detail: LOD): void {
    const { x, y, radius, points = 5, innerRatio = 0.42, rotation, label } = this.spec;
    const style = this.resolveStyle();

    if (detail === LOD.DOT) {
      ctx.fillCircle(x, y, 2, { fill: style.fill ?? '#888888' });
      return;
    }

    ctx.fillStar(x, y, radius, { ...style, points, innerRatio, rotation });

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
    const { x, y, radius } = this.spec;
    const dx = toX - x, dy = toY - y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    return { x: x + (dx / len) * radius, y: y + (dy / len) * radius };
  }
}

/** @deprecated Use {@link StarShape} instead. */
export { StarShape as StarNode };
