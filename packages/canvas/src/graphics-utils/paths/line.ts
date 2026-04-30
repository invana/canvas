import type { Graphics } from 'pixi.js';
import { type PathStyle, resolveStrokeOpts } from '../types.js';

/** Draw a straight line between two points. */
export function drawLine(
  g: Graphics,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  style: PathStyle = {},
): void {
  g.moveTo(x1, y1).lineTo(x2, y2).stroke(resolveStrokeOpts(style));
}
