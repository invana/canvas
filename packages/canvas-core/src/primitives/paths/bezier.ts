/**
 * Bezier Curve Path Drawing
 * Quadratic and cubic bezier curves
 */

import type { Graphics } from 'pixi.js';
import type { Point, PathStyle } from './types';

/**
 * Parameters for a quadratic bezier curve
 */
export interface QuadraticBezierParams {
  from: Point;
  to: Point;
  control: Point;
}

/**
 * Parameters for a cubic bezier curve
 */
export interface CubicBezierParams {
  from: Point;
  to: Point;
  control1: Point;
  control2: Point;
}

/**
 * Parameters for auto-curved bezier (control point calculated automatically)
 */
export interface AutoBezierParams {
  from: Point;
  to: Point;
  /** Curvature amount (0 = straight, positive = curve one way, negative = opposite) */
  curvature?: number;
}

/**
 * Draw a quadratic bezier curve
 */
export function drawQuadraticBezier(
  g: Graphics,
  params: QuadraticBezierParams,
  style: PathStyle
): void {
  const { from, to, control } = params;

  g.moveTo(from.x, from.y);
  g.quadraticCurveTo(control.x, control.y, to.x, to.y);
  g.stroke({
    color: style.stroke,
    width: style.strokeWidth,
    alpha: style.strokeAlpha ?? 1,
    cap: style.lineCap ?? 'round',
    join: style.lineJoin ?? 'round',
  });
}

/**
 * Draw a cubic bezier curve
 */
export function drawCubicBezier(
  g: Graphics,
  params: CubicBezierParams,
  style: PathStyle
): void {
  const { from, to, control1, control2 } = params;

  g.moveTo(from.x, from.y);
  g.bezierCurveTo(control1.x, control1.y, control2.x, control2.y, to.x, to.y);
  g.stroke({
    color: style.stroke,
    width: style.strokeWidth,
    alpha: style.strokeAlpha ?? 1,
    cap: style.lineCap ?? 'round',
    join: style.lineJoin ?? 'round',
  });
}

/**
 * Calculate the control point for an auto-curved quadratic bezier
 */
export function calculateQuadraticControl(
  from: Point,
  to: Point,
  curvature: number = 0.3
): Point {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;

  // Perpendicular vector
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  // Normalized perpendicular
  const perpX = -dy / length;
  const perpY = dx / length;

  // Offset the midpoint perpendicular to the line
  const offset = length * curvature;
  return {
    x: midX + perpX * offset,
    y: midY + perpY * offset,
  };
}

/**
 * Calculate control points for an auto-curved cubic bezier
 */
export function calculateCubicControls(
  from: Point,
  to: Point,
  curvature: number = 0.3
): { control1: Point; control2: Point } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  // Perpendicular vector
  const perpX = -dy / length;
  const perpY = dx / length;

  const offset = length * curvature;

  return {
    control1: {
      x: from.x + dx * 0.25 + perpX * offset,
      y: from.y + dy * 0.25 + perpY * offset,
    },
    control2: {
      x: from.x + dx * 0.75 + perpX * offset,
      y: from.y + dy * 0.75 + perpY * offset,
    },
  };
}

/**
 * Draw a bezier curve with auto-calculated control points
 */
export function drawAutoBezier(
  g: Graphics,
  params: AutoBezierParams,
  style: PathStyle
): void {
  const { from, to, curvature = 0.3 } = params;
  const control = calculateQuadraticControl(from, to, curvature);
  drawQuadraticBezier(g, { from, to, control }, style);
}

/**
 * Get point on a quadratic bezier at parameter t (0 to 1)
 */
export function getQuadraticBezierPoint(
  from: Point,
  control: Point,
  to: Point,
  t: number
): Point {
  const mt = 1 - t;
  return {
    x: mt * mt * from.x + 2 * mt * t * control.x + t * t * to.x,
    y: mt * mt * from.y + 2 * mt * t * control.y + t * t * to.y,
  };
}

/**
 * Get point on a cubic bezier at parameter t (0 to 1)
 */
export function getCubicBezierPoint(
  from: Point,
  control1: Point,
  control2: Point,
  to: Point,
  t: number
): Point {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  return {
    x: mt2 * mt * from.x + 3 * mt2 * t * control1.x + 3 * mt * t2 * control2.x + t2 * t * to.x,
    y: mt2 * mt * from.y + 3 * mt2 * t * control1.y + 3 * mt * t2 * control2.y + t2 * t * to.y,
  };
}

/**
 * Get tangent angle at the end of a quadratic bezier
 */
export function getQuadraticTangentAtEnd(
  control: Point,
  to: Point
): number {
  return Math.atan2(to.y - control.y, to.x - control.x);
}

/**
 * Get tangent angle at the start of a quadratic bezier
 */
export function getQuadraticTangentAtStart(
  from: Point,
  control: Point
): number {
  return Math.atan2(control.y - from.y, control.x - from.x);
}

/**
 * Get tangent angle at the end of a cubic bezier
 */
export function getCubicTangentAtEnd(
  control2: Point,
  to: Point
): number {
  return Math.atan2(to.y - control2.y, to.x - control2.x);
}

/**
 * Get tangent angle at the start of a cubic bezier
 */
export function getCubicTangentAtStart(
  from: Point,
  control1: Point
): number {
  return Math.atan2(control1.y - from.y, control1.x - from.x);
}

/**
 * Calculate end point offset along bezier tangent (for arrow positioning)
 */
export function getQuadraticEndOffset(
  control: Point,
  to: Point,
  offset: number
): Point {
  const angle = getQuadraticTangentAtEnd(control, to);
  return {
    x: to.x - Math.cos(angle) * offset,
    y: to.y - Math.sin(angle) * offset,
  };
}

/**
 * Calculate start point offset along bezier tangent (for arrow positioning)
 */
export function getQuadraticStartOffset(
  from: Point,
  control: Point,
  offset: number
): Point {
  const angle = getQuadraticTangentAtStart(from, control);
  return {
    x: from.x + Math.cos(angle) * offset,
    y: from.y + Math.sin(angle) * offset,
  };
}
