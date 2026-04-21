import type { Graphics } from 'pixi.js';
import { type DrawStyle, resolveFillArg } from '../types.js';

/** Draw a filled/stroked circle. */
export function drawCircle(
  g: Graphics,
  x: number,
  y: number,
  radius: number,
  style: DrawStyle = {},
): void {
  const { fill, fillAlpha = 1, stroke, strokeWidth = 1, strokeAlpha = 1 } = style;
  const fillArg = resolveFillArg(fill, fillAlpha);
  if (fillArg !== undefined) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    g.circle(x, y, radius).fill(fillArg as any);
  }
  if (stroke !== undefined) {
    g.circle(x, y, radius).stroke({ color: stroke, width: strokeWidth, alpha: strokeAlpha });
  }
}
