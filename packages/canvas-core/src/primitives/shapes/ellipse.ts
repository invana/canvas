/**
 * Ellipse Shape Drawing Functions
 */

import type { Graphics } from 'pixi.js';
import type { ShapeStyle } from './types.js';
import { applyShapeFill } from './fillHelper.js';
import { getStrokeOptions, getStrokeDashPattern } from './strokeHelper.js';
import { drawDashedEllipse, drawDottedEllipse, drawPatternEllipse } from './dashedStrokes.js';

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
    const dashPattern = getStrokeDashPattern(style);
    
    if (dashPattern && dashPattern.length >= 2) {
      const offset = style.strokeDashOffset ?? 0;
      if (style.strokeStyle === 'dotted') {
        drawDottedEllipse(g, x, y, radiusX, radiusY, dashPattern[0]! + dashPattern[1]!, style.stroke, style.strokeWidth ?? 1, style.strokeAlpha ?? 1, offset);
      } else if (dashPattern.length > 2) {
        drawPatternEllipse(g, x, y, radiusX, radiusY, dashPattern, style.stroke, style.strokeWidth ?? 1, style.strokeAlpha ?? 1, offset);
      } else {
        drawDashedEllipse(g, x, y, radiusX, radiusY, dashPattern[0]!, dashPattern[1]!, style.stroke, style.strokeWidth ?? 1, style.strokeAlpha ?? 1, offset);
      }
    } else {
      g.ellipse(x, y, radiusX, radiusY);
      g.stroke(getStrokeOptions(style));
    }
  }
}

/**
 * Draw ellipse outline only (no fill)
 */
export function drawEllipseOutline(
  g: Graphics,
  params: EllipseParams,
  style: Pick<ShapeStyle, 'stroke' | 'strokeWidth' | 'strokeAlpha' | 'strokeStyle' | 'strokeDashPattern' | 'strokeDashOffset'>
): void {
  const { x, y, radiusX, radiusY } = params;
  const dashPattern = getStrokeDashPattern(style);
  
  if (dashPattern && dashPattern.length >= 2) {
    const offset = style.strokeDashOffset ?? 0;
    if (style.strokeStyle === 'dotted') {
      drawDottedEllipse(g, x, y, radiusX, radiusY, dashPattern[0]! + dashPattern[1]!, style.stroke ?? '#000000', style.strokeWidth ?? 1, style.strokeAlpha ?? 1, offset);
    } else {
      drawDashedEllipse(g, x, y, radiusX, radiusY, dashPattern[0]!, dashPattern[1]!, style.stroke ?? '#000000', style.strokeWidth ?? 1, style.strokeAlpha ?? 1, offset);
    }
  } else {
    g.ellipse(x, y, radiusX, radiusY);
    g.stroke(getStrokeOptions(style));
  }
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
