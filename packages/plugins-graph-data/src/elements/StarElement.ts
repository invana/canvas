// ── StarElement ───────────────────────────────────────────────────────────────

import { BaseNode, LOD } from '../BaseNode.js';
import type { DrawContext } from '../DrawContext.js';
import type { BaseNodeSpec, BBox, Point } from '../spec/index.js';

/** Spec for a star element. */
export interface StarElementSpec extends BaseNodeSpec {
  /** Outer radius in world-space pixels. */
  radius: number;
  /** Number of points (default: 5). */
  points?: number;
  /** Inner radius as a fraction of the outer radius (default: 0.42). */
  innerRatio?: number;
  /** Initial rotation in radians (default: `–Math.PI / 2` = point up). */
  rotation?: number;
}

/**
 * A star-shaped element.
 *
 * @remarks
 * `x`, `y` refer to the **centre** of the star.
 * `getConnectionPoint()` approximates the nearest outer edge using the
 * circumscribed-circle approach — suitable for most use cases.
 */
export class StarElement extends BaseNode<StarElementSpec> {
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
    // Approximate: use circumscribed circle for connection math
    const { x, y, radius } = this.spec;
    const dx = toX - x, dy = toY - y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    return { x: x + (dx / len) * radius, y: y + (dy / len) * radius };
  }
}
