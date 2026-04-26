import type { Graphics } from 'pixi.js';
import type { ArrowStyle, ArrowParams } from './types.js';

/**
 * Async-style arrowhead — a half-open, angled single wing (used for async flows).
 * Draws only the upper wing of the classic arrow, giving an asymmetric look.
 */
export function drawAsyncArrow(g: Graphics, params: ArrowParams, style: ArrowStyle = {}): void {
  const { x, y, angle, size } = params;
  const { stroke = 0xffffff, strokeWidth = 2, strokeAlpha = 1 } = style;

  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  // Only draw one wing (upper)
  const wingX = -size;
  const wingY = -size * 0.5;

  const wx = x + wingX * cos - wingY * sin;
  const wy = y + wingX * sin + wingY * cos;

  g.moveTo(wx, wy);
  g.lineTo(x, y);
  g.stroke({ color: stroke, width: strokeWidth, alpha: strokeAlpha });
}
