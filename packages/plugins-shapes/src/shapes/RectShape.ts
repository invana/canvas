// ── RectShape ─────────────────────────────────────────────────────────────────

import { BaseShape, LOD } from '../BaseShape.js';
import type { DrawContext } from '../DrawContext.js';
import type { BaseShapeSpec, BBox, Point } from '../spec/index.js';

/** Spec for a rectangle shape. */
export interface RectShapeSpec extends BaseShapeSpec {
  /** Width in world-space pixels. */
  width: number;
  /** Height in world-space pixels. */
  height: number;
  /** Corner radius.  0 = sharp corners. */
  cornerRadius?: number;
}

/** @deprecated Use {@link RectShapeSpec} instead. */
export type RectNodeSpec = RectShapeSpec;

/**
 * A filled/stroked rectangle shape.
 *
 * @remarks
 * `x`, `y` in the spec refer to the **top-left** corner of the rectangle.
 */
export class RectShape extends BaseShape<RectShapeSpec> {
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

/** @deprecated Use {@link RectShape} instead. */
export { RectShape as RectNode };
