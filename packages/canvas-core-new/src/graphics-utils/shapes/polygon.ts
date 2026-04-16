import type { Graphics } from 'pixi.js';
import type { DrawStyle } from '../types.js';

/**
 * Draw a regular polygon (triangle=3, diamond=4, pentagon=5, hexagon=6, …).
 * x,y = center. rotation in radians (default -PI/2 = point up).
 */
export function drawPolygon(
  g: Graphics,
  x: number,
  y: number,
  radius: number,
  sides: number,
  style: DrawStyle & { rotation?: number } = {},
): void {
  const { fill, fillAlpha = 1, stroke, strokeWidth = 1, strokeAlpha = 1, rotation = -Math.PI / 2 } = style;

  const points = buildPolygonPoints(x, y, radius, sides, rotation);

  if (fill !== undefined) {
    g.poly(points).fill({ color: fill, alpha: fillAlpha });
  }
  if (stroke !== undefined) {
    g.poly(points).stroke({ color: stroke, width: strokeWidth, alpha: strokeAlpha });
  }
}

/** Returns flat [x0,y0, x1,y1, …] array of polygon vertices. */
export function buildPolygonPoints(
  x: number,
  y: number,
  radius: number,
  sides: number,
  rotation = -Math.PI / 2,
): number[] {
  const points: number[] = [];
  const step = (Math.PI * 2) / sides;
  for (let i = 0; i < sides; i++) {
    const angle = i * step + rotation;
    points.push(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
  }
  return points;
}
