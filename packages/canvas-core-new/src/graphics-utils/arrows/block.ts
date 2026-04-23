import type { Graphics } from 'pixi.js';
import type { ArrowStyle, ArrowParams } from './types.js';

/**
 * Block (wide filled) arrowhead — a broad rectangle-like filled arrow.
 */
export function drawBlockArrow(g: Graphics, params: ArrowParams, style: ArrowStyle = {}): void {
  const { x, y, angle, size } = params;
  const { fill = 0xffffff, fillAlpha = 1, stroke = 0xffffff, strokeWidth = 1, strokeAlpha = 1 } = style;

  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  const hw = size * 0.55; // half-width
  const depth = size;

  // Wide block: tip → upper-back → lower-back
  const pts: Array<[number, number]> = [
    [0, 0],
    [-depth, -hw],
    [-depth, hw],
  ];

  const first = pts[0]!;
  g.moveTo(x + first[0] * cos - first[1] * sin, y + first[0] * sin + first[1] * cos);
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i]!;
    g.lineTo(x + p[0] * cos - p[1] * sin, y + p[0] * sin + p[1] * cos);
  }
  g.closePath();
  g.fill({ color: fill, alpha: fillAlpha });
  g.stroke({ color: stroke, width: strokeWidth, alpha: strokeAlpha });
}
