/**
 * Polygon Shape Drawing Functions
 */

import type { Graphics } from 'pixi.js';
import type { ShapeStyle } from './types.js';
import { applyShapeFill } from './fillHelper.js';
import { getStrokeOptions, getStrokeDashPattern } from './strokeHelper.js';
import { drawDashedPolygon, drawDottedPolygon, drawPatternPolygon } from './dashedStrokes.js';

export interface PolygonParams {
  x: number;
  y: number;
  radius: number;
  sides: number;
  /** Rotation offset in radians. Default: -Math.PI/2 (point up) */
  rotation?: number;
  /** Corner radius for rounded corners. Default: 0 */
  cornerRadius?: number;
}

/**
 * Generate polygon vertex points with optional rounded corners
 */
export function getPolygonPoints(params: PolygonParams): number[] {
  const { x, y, radius, sides, rotation = -Math.PI / 2, cornerRadius = 0 } = params;
  
  if (cornerRadius <= 0 || sides < 3) {
    // No rounding, use regular polygon
    const points: number[] = [];
    const angleStep = (Math.PI * 2) / sides;

    for (let i = 0; i < sides; i++) {
      const angle = i * angleStep + rotation;
      points.push(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
    }
    return points;
  }

  // Rounded corners - need to create arc segments at each vertex
  const points: number[] = [];
  const angleStep = (Math.PI * 2) / sides;
  
  // Calculate the maximum corner radius to prevent overlap
  const sideLength = 2 * radius * Math.sin(Math.PI / sides);
  const maxRadius = sideLength / 2 * 0.9; // Use 90% to ensure no overlap
  const effectiveRadius = Math.min(cornerRadius, maxRadius);
  
  for (let i = 0; i < sides; i++) {
    const angle = i * angleStep + rotation;
    const nextAngle = ((i + 1) % sides) * angleStep + rotation;
    
    // Current vertex position
    const vx = x + Math.cos(angle) * radius;
    const vy = y + Math.sin(angle) * radius;
    
    // Next vertex position
    const nvx = x + Math.cos(nextAngle) * radius;
    const nvy = y + Math.sin(nextAngle) * radius;
    
    // Direction vectors along edges
    const toNextX = nvx - vx;
    const toNextY = nvy - vy;
    const toNextLen = Math.sqrt(toNextX * toNextX + toNextY * toNextY);
    
    // Calculate point before corner (along the edge from previous vertex)
    const prevAngle = ((i - 1 + sides) % sides) * angleStep + rotation;
    const pvx = x + Math.cos(prevAngle) * radius;
    const pvy = y + Math.sin(prevAngle) * radius;
    
    const fromPrevX = vx - pvx;
    const fromPrevY = vy - pvy;
    const fromPrevLen = Math.sqrt(fromPrevX * fromPrevX + fromPrevY * fromPrevY);
    
    // Points for the rounded corner
    const ratio = effectiveRadius / fromPrevLen;
    const p1x = vx - fromPrevX * ratio;
    const p1y = vy - fromPrevY * ratio;
    
    const ratio2 = effectiveRadius / toNextLen;
    const p2x = vx + toNextX * ratio2;
    const p2y = vy + toNextY * ratio2;
    
    // Add the start point of the arc
    points.push(p1x, p1y);
    
    // Add intermediate arc points for smoother curves (4 points per arc)
    const arcSegments = 4;
    for (let j = 1; j <= arcSegments; j++) {
      const t = j / (arcSegments + 1);
      // Quadratic bezier curve with control point at the vertex
      const arcX = (1 - t) * (1 - t) * p1x + 2 * (1 - t) * t * vx + t * t * p2x;
      const arcY = (1 - t) * (1 - t) * p1y + 2 * (1 - t) * t * vy + t * t * p2y;
      points.push(arcX, arcY);
    }
  }

  return points;
}

/**
 * Draw a filled and/or stroked regular polygon
 */
export async function drawPolygon(g: Graphics, params: PolygonParams, style: ShapeStyle): Promise<void> {
  const points = getPolygonPoints(params);

  if (style.fill) {
    g.poly(points);
    await applyShapeFill(g, style, {
      x: params.x - params.radius,
      y: params.y - params.radius,
      width: params.radius * 2,
      height: params.radius * 2,
    });
  }

  if (style.stroke && (style.strokeWidth ?? 0) > 0) {
    const dashPattern = getStrokeDashPattern(style);
    
    if (dashPattern && dashPattern.length >= 2) {
      const offset = style.strokeDashOffset ?? 0;
      if (style.strokeStyle === 'dotted') {
        drawDottedPolygon(g, points, dashPattern[0]! + dashPattern[1]!, style.stroke, style.strokeWidth ?? 1, style.strokeAlpha ?? 1, offset);
      } else if (dashPattern.length > 2) {
        drawPatternPolygon(g, points, dashPattern, style.stroke, style.strokeWidth ?? 1, style.strokeAlpha ?? 1, offset);
      } else {
        drawDashedPolygon(g, points, dashPattern[0]!, dashPattern[1]!, style.stroke, style.strokeWidth ?? 1, style.strokeAlpha ?? 1, offset);
      }
    } else {
      g.poly(points);
      g.stroke(getStrokeOptions(style));
    }
  }
}

/**
 * Draw polygon outline only (no fill)
 */
export function drawPolygonOutline(
  g: Graphics,
  params: PolygonParams,
  style: Pick<ShapeStyle, 'stroke' | 'strokeWidth' | 'strokeAlpha' | 'strokeStyle' | 'strokeDashPattern' | 'strokeDashOffset'>
): void {
  const points = getPolygonPoints(params);
  const dashPattern = getStrokeDashPattern(style);
  
  if (dashPattern && dashPattern.length >= 2) {
    const offset = style.strokeDashOffset ?? 0;
    if (style.strokeStyle === 'dotted') {
      drawDottedPolygon(g, points, dashPattern[0]! + dashPattern[1]!, style.stroke ?? '#000000', style.strokeWidth ?? 1, style.strokeAlpha ?? 1, offset);
    } else if (dashPattern.length > 2) {
      drawPatternPolygon(g, points, dashPattern, style.stroke ?? '#000000', style.strokeWidth ?? 1, style.strokeAlpha ?? 1, offset);
    } else {
      drawDashedPolygon(g, points, dashPattern[0]!, dashPattern[1]!, style.stroke ?? '#000000', style.strokeWidth ?? 1, style.strokeAlpha ?? 1, offset);
    }
  } else {
    g.poly(points);
    g.stroke(getStrokeOptions(style));
  }
}

/**
 * Draw polygon from raw points array
 */
export function drawPolygonFromPoints(g: Graphics, points: number[], style: ShapeStyle): void {
  if (style.fill) {
    g.poly(points);
    // Calculate bounds from points
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let i = 0; i < points.length; i += 2) {
      const x = points[i];
      const y = points[i + 1];
      if (x !== undefined && y !== undefined) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
    applyShapeFill(g, style, {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    });
  }

  if (style.stroke && (style.strokeWidth ?? 0) > 0) {
    const dashPattern = getStrokeDashPattern(style);
    
    if (dashPattern && dashPattern.length >= 2) {
      const offset = style.strokeDashOffset ?? 0;
      if (style.strokeStyle === 'dotted') {
        drawDottedPolygon(g, points, dashPattern[0]! + dashPattern[1]!, style.stroke, style.strokeWidth ?? 1, style.strokeAlpha ?? 1, offset);
      } else if (dashPattern.length > 2) {
        drawPatternPolygon(g, points, dashPattern, style.stroke, style.strokeWidth ?? 1, style.strokeAlpha ?? 1, offset);
      } else {
        drawDashedPolygon(g, points, dashPattern[0]!, dashPattern[1]!, style.stroke, style.strokeWidth ?? 1, style.strokeAlpha ?? 1, offset);
      }
    } else {
      g.poly(points);
      g.stroke(getStrokeOptions(style));
    }
  }
}

/**
 * Draw polygon outline from raw points array
 */
export function drawPolygonOutlineFromPoints(
  g: Graphics,
  points: number[],
  style: Pick<ShapeStyle, 'stroke' | 'strokeWidth' | 'strokeAlpha' | 'strokeStyle' | 'strokeDashPattern' | 'strokeDashOffset'>
): void {
  g.poly(points);
  g.stroke(getStrokeOptions(style));
}

/**
 * Get polygon outline descriptor for effects
 */
export function getPolygonOutline(
  params: PolygonParams,
  scale: number = 1
): { type: 'polygon'; points: number[] } {
  const scaledParams = { ...params, radius: params.radius * scale };
  return {
    type: 'polygon',
    points: getPolygonPoints(scaledParams),
  };
}

/**
 * Hit test for polygon (simplified - uses bounding circle)
 */
export function hitTestPolygon(
  testX: number,
  testY: number,
  params: PolygonParams
): boolean {
  const dx = testX - params.x;
  const dy = testY - params.y;
  return dx * dx + dy * dy <= params.radius * params.radius;
}

/**
 * Get intersection point on polygon boundary for a given angle
 */
export function getPolygonIntersection(
  params: PolygonParams,
  angle: number,
  offset: number = 0
): { x: number; y: number } {
  const { x, y, radius, sides, rotation = -Math.PI / 2 } = params;
  const effectiveRadius = radius + offset;
  const angleStep = (Math.PI * 2) / sides;

  // Adjust angle for shape rotation
  let adjustedAngle = angle - rotation;
  // Normalize to [0, 2π)
  while (adjustedAngle < 0) adjustedAngle += Math.PI * 2;
  while (adjustedAngle >= Math.PI * 2) adjustedAngle -= Math.PI * 2;

  // Find which edge segment the angle intersects
  const segmentIndex = Math.floor(adjustedAngle / angleStep);
  const segmentStart = segmentIndex * angleStep;
  const segmentEnd = (segmentIndex + 1) * angleStep;

  // Get vertices of this edge
  const v1Angle = segmentStart + rotation;
  const v2Angle = segmentEnd + rotation;

  const v1x = Math.cos(v1Angle) * effectiveRadius;
  const v1y = Math.sin(v1Angle) * effectiveRadius;
  const v2x = Math.cos(v2Angle) * effectiveRadius;
  const v2y = Math.sin(v2Angle) * effectiveRadius;

  // Ray from center at `angle`
  const rayDx = Math.cos(angle);
  const rayDy = Math.sin(angle);

  // Edge direction
  const edgeDx = v2x - v1x;
  const edgeDy = v2y - v1y;

  // Solve for intersection using parametric form
  const denom = rayDx * edgeDy - rayDy * edgeDx;
  if (Math.abs(denom) < 0.0001) {
    // Parallel - return point on circle at this angle
    return {
      x: x + Math.cos(angle) * effectiveRadius,
      y: y + Math.sin(angle) * effectiveRadius,
    };
  }

  const t = (v1x * edgeDy - v1y * edgeDx) / denom;

  return {
    x: x + rayDx * t,
    y: y + rayDy * t,
  };
}

// ============================================================================
// Convenience functions for common polygon shapes
// ============================================================================

/**
 * Draw a triangle (3-sided polygon)
 */
export function drawTriangle(
  g: Graphics,
  params: Omit<PolygonParams, 'sides'>,
  style: ShapeStyle
): void {
  drawPolygon(g, { ...params, sides: 3 }, style);
}

/**
 * Draw a diamond (4-sided polygon rotated 45°)
 */
export function drawDiamond(
  g: Graphics,
  params: Omit<PolygonParams, 'sides' | 'rotation'>,
  style: ShapeStyle
): void {
  drawPolygon(g, { ...params, sides: 4, rotation: -Math.PI / 2 }, style);
}

/**
 * Draw a pentagon (5-sided polygon)
 */
export function drawPentagon(
  g: Graphics,
  params: Omit<PolygonParams, 'sides'>,
  style: ShapeStyle
): void {
  drawPolygon(g, { ...params, sides: 5 }, style);
}

/**
 * Draw a hexagon (6-sided polygon)
 */
export function drawHexagon(
  g: Graphics,
  params: Omit<PolygonParams, 'sides'>,
  style: ShapeStyle
): void {
  drawPolygon(g, { ...params, sides: 6 }, style);
}

/**
 * Draw an octagon (8-sided polygon)
 */
export function drawOctagon(
  g: Graphics,
  params: Omit<PolygonParams, 'sides'>,
  style: ShapeStyle
): void {
  drawPolygon(g, { ...params, sides: 8 }, style);
}

// Outline versions
export function drawTriangleOutline(
  g: Graphics,
  params: Omit<PolygonParams, 'sides'>,
  style: Pick<ShapeStyle, 'stroke' | 'strokeWidth' | 'strokeAlpha' | 'strokeStyle' | 'strokeDashPattern' | 'strokeDashOffset'>
): void {
  drawPolygonOutline(g, { ...params, sides: 3 }, style);
}

export function drawDiamondOutline(
  g: Graphics,
  params: Omit<PolygonParams, 'sides' | 'rotation'>,
  style: Pick<ShapeStyle, 'stroke' | 'strokeWidth' | 'strokeAlpha' | 'strokeStyle' | 'strokeDashPattern' | 'strokeDashOffset'>
): void {
  drawPolygonOutline(g, { ...params, sides: 4, rotation: -Math.PI / 2 }, style);
}

export function drawHexagonOutline(
  g: Graphics,
  params: Omit<PolygonParams, 'sides'>,
  style: Pick<ShapeStyle, 'stroke' | 'strokeWidth' | 'strokeAlpha' | 'strokeStyle' | 'strokeDashPattern' | 'strokeDashOffset'>
): void {
  drawPolygonOutline(g, { ...params, sides: 6 }, style);
}
