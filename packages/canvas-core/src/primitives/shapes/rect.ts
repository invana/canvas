/**
 * Rectangle Shape Drawing Functions
 */

import type { Graphics } from 'pixi.js';
import type { ShapeStyle } from './types.js';

export interface RectParams {
  x: number;
  y: number;
  width: number;
  height: number;
  /** If true, x/y is center. If false, x/y is top-left. Default: true */
  centered?: boolean;
}

/**
 * Draw a filled and/or stroked rectangle
 */
export function drawRect(g: Graphics, params: RectParams, style: ShapeStyle): void {
  const { width, height, centered = true } = params;
  const x = centered ? params.x - width / 2 : params.x;
  const y = centered ? params.y - height / 2 : params.y;

  if (style.fill) {
    g.rect(x, y, width, height);
    g.fill({ color: style.fill, alpha: style.fillAlpha ?? 1 });
  }

  if (style.stroke && (style.strokeWidth ?? 0) > 0) {
    g.rect(x, y, width, height);
    g.stroke({
      color: style.stroke,
      width: style.strokeWidth ?? 1,
      alpha: style.strokeAlpha ?? 1,
    });
  }
}

/**
 * Draw rectangle outline only (no fill)
 */
export function drawRectOutline(
  g: Graphics,
  params: RectParams,
  style: Pick<ShapeStyle, 'stroke' | 'strokeWidth' | 'strokeAlpha'>
): void {
  const { width, height, centered = true } = params;
  const x = centered ? params.x - width / 2 : params.x;
  const y = centered ? params.y - height / 2 : params.y;

  g.rect(x, y, width, height);
  g.stroke({
    color: style.stroke ?? '#000000',
    width: style.strokeWidth ?? 1,
    alpha: style.strokeAlpha ?? 1,
  });
}

/**
 * Get rectangle outline descriptor for effects
 */
export function getRectOutline(
  params: RectParams,
  scale: number = 1
): { type: 'rect'; x: number; y: number; width: number; height: number } {
  const { width, height, centered = true } = params;
  const x = centered ? params.x - (width * scale) / 2 : params.x;
  const y = centered ? params.y - (height * scale) / 2 : params.y;

  return {
    type: 'rect',
    x,
    y,
    width: width * scale,
    height: height * scale,
  };
}

/**
 * Hit test for rectangle
 */
export function hitTestRect(
  testX: number,
  testY: number,
  params: RectParams
): boolean {
  const { x, y, width, height, centered = true } = params;
  const left = centered ? x - width / 2 : x;
  const top = centered ? y - height / 2 : y;

  return (
    testX >= left &&
    testX <= left + width &&
    testY >= top &&
    testY <= top + height
  );
}

/**
 * Get intersection point on rectangle boundary for a given angle
 */
export function getRectIntersection(
  params: RectParams,
  angle: number,
  offset: number = 0
): { x: number; y: number } {
  const { x, y, width, height } = params;
  const halfWidth = width / 2 + offset;
  const halfHeight = height / 2 + offset;

  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  // Handle degenerate cases
  if (Math.abs(cos) < 0.0001) {
    return { x, y: y + (sin > 0 ? halfHeight : -halfHeight) };
  }
  if (Math.abs(sin) < 0.0001) {
    return { x: x + (cos > 0 ? halfWidth : -halfWidth), y };
  }

  // Calculate intersection with rectangle boundary
  const tx = halfWidth / Math.abs(cos);
  const ty = halfHeight / Math.abs(sin);
  const t = Math.min(tx, ty);

  return { x: x + cos * t, y: y + sin * t };
}
