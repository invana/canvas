/**
 * Path Drawing Types
 * Common types for all path/line drawing functions
 */

import type { Graphics } from 'pixi.js';

/**
 * A 2D point
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Style options for path stroke
 */
export interface PathStyle {
  stroke: string;
  strokeWidth: number;
  strokeAlpha?: number;
  lineDash?: number[];
  lineCap?: 'butt' | 'round' | 'square';
  lineJoin?: 'miter' | 'round' | 'bevel';
}

/**
 * A path drawing function signature
 */
export type PathDrawFn<TParams = unknown> = (
  g: Graphics,
  params: TParams,
  style: PathStyle
) => void;

/**
 * Direction hints for orthogonal routing
 */
export type Direction = 'top' | 'bottom' | 'left' | 'right' | 'auto';

/**
 * Calculate the angle between two points
 */
export function getAngle(from: Point, to: Point): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

/**
 * Calculate the distance between two points
 */
export function getDistance(from: Point, to: Point): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Get midpoint between two points
 */
export function getMidpoint(from: Point, to: Point): Point {
  return {
    x: (from.x + to.x) / 2,
    y: (from.y + to.y) / 2,
  };
}

/**
 * Get point at a specific position along a line (0 = start, 1 = end)
 */
export function getPointOnLine(from: Point, to: Point, t: number): Point {
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
  };
}
