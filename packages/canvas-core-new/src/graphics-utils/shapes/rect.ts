import type { Graphics } from 'pixi.js';
import { type DrawStyle, resolveFillArg } from '../types.js';

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
  const fillArg = resolveFillArg(fill, fillAlpha);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (fillArg !== undefined) draw(g).fill(fillArg as any);
  if (stroke !== undefined) draw(g).stroke({ color: stroke, width: strokeWidth, alpha: strokeAlpha });
}
