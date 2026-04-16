import type { Graphics } from 'pixi.js';
import type { DrawStyle } from '../types.js';

/** Draw a filled/stroked circle. */
export function drawCircle(
  g: Graphics,
  x: number,
  y: number,
  radius: number,
  style: DrawStyle = {},
): void {
  const { fill, fillAlpha = 1, stroke, strokeWidth = 1, strokeAlpha = 1 } = style;
  if (fill !== undefined) {
    g.circle(x, y, radius).fill({ color: fill, alpha: fillAlpha });
  }
  if (stroke !== undefined) {
    g.circle(x, y, radius).stroke({ color: stroke, width: strokeWidth, alpha: strokeAlpha });
  }
}
