import type { Graphics } from 'pixi.js';
import type { ArrowStyle, ArrowParams } from './types.js';

/**
 * Circle-plus (⊕) marker — a filled circle with a + symbol inside.
 */
export function drawCirclePlusArrow(g: Graphics, params: ArrowParams, style: ArrowStyle = {}): void {
  const { x, y, angle, size } = params;
  const { fill = 0xffffff, fillAlpha = 1, stroke = 0x000000, strokeWidth = 1.5, strokeAlpha = 1 } = style;

  const r = size * 0.5;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const cx = x + (-r) * cos;
  const cy = y + (-r) * sin;

  g.circle(cx, cy, r);
  g.fill({ color: fill, alpha: fillAlpha });
  g.stroke({ color: stroke, width: strokeWidth, alpha: strokeAlpha });

  // Draw + lines
  function pt(lx: number, ly: number): [number, number] {
    return [cx + lx * cos - ly * sin, cy + lx * sin + ly * cos];
  }

  const [ax, ay] = pt(-r * 0.6, 0);
  const [bx, by] = pt( r * 0.6, 0);
  const [cx2, cy2] = pt(0, -r * 0.6);
  const [dx, dy]   = pt(0,  r * 0.6);

  g.moveTo(ax!, ay!);
  g.lineTo(bx!, by!);
  g.stroke({ color: stroke, width: strokeWidth, alpha: strokeAlpha });

  g.moveTo(cx2!, cy2!);
  g.lineTo(dx!, dy!);
  g.stroke({ color: stroke, width: strokeWidth, alpha: strokeAlpha });
}
