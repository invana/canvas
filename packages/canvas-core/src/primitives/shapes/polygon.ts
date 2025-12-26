/**
 * Polygon Shape Drawing Functions
 */

import type { Graphics } from 'pixi.js';
import type { ShapeStyle } from './types.js';

export interface PolygonParams {
  x: number;
  y: number;
  radius: number;
  sides: number;
  /** Rotation offset in radians. Default: -Math.PI/2 (point up) */
  rotation?: number;
}

/**
 * Generate polygon vertex points
 */
export function getPolygonPoints(params: PolygonParams): number[] {
  const { x, y, radius, sides, rotation = -Math.PI / 2 } = params;
  const points: number[] = [];
  const angleStep = (Math.PI * 2) / sides;

  for (let i = 0; i < sides; i++) {
    const angle = i * angleStep + rotation;
    points.push(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
  }

  return points;
}

/**
 * Draw a filled and/or stroked regular polygon
 */
export function drawPolygon(g: Graphics, params: PolygonParams, style: ShapeStyle): void {
  const points = getPolygonPoints(params);

  if (style.fill) {
    g.poly(points);
    g.fill({ color: style.fill, alpha: style.fillAlpha ?? 1 });
  }

  if (style.stroke && (style.strokeWidth ?? 0) > 0) {
    g.poly(points);
    g.stroke({
      color: style.stroke,
      width: style.strokeWidth ?? 1,
      alpha: style.strokeAlpha ?? 1,
    });
  }
}

/**
 * Draw polygon outline only (no fill)
 */
export function drawPolygonOutline(
  g: Graphics,
  params: PolygonParams,
  style: Pick<ShapeStyle, 'stroke' | 'strokeWidth' | 'strokeAlpha'>
): void {
  const points = getPolygonPoints(params);
  g.poly(points);
  g.stroke({
    color: style.stroke ?? '#000000',
    width: style.strokeWidth ?? 1,
    alpha: style.strokeAlpha ?? 1,
  });
}

/**
 * Draw polygon from raw points array
 */
export function drawPolygonFromPoints(g: Graphics, points: number[], style: ShapeStyle): void {
  if (style.fill) {
    g.poly(points);
    g.fill({ color: style.fill, alpha: style.fillAlpha ?? 1 });
  }

  if (style.stroke && (style.strokeWidth ?? 0) > 0) {
    g.poly(points);
    g.stroke({
      color: style.stroke,
      width: style.strokeWidth ?? 1,
      alpha: style.strokeAlpha ?? 1,
    });
  }
}

/**
 * Draw polygon outline from raw points array
 */
export function drawPolygonOutlineFromPoints(
  g: Graphics,
  points: number[],
  style: Pick<ShapeStyle, 'stroke' | 'strokeWidth' | 'strokeAlpha'>
): void {
  g.poly(points);
  g.stroke({
    color: style.stroke ?? '#000000',
    width: style.strokeWidth ?? 1,
    alpha: style.strokeAlpha ?? 1,
  });
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
  style: Pick<ShapeStyle, 'stroke' | 'strokeWidth' | 'strokeAlpha'>
): void {
  drawPolygonOutline(g, { ...params, sides: 3 }, style);
}

export function drawDiamondOutline(
  g: Graphics,
  params: Omit<PolygonParams, 'sides' | 'rotation'>,
  style: Pick<ShapeStyle, 'stroke' | 'strokeWidth' | 'strokeAlpha'>
): void {
  drawPolygonOutline(g, { ...params, sides: 4, rotation: -Math.PI / 2 }, style);
}

export function drawHexagonOutline(
  g: Graphics,
  params: Omit<PolygonParams, 'sides'>,
  style: Pick<ShapeStyle, 'stroke' | 'strokeWidth' | 'strokeAlpha'>
): void {
  drawPolygonOutline(g, { ...params, sides: 6 }, style);
}
