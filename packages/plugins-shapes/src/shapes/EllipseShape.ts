// ── EllipseShape ──────────────────────────────────────────────────────────────

import { BaseShape, LOD } from '../BaseShape.js';
import type { DrawContext } from '../DrawContext.js';
import type { BaseShapeSpec, BBox, Point } from '../spec/index.js';

/** Spec for an ellipse shape. */
export interface EllipseShapeSpec extends BaseShapeSpec {
  /** Horizontal radius in world-space pixels. */
  radiusX: number;
  /** Vertical radius in world-space pixels. */
  radiusY: number;
}

/** @deprecated Use {@link EllipseShapeSpec} instead. */
export type EllipseNodeSpec = EllipseShapeSpec;

/**
 * A filled/stroked ellipse shape.
 *
 * @remarks
 * `x`, `y` in the spec refer to the **centre** of the ellipse.
 */
export class EllipseShape extends BaseShape<EllipseShapeSpec> {
  draw(ctx: DrawContext, detail: LOD): void {
    const { x, y, radiusX, radiusY, label } = this.spec;
    const style = this.resolveStyle();

    if (detail === LOD.DOT) {
      ctx.fillCircle(x, y, 2, { fill: style.fill ?? '#888888' });
      return;
    }

    ctx.fillEllipse(x, y, radiusX, radiusY, style);

    if (detail >= LOD.DETAIL && label) {
      ctx.drawLabel(label, x, y);
    }
  }

  getBBox(): BBox {
    const { x, y, radiusX, radiusY } = this.spec;
    return {
      minX: x - radiusX, minY: y - radiusY,
      maxX: x + radiusX, maxY: y + radiusY,
    };
  }

  getCenter(): Point {
    return { x: this.spec.x, y: this.spec.y };
  }

  getConnectionPoint(toX: number, toY: number): Point {
    const { x, y, radiusX, radiusY } = this.spec;
    const angle = Math.atan2(toY - y, toX - x);
    return {
      x: x + radiusX * Math.cos(angle),
      y: y + radiusY * Math.sin(angle),
    };
  }

  hitTest(wx: number, wy: number): boolean {
    const { x, y, radiusX, radiusY } = this.spec;
    const dx = (wx - x) / radiusX, dy = (wy - y) / radiusY;
    return dx * dx + dy * dy <= 1;
  }
}

/** @deprecated Use {@link EllipseShape} instead. */
export { EllipseShape as EllipseNode };
