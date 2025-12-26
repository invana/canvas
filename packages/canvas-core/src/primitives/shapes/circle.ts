/**
 * Circle Shape Drawing Functions
 */

import type { Graphics } from 'pixi.js';
import type { ShapeStyle } from './types.js';
import { applyShapeFill } from './fillHelper.js';

export interface CircleParams {
  x: number;
  y: number;
  radius: number;
}

/**
 * Draw a filled and/or stroked circle
 */
export async function drawCircle(g: Graphics, params: CircleParams, style: ShapeStyle): Promise<void> {
  const { x, y, radius } = params;

  if (style.fill) {
    g.circle(x, y, radius);
    
    // Calculate bounds for fill
    const bounds = {
      x: x - radius,
      y: y - radius,
      width: radius * 2,
      height: radius * 2,
    };
    
    // Apply fill (handles solid colors, gradients, images, patterns)
    await applyShapeFill(g, style, bounds);
  }

  if (style.stroke && (style.strokeWidth ?? 0) > 0) {
    g.circle(x, y, radius);
    g.stroke({
      color: style.stroke,
      width: style.strokeWidth ?? 1,
      alpha: style.strokeAlpha ?? 1,
    });
  }
}

/**
 * Draw circle outline only (no fill)
 */
export function drawCircleOutline(
  g: Graphics,
  params: CircleParams,
  style: Pick<ShapeStyle, 'stroke' | 'strokeWidth' | 'strokeAlpha'>
): void {
  const { x, y, radius } = params;
  g.circle(x, y, radius);
  g.stroke({
    color: style.stroke ?? '#000000',
    width: style.strokeWidth ?? 1,
    alpha: style.strokeAlpha ?? 1,
  });
}

/**
 * Get circle outline descriptor for effects
 */
export function getCircleOutline(params: CircleParams, scale: number = 1): { type: 'circle'; x: number; y: number; radius: number } {
  return {
    type: 'circle',
    x: params.x,
    y: params.y,
    radius: params.radius * scale,
  };
}
