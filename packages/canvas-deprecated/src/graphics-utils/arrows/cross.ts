import type { Graphics } from 'pixi.js';
import type { ArrowStyle, ArrowParams } from './types.js';

/**
 * Cross (×) marker — two diagonal lines centred at the connector endpoint.
 */
export function drawCrossArrow(g: Graphics, params: ArrowParams, style: ArrowStyle = {}): void {
  const { x, y, angle, size } = params;
  const { stroke = 0xffffff, strokeWidth = 2, strokeAlpha = 1 } = style;

  const half = size * 0.5;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const cx = x + (-half) * cos;
  const cy = y + (-half) * sin;

  function pt(lx: number, ly: number): [number, number] {
    return [cx + lx * cos - ly * sin, cy + lx * sin + ly * cos];
  }

  const [ax, ay] = pt(-half, -half);
  const [bx, by] = pt( half,  half);
  const [cx2, cy2] = pt( half, -half);
  const [dx, dy] = pt(-half,  half);

  g.moveTo(ax!, ay!);
  g.lineTo(bx!, by!);
  g.stroke({ color: stroke, width: strokeWidth, alpha: strokeAlpha });

  g.moveTo(cx2!, cy2!);
  g.lineTo(dx!, dy!);
  g.stroke({ color: stroke, width: strokeWidth, alpha: strokeAlpha });
}
