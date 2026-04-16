import type { Graphics } from 'pixi.js';
import type { ArrowStyle, ArrowParams } from './types.js';

export function drawCircleArrow(g: Graphics, params: ArrowParams, style: ArrowStyle = {}): void {
  const { x, y, angle, size } = params;
  const { fill = 0xffffff, fillAlpha = 1 } = style;
  const r = size * 0.5;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const cx = x - r * cos;
  const cy = y - r * sin;
  g.circle(cx, cy, r);
  g.fill({ color: fill, alpha: fillAlpha });
}

export function drawCircleOutlineArrow(g: Graphics, params: ArrowParams, style: ArrowStyle = {}): void {
  const { x, y, angle, size } = params;
  const { stroke = 0xffffff, strokeWidth = 1, strokeAlpha = 1 } = style;
  const r = size * 0.5;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const cx = x - r * cos;
  const cy = y - r * sin;
  g.circle(cx, cy, r);
  g.stroke({ color: stroke, width: strokeWidth, alpha: strokeAlpha });
}
