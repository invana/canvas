import type { Graphics } from 'pixi.js';
import type { ArrowStyle, ArrowParams } from './types.js';

/**
 * Classic open arrowhead — two lines forming a V pointing at the tip.
 * Unlike the triangle arrow, the classic arrow is open (not filled).
 */
export function drawClassicArrow(g: Graphics, params: ArrowParams, style: ArrowStyle = {}): void {
  const { x, y, angle, size } = params;
  const { stroke = 0xffffff, strokeWidth = 2, strokeAlpha = 1 } = style;

  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  // Two wings: upper and lower
  const wingX = -size;
  const wingY = size * 0.5;

  g.moveTo(
    x + wingX * cos - (-wingY) * sin,
    y + wingX * sin + (-wingY) * cos,
  );
  g.lineTo(x, y);
  g.lineTo(
    x + wingX * cos - wingY * sin,
    y + wingX * sin + wingY * cos,
  );
  g.stroke({ color: stroke, width: strokeWidth, alpha: strokeAlpha });
}
