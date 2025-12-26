/**
 * Rounded Rectangle Shape Drawing Functions
 */

import type { Graphics } from 'pixi.js';
import type { ShapeStyle } from './types.js';
import { applyShapeFill } from './fillHelper.js';

export interface RoundedRectParams {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  /** If true, x/y is center. If false, x/y is top-left. Default: true */
  centered?: boolean;
}

/**
 * Draw a filled and/or stroked rounded rectangle
 */
export async function drawRoundedRect(g: Graphics, params: RoundedRectParams, style: ShapeStyle): Promise<void> {
  const { width, height, radius, centered = true } = params;
  const x = centered ? params.x - width / 2 : params.x;
  const y = centered ? params.y - height / 2 : params.y;
  // Clamp radius to half of smallest dimension
  const r = Math.min(radius, width / 2, height / 2);

  if (style.fill) {
    g.roundRect(x, y, width, height, r);
    await applyShapeFill(g, style, { x, y, width, height });
  }

  if (style.stroke && (style.strokeWidth ?? 0) > 0) {
    g.roundRect(x, y, width, height, r);
    g.stroke({
      color: style.stroke,
      width: style.strokeWidth ?? 1,
      alpha: style.strokeAlpha ?? 1,
    });
  }
}

/**
 * Draw rounded rectangle outline only (no fill)
 */
export function drawRoundedRectOutline(
  g: Graphics,
  params: RoundedRectParams,
  style: Pick<ShapeStyle, 'stroke' | 'strokeWidth' | 'strokeAlpha'>
): void {
  const { width, height, radius, centered = true } = params;
  const x = centered ? params.x - width / 2 : params.x;
  const y = centered ? params.y - height / 2 : params.y;
  const r = Math.min(radius, width / 2, height / 2);

  g.roundRect(x, y, width, height, r);
  g.stroke({
    color: style.stroke ?? '#000000',
    width: style.strokeWidth ?? 1,
    alpha: style.strokeAlpha ?? 1,
  });
}

/**
 * Get rounded rectangle outline descriptor for effects
 */
export function getRoundedRectOutline(
  params: RoundedRectParams,
  scale: number = 1
): { type: 'roundedRect'; x: number; y: number; width: number; height: number; radius: number } {
  const { width, height, radius, centered = true } = params;
  const scaledWidth = width * scale;
  const scaledHeight = height * scale;
  const x = centered ? params.x - scaledWidth / 2 : params.x;
  const y = centered ? params.y - scaledHeight / 2 : params.y;

  return {
    type: 'roundedRect',
    x,
    y,
    width: scaledWidth,
    height: scaledHeight,
    radius: radius * scale,
  };
}
