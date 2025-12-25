/**
 * Geometry utilities for intersection calculations, offsets, and shape math
 */

import type { Vector2 } from './vector.js';

// ============================================================================
// Point/Line Intersection
// ============================================================================

/**
 * Calculate the intersection point of a line with a circle
 * @param lineStart - Start point of the line
 * @param lineEnd - End point of the line (usually center of circle)
 * @param center - Center of the circle
 * @param radius - Radius of the circle
 * @returns Intersection point or null if no intersection
 */
export function lineCircleIntersection(
  lineStart: Vector2,
  lineEnd: Vector2,
  center: Vector2,
  radius: number,
): Vector2 | null {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length === 0) return null;

  // Normalize direction
  const dirX = dx / length;
  const dirY = dy / length;

  // Vector from line start to circle center
  const fx = lineStart.x - center.x;
  const fy = lineStart.y - center.y;

  const a = dirX * dirX + dirY * dirY; // Should be 1 for normalized
  const b = 2 * (fx * dirX + fy * dirY);
  const c = fx * fx + fy * fy - radius * radius;

  const discriminant = b * b - 4 * a * c;

  if (discriminant < 0) {
    // No intersection, return point on circle closest to line end
    const angle = Math.atan2(lineStart.y - center.y, lineStart.x - center.x);
    return {
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
    };
  }

  const sqrtDiscriminant = Math.sqrt(discriminant);
  const t1 = (-b - sqrtDiscriminant) / (2 * a);
  const t2 = (-b + sqrtDiscriminant) / (2 * a);

  // Use the intersection point closer to lineEnd
  const t = t2 > 0 ? t2 : t1;

  return {
    x: lineStart.x + t * dirX,
    y: lineStart.y + t * dirY,
  };
}

/**
 * Calculate the intersection point of a line with an ellipse
 */
export function lineEllipseIntersection(
  lineStart: Vector2,
  lineEnd: Vector2,
  center: Vector2,
  radiusX: number,
  radiusY: number,
): Vector2 | null {
  // Transform to unit circle space
  const dx = (lineEnd.x - lineStart.x) / radiusX;
  const dy = (lineEnd.y - lineStart.y) / radiusY;
  const fx = (lineStart.x - center.x) / radiusX;
  const fy = (lineStart.y - center.y) / radiusY;

  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - 1;

  const discriminant = b * b - 4 * a * c;

  if (discriminant < 0) {
    const angle = Math.atan2(lineStart.y - center.y, lineStart.x - center.x);
    return {
      x: center.x + radiusX * Math.cos(angle),
      y: center.y + radiusY * Math.sin(angle),
    };
  }

  const sqrtDiscriminant = Math.sqrt(discriminant);
  const t = (-b + sqrtDiscriminant) / (2 * a);

  return {
    x: lineStart.x + t * (lineEnd.x - lineStart.x),
    y: lineStart.y + t * (lineEnd.y - lineStart.y),
  };
}

/**
 * Calculate the intersection point of a line with a rectangle
 */
export function lineRectIntersection(
  lineStart: Vector2,
  lineEnd: Vector2,
  rectCenter: Vector2,
  width: number,
  height: number,
): Vector2 | null {
  const halfW = width / 2;
  const halfH = height / 2;

  const left = rectCenter.x - halfW;
  const right = rectCenter.x + halfW;
  const top = rectCenter.y - halfH;
  const bottom = rectCenter.y + halfH;

  // Check all four edges
  const edges = [
    { p1: { x: left, y: top }, p2: { x: right, y: top } },     // Top
    { p1: { x: right, y: top }, p2: { x: right, y: bottom } }, // Right
    { p1: { x: left, y: bottom }, p2: { x: right, y: bottom } }, // Bottom
    { p1: { x: left, y: top }, p2: { x: left, y: bottom } },   // Left
  ];

  let closestIntersection: Vector2 | null = null;
  let closestDist = Infinity;

  for (const edge of edges) {
    const intersection = lineSegmentIntersection(lineStart, lineEnd, edge.p1, edge.p2);
    if (intersection) {
      const dist = distance(lineStart, intersection);
      if (dist < closestDist) {
        closestDist = dist;
        closestIntersection = intersection;
      }
    }
  }

  return closestIntersection;
}

/**
 * Calculate the intersection point of a line with a rounded rectangle
 */
