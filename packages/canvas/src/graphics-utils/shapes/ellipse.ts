import type { Graphics } from 'pixi.js';
import { type DrawStyle, resolveFillArg } from '../types.js';
import { type DashStyle, drawDashedLine } from './dashed.js';

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

/**
 * Draw a dashed ellipse border by walking the perimeter with small angle steps
 * and calling drawDashedLine for each micro-segment with a continuous offset.
 */
export function drawDashedEllipse(
  g: Graphics,
  x: number,
  y: number,
  radiusX: number,
  radiusY: number,
  style: DashStyle = {},
): void {
  const dashLen = style.dashLength ?? 8;
  const gapLen = style.gapLength ?? 4;
  const pattern = dashLen + gapLen;
  let offset = style.offset ?? 0;
  const STEPS = 80;

  for (let i = 1; i <= STEPS; i++) {
    const prevAngle = ((i - 1) / STEPS) * Math.PI * 2;
    const angle = (i / STEPS) * Math.PI * 2;
    const x1 = x + Math.cos(prevAngle) * radiusX;
    const y1 = y + Math.sin(prevAngle) * radiusY;
    const x2 = x + Math.cos(angle) * radiusX;
    const y2 = y + Math.sin(angle) * radiusY;
    const segLen = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    drawDashedLine(g, x1, y1, x2, y2, { ...style, offset });
    offset = (offset + segLen) % pattern;
  }
}

export type { DashStyle };
