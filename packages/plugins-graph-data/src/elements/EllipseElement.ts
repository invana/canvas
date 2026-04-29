// ── EllipseElement ────────────────────────────────────────────────────────────

import { BaseNode, LOD } from '../BaseNode.js';
import type { DrawContext } from '../DrawContext.js';
import type { BaseNodeSpec, BBox, Point } from '../spec/index.js';

/** Spec for an ellipse element. */
export interface EllipseElementSpec extends BaseNodeSpec {
  /** Horizontal radius in world-space pixels. */
  radiusX: number;
  /** Vertical radius in world-space pixels. */
  radiusY: number;
}

/**
 * A filled/stroked ellipse element.
 *
 * @remarks
 * `x`, `y` in the spec refer to the **centre** of the ellipse.
 * `getConnectionPoint()` uses the parametric ellipse angle approximation.
 */
export class EllipseElement extends BaseNode<EllipseElementSpec> {
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