export function lineRoundedRectIntersection(
  lineStart: Vector2,
  lineEnd: Vector2,
  rectCenter: Vector2,
  width: number,
  height: number,
  cornerRadius: number,
): Vector2 | null {
  const halfW = width / 2;
  const halfH = height / 2;
  const r = Math.min(cornerRadius, halfW, halfH);

  // Check if intersection is in corner region
  const dx = lineStart.x - rectCenter.x;
  const dy = lineStart.y - rectCenter.y;

  const inCornerX = Math.abs(dx) > halfW - r;
  const inCornerY = Math.abs(dy) > halfH - r;

  if (inCornerX && inCornerY) {
    // Intersection with corner circle
    const cornerX = rectCenter.x + (dx > 0 ? halfW - r : -(halfW - r));
    const cornerY = rectCenter.y + (dy > 0 ? halfH - r : -(halfH - r));
    return lineCircleIntersection(lineStart, lineEnd, { x: cornerX, y: cornerY }, r);
  }

  // Intersection with straight edge
  return lineRectIntersection(lineStart, lineEnd, rectCenter, width - 2 * r, height - 2 * r);
}

/**
 * Calculate the intersection point of a line with a polygon
 */
export function linePolygonIntersection(
  lineStart: Vector2,
  lineEnd: Vector2,
  center: Vector2,
  vertices: Vector2[],
): Vector2 | null {
  if (vertices.length < 3) return null;

  let closestIntersection: Vector2 | null = null;
  let closestDist = Infinity;

  // Check all edges of the polygon
  for (let i = 0; i < vertices.length; i++) {
    const p1 = {
      x: center.x + vertices[i]!.x,
      y: center.y + vertices[i]!.y,
    };
    const p2 = {
      x: center.x + vertices[(i + 1) % vertices.length]!.x,
      y: center.y + vertices[(i + 1) % vertices.length]!.y,
    };

    const intersection = lineSegmentIntersection(lineStart, lineEnd, p1, p2);
    if (intersection) {
      const dist = distance(lineStart, intersection);
      if (dist < closestDist) {
        closestDist = dist;
        closestIntersection = intersection;
      }
    }
  }

  return closestIntersection;
}

/**
 * Calculate intersection point of two line segments
 */
export function lineSegmentIntersection(
  p1: Vector2,
  p2: Vector2,
  p3: Vector2,
  p4: Vector2,
): Vector2 | null {
  const denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);

  if (Math.abs(denom) < 1e-10) {
    return null; // Lines are parallel
  }

  const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;
  const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom;

  // Check if intersection is within both segments
  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    return {
      x: p1.x + ua * (p2.x - p1.x),
      y: p1.y + ua * (p2.y - p1.y),
    };
  }

  return null;
}

// ============================================================================
// Polygon Vertex Generation
// ============================================================================

/**
 * Generate vertices for a regular polygon
 */
export function getRegularPolygonVertices(
  sides: number,
  radius: number,
  rotation: number = -Math.PI / 2,
): Vector2[] {
  const vertices: Vector2[] = [];
  const angleStep = (2 * Math.PI) / sides;

  for (let i = 0; i < sides; i++) {
    const angle = rotation + i * angleStep;
    vertices.push({
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
    });
  }

  return vertices;
}

/**
 * Generate vertices for a diamond shape
 */
export function getDiamondVertices(width: number, height: number): Vector2[] {
  const halfW = width / 2;
  const halfH = height / 2;
  return [
    { x: 0, y: -halfH },     // Top
    { x: halfW, y: 0 },      // Right
    { x: 0, y: halfH },      // Bottom
    { x: -halfW, y: 0 },     // Left
  ];
}

/**
 * Generate vertices for a star shape
 */
export function getStarVertices(
  points: number,
  outerRadius: number,
  innerRadius: number,
  rotation: number = -Math.PI / 2,
): Vector2[] {
  const vertices: Vector2[] = [];
  const totalPoints = points * 2;
  const angleStep = Math.PI / points;

  for (let i = 0; i < totalPoints; i++) {
    const angle = rotation + i * angleStep;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    vertices.push({
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
    });
  }

  return vertices;
}

// ============================================================================
// Point/Vector Utilities
// ============================================================================

/**
 * Calculate distance between two points
 */
export function distance(p1: Vector2, p2: Vector2): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate angle from p1 to p2 in radians
 */
export function angle(p1: Vector2, p2: Vector2): number {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}

/**
 * Move a point along a direction by a distance
 */
export function movePoint(point: Vector2, angleRad: number, dist: number): Vector2 {
  return {
    x: point.x + dist * Math.cos(angleRad),
    y: point.y + dist * Math.sin(angleRad),
  };
}

/**
 * Move a point towards another point by a distance
 */
export function moveTowards(from: Vector2, to: Vector2, dist: number): Vector2 {
  const a = angle(from, to);
  return movePoint(from, a, dist);
}

/**
 * Move a point away from another point by a distance
 */
