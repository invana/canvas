import type { Graphics } from 'pixi.js';
import type { ArrowStyle, ArrowParams } from './types.js';

/**
 * Ellipse (oval) arrowhead marker.
 * `params.size` controls the x-radius; ry = size * 0.6 by default.
 */
export function drawEllipseArrow(
  g: Graphics,
  params: ArrowParams,
  style: ArrowStyle = {},
  rx?: number,
  ry?: number,
): void {
  const { x, y, angle, size } = params;
  const { fill = 0xffffff, fillAlpha = 1, stroke = 0xffffff, strokeWidth = 1, strokeAlpha = 1 } = style;

  const radiusX = rx ?? size * 0.5;
  const radiusY = ry ?? size * 0.35;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  // Centre the ellipse half a radiusX behind the tip
  const cx = x + (-radiusX) * cos;
  const cy = y + (-radiusX) * sin;

  // Draw ellipse via Bézier approximation (rotated)
  const kappa = 0.5522848;
  const ox = radiusX * kappa;
  const oy = radiusY * kappa;

  function pt(lx: number, ly: number): [number, number] {
    return [cx + lx * cos - ly * sin, cy + lx * sin + ly * cos];
  }

  const [x0, y0] = pt(0, -radiusY);
  const [x1, y1] = pt(radiusX, 0);
  const [x2, y2] = pt(0, radiusY);
  const [x3, y3] = pt(-radiusX, 0);

  g.moveTo(x0!, y0!);
  g.bezierCurveTo(...pt(ox, -radiusY), ...pt(radiusX, -oy), x1!, y1!);
  g.bezierCurveTo(...pt(radiusX, oy), ...pt(ox, radiusY), x2!, y2!);
  g.bezierCurveTo(...pt(-ox, radiusY), ...pt(-radiusX, oy), x3!, y3!);
  g.bezierCurveTo(...pt(-radiusX, -oy), ...pt(-ox, -radiusY), x0!, y0!);
  g.closePath();
  g.fill({ color: fill, alpha: fillAlpha });
  g.stroke({ color: stroke, width: strokeWidth, alpha: strokeAlpha });
}
