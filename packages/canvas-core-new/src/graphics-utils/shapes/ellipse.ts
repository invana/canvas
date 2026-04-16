import type { Graphics } from 'pixi.js';
import type { DrawStyle } from '../types.js';

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
  if (fill !== undefined) {
    g.ellipse(x, y, radiusX, radiusY).fill({ color: fill, alpha: fillAlpha });
  }
  if (stroke !== undefined) {
    g.ellipse(x, y, radiusX, radiusY).stroke({ color: stroke, width: strokeWidth, alpha: strokeAlpha });
  }
}
