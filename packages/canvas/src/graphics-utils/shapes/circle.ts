import type { Graphics } from 'pixi.js';
import { type DrawStyle, resolveFillArg } from '../types.js';
import { type DashStyle } from './dashed.js';

/** Draw a filled/stroked circle. */
export function drawCircle(
  g: Graphics,
  x: number,
  y: number,
  radius: number,
  style: DrawStyle = {},
): void {
  const { fill, fillAlpha = 1, stroke, strokeWidth = 1, strokeAlpha = 1, strokeCap, strokeJoin, strokeAlignment, strokeMiterLimit } = style;
  const fillArg = resolveFillArg(fill, fillAlpha);
  if (fillArg !== undefined) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    g.circle(x, y, radius).fill(fillArg as any);
  }
  if (stroke !== undefined) {
    g.circle(x, y, radius).stroke({ color: stroke, width: strokeWidth, alpha: strokeAlpha, cap: strokeCap, join: strokeJoin, alignment: strokeAlignment, miterLimit: strokeMiterLimit });
  }
}

/** Draw a dashed circle border. */
export function drawDashedCircle(
  g: Graphics,
  x: number,
  y: number,
  radius: number,
  style: DashStyle = {},
): void {
  const { color = 0xffffff, strokeWidth = 1, alpha = 1, dashLength = 8, gapLength: _gap, dotSpacing, offset = 0 } = style;
  const gapLength = _gap ?? dotSpacing ?? 4;
  const circumference = 2 * Math.PI * radius;
  const pattern = dashLength + gapLength;
  const segmentCount = Math.floor(circumference / pattern);
  const angleOffset = (offset / circumference) * 2 * Math.PI;

  for (let i = 0; i < segmentCount; i++) {
    const startAngle = (i * pattern) / radius + angleOffset;
    const endAngle = (i * pattern + dashLength) / radius + angleOffset;
    const x1 = x + radius * Math.cos(startAngle);
    const y1 = y + radius * Math.sin(startAngle);
    const x2 = x + radius * Math.cos(endAngle);
    const y2 = y + radius * Math.sin(endAngle);
    g.moveTo(x1, y1);
    g.arcTo(x1, y1, x2, y2, radius);
    g.stroke({ color, width: strokeWidth, alpha, alignment: 0.5 });
  }
}

export type { DashStyle };
