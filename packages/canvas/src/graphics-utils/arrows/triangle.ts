import type { Graphics } from 'pixi.js';
import type { ArrowStyle, ArrowParams } from './types.js';

function poly(
  g: Graphics,
  cx: number,
  cy: number,
  angle: number,
  pts: Array<[number, number]>,
  style: ArrowStyle,
  filled: boolean,
): void {
  const { fill = 0xffffff, fillAlpha = 1, stroke = 0xffffff, strokeWidth = 1, strokeAlpha = 1 } = style;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const first = pts[0]!;
  g.moveTo(cx + first[0] * cos - first[1] * sin, cy + first[0] * sin + first[1] * cos);
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i]!;
    g.lineTo(cx + p[0] * cos - p[1] * sin, cy + p[0] * sin + p[1] * cos);
  }
  g.closePath();
  if (filled) {
    g.fill({ color: fill, alpha: fillAlpha });
  } else {
    g.stroke({ color: stroke, width: strokeWidth, alpha: strokeAlpha });
  }
}

export function drawTriangleArrow(g: Graphics, params: ArrowParams, style: ArrowStyle = {}): void {
  const { x, y, angle, size } = params;
  const pts: Array<[number, number]> = [[0, 0], [-size, -size * 0.5], [-size, size * 0.5]];
  poly(g, x, y, angle, pts, style, true);
}

export function drawTriangleOutlineArrow(g: Graphics, params: ArrowParams, style: ArrowStyle = {}): void {
  const { x, y, angle, size } = params;
  const pts: Array<[number, number]> = [[0, 0], [-size, -size * 0.5], [-size, size * 0.5]];
  poly(g, x, y, angle, pts, style, false);
}

export function drawThinTriangleArrow(g: Graphics, params: ArrowParams, style: ArrowStyle = {}): void {
  const { x, y, angle, size } = params;
  const pts: Array<[number, number]> = [[0, 0], [-size, -size * 0.25], [-size, size * 0.25]];
  poly(g, x, y, angle, pts, style, true);
}
