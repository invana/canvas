import type { Graphics } from 'pixi.js';
import type { PathStyle } from '../types.js';

/** Draw a straight line between two points. */
export function drawLine(
  g: Graphics,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  style: PathStyle = {},
): void {
  const { stroke = 0xffffff, strokeWidth = 1, strokeAlpha = 1, strokeCap, strokeJoin, strokeAlignment, strokeMiterLimit } = style;
  g.moveTo(x1, y1).lineTo(x2, y2).stroke({ color: stroke, width: strokeWidth, alpha: strokeAlpha, cap: strokeCap, join: strokeJoin, alignment: strokeAlignment, miterLimit: strokeMiterLimit });
}
