import type { Graphics } from 'pixi.js';
import { type DrawStyle, resolveFillArg } from '../types.js';

/** Draw a filled/stroked ellipse. x,y = center. */
export function drawEllipse(
  g: Graphics,
  x: number,
  y: number,
  radiusX: number,
  radiusY: number,
  style: DrawStyle = {},
): void {
  const { fill, fillAlpha = 1, stroke, strokeWidth = 1, strokeAlpha = 1 } = style;
  const fillArg = resolveFillArg(fill, fillAlpha);
  if (fillArg !== undefined) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    g.ellipse(x, y, radiusX, radiusY).fill(fillArg as any);
  }
  if (stroke !== undefined) {
    g.ellipse(x, y, radiusX, radiusY).stroke({ color: stroke, width: strokeWidth, alpha: strokeAlpha });
  }
}