export function moveAway(from: Vector2, awayFrom: Vector2, dist: number): Vector2 {
  const a = angle(awayFrom, from);
  return movePoint(from, a, dist);
}

/**
 * Get point at parameter t along a line (0 = start, 1 = end)
 */
export function lerp(p1: Vector2, p2: Vector2, t: number): Vector2 {
  return {
    x: p1.x + (p2.x - p1.x) * t,
    y: p1.y + (p2.y - p1.y) * t,
  };
}

/**
 * Get midpoint between two points
 */
export function midpoint(p1: Vector2, p2: Vector2): Vector2 {
  return lerp(p1, p2, 0.5);
}

/**
 * Normalize angle to range [-PI, PI]
 */
export function normalizeAngle(angle: number): number {
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;
  return angle;
}

/**
 * Rotate a point around an origin
 */
export function rotatePoint(point: Vector2, origin: Vector2, angleRad: number): Vector2 {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const dx = point.x - origin.x;
  const dy = point.y - origin.y;
  return {
    x: origin.x + dx * cos - dy * sin,
    y: origin.y + dx * sin + dy * cos,
  };
}

// ============================================================================
// Bezier Curve Utilities
// ============================================================================

/**
 * Get point on quadratic bezier curve at parameter t
 */
export function quadraticBezierPoint(
  p0: Vector2,
  p1: Vector2,
  p2: Vector2,
  t: number,
): Vector2 {
  const mt = 1 - t;
  return {
    x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
  };
}

/**
 * Get point on cubic bezier curve at parameter t
 */
export function cubicBezierPoint(
  p0: Vector2,
  p1: Vector2,
  p2: Vector2,
  p3: Vector2,
  t: number,
): Vector2 {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
    y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y,
  };
}

/**
 * Get tangent angle on quadratic bezier curve at parameter t
 */
export function quadraticBezierTangent(
  p0: Vector2,
  p1: Vector2,
  p2: Vector2,
  t: number,
): number {
  const mt = 1 - t;
  const dx = 2 * mt * (p1.x - p0.x) + 2 * t * (p2.x - p1.x);
  const dy = 2 * mt * (p1.y - p0.y) + 2 * t * (p2.y - p1.y);
  return Math.atan2(dy, dx);
}

/**
 * Get tangent angle on cubic bezier curve at parameter t
 */
export function cubicBezierTangent(
  p0: Vector2,
  p1: Vector2,
  p2: Vector2,
  p3: Vector2,
  t: number,
): number {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  const dx =
    3 * mt2 * (p1.x - p0.x) + 6 * mt * t * (p2.x - p1.x) + 3 * t2 * (p3.x - p2.x);
  const dy =
    3 * mt2 * (p1.y - p0.y) + 6 * mt * t * (p2.y - p1.y) + 3 * t2 * (p3.y - p2.y);
  return Math.atan2(dy, dx);
}

// ============================================================================
// Edge Endpoint Calculations
// ============================================================================

export interface EdgeEndpoints {
  source: Vector2;
  target: Vector2;
  sourceAngle: number;
  targetAngle: number;
}

/**
 * Calculate edge endpoints with offsets applied
 */
export function calculateEdgeEndpoints(
  sourceIntersection: Vector2,
  targetIntersection: Vector2,
  sourceOffset: number = 0,
  targetOffset: number = 0,
): EdgeEndpoints {
  const sourceAngle = angle(sourceIntersection, targetIntersection);
  const targetAngle = angle(targetIntersection, sourceIntersection);

  const source = sourceOffset > 0
    ? movePoint(sourceIntersection, sourceAngle, sourceOffset)
    : sourceIntersection;

  const target = targetOffset > 0
    ? movePoint(targetIntersection, targetAngle, targetOffset)
    : targetIntersection;

  return {
    source,
    target,
    sourceAngle,
    targetAngle,
  };
}

// Export namespace for convenient access
export const geometry = {
  // Intersection
  lineCircleIntersection,
  lineEllipseIntersection,
  lineRectIntersection,
  lineRoundedRectIntersection,
  linePolygonIntersection,
  lineSegmentIntersection,

  // Polygon vertices
  getRegularPolygonVertices,
  getDiamondVertices,
  getStarVertices,

  // Point/Vector
  distance,
  angle,
  movePoint,
  moveTowards,
  moveAway,
  lerp,
  midpoint,
  normalizeAngle,
  rotatePoint,

  // Bezier
  quadraticBezierPoint,
  cubicBezierPoint,
  quadraticBezierTangent,
  cubicBezierTangent,

  // Edge
  calculateEdgeEndpoints,
};
