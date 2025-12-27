/**
 * Circle Shape Drawing Functions
 */

import type { Graphics } from 'pixi.js';
import type { ShapeStyle } from './types.js';
import { applyShapeFill } from './fillHelper.js';
import { getStrokeOptions, getStrokeDashPattern } from './strokeHelper.js';
import { drawDashedCircle, drawDottedCircle, drawPatternCircle } from './dashedStrokes.js';

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
    const dashPattern = getStrokeDashPattern(style);
    
    if (dashPattern && dashPattern.length >= 2) {
      // Use custom dashed/dotted implementation
      const offset = style.strokeDashOffset ?? 0;
      if (style.strokeStyle === 'dotted') {
        drawDottedCircle(g, x, y, radius, dashPattern[0]! + dashPattern[1]!, style.stroke, style.strokeWidth ?? 1, style.strokeAlpha ?? 1, offset);
      } else if (dashPattern.length > 2) {
        drawPatternCircle(g, x, y, radius, dashPattern, style.stroke, style.strokeWidth ?? 1, style.strokeAlpha ?? 1, offset);
      } else {
        drawDashedCircle(g, x, y, radius, dashPattern[0]!, dashPattern[1]!, style.stroke, style.strokeWidth ?? 1, style.strokeAlpha ?? 1, offset);
      }
    } else {
      // Solid stroke
      g.circle(x, y, radius);
      g.stroke(getStrokeOptions(style));
    }
  }
}

/**
 * Draw circle outline only (no fill)
 */
export function drawCircleOutline(
  g: Graphics,
  params: CircleParams,
  style: Pick<ShapeStyle, 'stroke' | 'strokeWidth' | 'strokeAlpha' | 'strokeStyle' | 'strokeDashPattern' | 'strokeDashOffset'>
): void {
  const { x, y, radius } = params;
  const dashPattern = getStrokeDashPattern(style);
  
  if (dashPattern && dashPattern.length >= 2) {
    const offset = style.strokeDashOffset ?? 0;
    if (style.strokeStyle === 'dotted') {
      drawDottedCircle(g, x, y, radius, dashPattern[0]! + dashPattern[1]!, style.stroke ?? '#000000', style.strokeWidth ?? 1, style.strokeAlpha ?? 1, offset);
    } else {
      drawDashedCircle(g, x, y, radius, dashPattern[0]!, dashPattern[1]!, style.stroke ?? '#000000', style.strokeWidth ?? 1, style.strokeAlpha ?? 1, offset);
    }
  } else {
    g.circle(x, y, radius);
    g.stroke(getStrokeOptions(style));
  }
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
