import type { Graphics } from 'pixi.js';
import { type DrawStyle, resolveFillArg } from '../types.js';

/**
 * Draw a star shape.
 * @param points   - number of points (default 5)
 * @param innerRatio - inner radius as fraction of outer (default 0.42)
 */
export function drawStar(
  g: Graphics,
  x: number,
  y: number,
  radius: number,
  style: DrawStyle & { points?: number; innerRatio?: number; rotation?: number } = {},
): void {
  const {
    fill,
    fillAlpha = 1,
    stroke,
    strokeWidth = 1,
    strokeAlpha = 1,
    points = 5,
    innerRatio = 0.42,
    rotation = -Math.PI / 2,
  } = style;

  const verts = buildStarPoints(x, y, radius, points, innerRatio, rotation);

  const fillArg = resolveFillArg(fill, fillAlpha);
  if (fillArg !== undefined) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    g.poly(verts).fill(fillArg as any);
  }
  if (stroke !== undefined) {
    g.poly(verts).stroke({ color: stroke, width: strokeWidth, alpha: strokeAlpha });
  }
}

export function buildStarPoints(
  x: number,
  y: number,
  radius: number,
  points: number,
  innerRatio: number,
  rotation: number,
): number[] {
  const inner = radius * innerRatio;
  const verts: number[] = [];
  const step = Math.PI / points;
  for (let i = 0; i < points * 2; i++) {
    const angle = i * step + rotation;
    const r = i % 2 === 0 ? radius : inner;
    verts.push(x + Math.cos(angle) * r, y + Math.sin(angle) * r);
  }
  return verts;
}
