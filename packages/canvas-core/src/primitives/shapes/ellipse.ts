/**
 * Ellipse Shape Drawing Functions
 */

import type { Graphics } from 'pixi.js';
import type { ShapeStyle } from './types.js';
import { applyShapeFill } from './fillHelper.js';

export interface EllipseParams {
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
}

/**
 * Draw a filled and/or stroked ellipse
 */
export async function drawEllipse(g: Graphics, params: EllipseParams, style: ShapeStyle): Promise<void> {
  const { x, y, radiusX, radiusY } = params;

  if (style.fill) {
    g.ellipse(x, y, radiusX, radiusY);
    await applyShapeFill(g, style, {
      x: x - radiusX,
      y: y - radiusY,
      width: radiusX * 2,
      height: radiusY * 2,
    });
  }

  if (style.stroke && (style.strokeWidth ?? 0) > 0) {
    g.ellipse(x, y, radiusX, radiusY);
    g.stroke({
      color: style.stroke,
      width: style.strokeWidth ?? 1,
      alpha: style.strokeAlpha ?? 1,
    });
  }
}

/**
 * Draw ellipse outline only (no fill)
 */
export function drawEllipseOutline(
  g: Graphics,
  params: EllipseParams,
  style: Pick<ShapeStyle, 'stroke' | 'strokeWidth' | 'strokeAlpha'>
): void {
  const { x, y, radiusX, radiusY } = params;
  g.ellipse(x, y, radiusX, radiusY);
  g.stroke({
    color: style.stroke ?? '#000000',
    width: style.strokeWidth ?? 1,
    alpha: style.strokeAlpha ?? 1,
  });
}

/**
 * Get ellipse outline descriptor for effects
 */
export function getEllipseOutline(
  params: EllipseParams,
  scale: number = 1
): { type: 'ellipse'; x: number; y: number; radiusX: number; radiusY: number } {
  return {
    type: 'ellipse',
    x: params.x,
    y: params.y,
    radiusX: params.radiusX * scale,
    radiusY: params.radiusY * scale,
  };
}
