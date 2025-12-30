/**
 * Star Shape Drawing Functions
 */

import type { Graphics } from 'pixi.js';
import type { ShapeStyle } from './types.js';
import { applyShapeFill } from './fillHelper.js';
import { getStrokeOptions } from './strokeHelper.js';

export interface StarParams {
  x: number;
  y: number;
  /** Outer radius of the star */
  radius: number;
  /** Number of points on the star (default: 5) */
  points?: number;
  /** Inner radius as a ratio of outer radius (default: 0.5) */
  innerRadiusRatio?: number;
  /** Rotation offset in radians (default: -Math.PI/2 to point up) */
  rotation?: number;
}

/**
 * Generate star vertex points
 */
export function getStarPoints(params: StarParams): number[] {
  const { x, y, radius, points = 5, innerRadiusRatio = 0.5, rotation = -Math.PI / 2 } = params;
  const innerRadius = radius * innerRadiusRatio;
  const pointsList: number[] = [];
  const angleStep = Math.PI / points;

  for (let i = 0; i < points * 2; i++) {
    const angle = i * angleStep + rotation;
    const r = i % 2 === 0 ? radius : innerRadius;
    pointsList.push(x + Math.cos(angle) * r, y + Math.sin(angle) * r);
  }

  return pointsList;
}

/**
 * Draw a filled and/or stroked star
 */
export async function drawStar(g: Graphics, params: StarParams, style: ShapeStyle): Promise<void> {
  const points = getStarPoints(params);
  const hasFill = !!style.fill;
  const hasStroke = !!style.stroke && (style.strokeWidth ?? 0) > 0;

  if (hasFill || hasStroke) {
    g.poly(points);
    
    if (hasFill) {
      await applyShapeFill(g, style, {
        x: params.x - params.radius,
        y: params.y - params.radius,
        width: params.radius * 2,
        height: params.radius * 2,
      });
    }
    
    if (hasStroke) {
      g.stroke(getStrokeOptions(style));
    }
  }
}

/**
 * Get intersection point on star boundary
 */
export function getStarIntersection(
  params: StarParams & { x: number; y: number },
  angle: number,
  offset: number = 0
): { x: number; y: number } {
  const { x, y, radius } = params;
  const effectiveRadius = radius + offset;
  
  // Simple approximation: use outer radius
  return {
    x: x + Math.cos(angle) * effectiveRadius,
    y: y + Math.sin(angle) * effectiveRadius,
  };
}
