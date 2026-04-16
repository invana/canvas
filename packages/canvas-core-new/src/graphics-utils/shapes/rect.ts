import type { Graphics } from 'pixi.js';
import type { DrawStyle } from '../types.js';

/** Draw a filled/stroked rectangle. x,y = top-left corner. */
export function drawRect(
  g: Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  style: DrawStyle & { cornerRadius?: number } = {},
): void {
  const { fill, fillAlpha = 1, stroke, strokeWidth = 1, strokeAlpha = 1, cornerRadius = 0 } = style;
  const r = Math.min(cornerRadius, width / 2, height / 2);
  const draw = r > 0
    ? (gr: Graphics) => gr.roundRect(x, y, width, height, r)
    : (gr: Graphics) => gr.rect(x, y, width, height);
  if (fill !== undefined) draw(g).fill({ color: fill, alpha: fillAlpha });
  if (stroke !== undefined) draw(g).stroke({ color: stroke, width: strokeWidth, alpha: strokeAlpha });
}
