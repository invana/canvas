// ── RectNode ──────────────────────────────────────────────────────────────────

import { BaseNode, LOD } from '../BaseNode.js';
import type { DrawContext } from '../DrawContext.js';
import type { BaseNodeSpec, BBox, Point } from '../spec/index.js';

/** Spec for a rectangle node. */
export interface RectNodeSpec extends BaseNodeSpec {
  /** Width in world-space pixels. */
  width: number;
  /** Height in world-space pixels. */
  height: number;
  /** Corner radius.  0 = sharp corners. */
  cornerRadius?: number;
}

/**
 * A filled/stroked rectangle node.
 *
 * @remarks
 * `x`, `y` in the spec refer to the **top-left** corner of the rectangle.
 *
 * `getConnectionPoint()` returns the intersection of the line from the rect's
 * centre to the target with the nearest edge.
 */
export class RectNode extends BaseNode<RectNodeSpec> {
  draw(ctx: DrawContext, detail: LOD): void {
    const { x, y, width, height, cornerRadius = 0, label } = this.spec;
    const style = this.resolveStyle();

    if (detail === LOD.DOT) {
      const cx = x + width / 2, cy = y + height / 2;
      ctx.fillCircle(cx, cy, 2, { fill: style.fill ?? '#888888' });
      return;
    }

    ctx.fillRect(x, y, width, height, { ...style, cornerRadius });

    if (detail >= LOD.DETAIL && label) {
      ctx.drawLabel(label, x + width / 2, y + height / 2);
    }
  }

  getBBox(): BBox {
    const { x, y, width, height } = this.spec;
    return { minX: x, minY: y, maxX: x + width, maxY: y + height };
  }

  getCenter(): Point {
    const { x, y, width, height } = this.spec;
    return { x: x + width / 2, y: y + height / 2 };
  }

  getConnectionPoint(toX: number, toY: number): Point {
    const { x, y, width, height } = this.spec;
    const cx = x + width / 2, cy = y + height / 2;
    const dx = toX - cx, dy = toY - cy;

    if (dx === 0 && dy === 0) return { x: cx, y };

    const hw = width / 2, hh = height / 2;
    const tx = hw / Math.abs(dx || 1), ty = hh / Math.abs(dy || 1);
    const t = Math.min(tx, ty);
    return { x: cx + dx * t, y: cy + dy * t };
  }

  hitTest(wx: number, wy: number): boolean {
    const { x, y, width, height } = this.spec;
    return wx >= x && wx <= x + width && wy >= y && wy <= y + height;
  }
}
