/**
 * Line Path Drawing
 * Simple straight line between two points
 */

import type { Graphics } from 'pixi.js';
import type { Point, PathStyle } from './types';

/**
 * Parameters for drawing a line
 */
export interface LineParams {
  /** Start point */
  from: Point;
  /** End point */
  to: Point;
}

/**
 * Draw a straight line between two points
 */
export function drawLine(g: Graphics, params: LineParams, style: PathStyle): void {
  const { from, to } = params;
  
  g.moveTo(from.x, from.y);
  g.lineTo(to.x, to.y);
  g.stroke({
    color: style.stroke,
    width: style.strokeWidth,
    alpha: style.strokeAlpha ?? 1,
    cap: style.lineCap ?? 'round',
    join: style.lineJoin ?? 'round',
  });
}

/**
 * Draw a polyline through multiple points
 */
export interface PolylineParams {
  points: Point[];
}

export function drawPolyline(g: Graphics, params: PolylineParams, style: PathStyle): void {
  const { points } = params;
  if (points.length < 2) return;

  const first = points[0]!;
  g.moveTo(first.x, first.y);
  for (let i = 1; i < points.length; i++) {
    const p = points[i]!;
    g.lineTo(p.x, p.y);
  }
  g.stroke({
    color: style.stroke,
    width: style.strokeWidth,
    alpha: style.strokeAlpha ?? 1,
    cap: style.lineCap ?? 'round',
    join: style.lineJoin ?? 'round',
  });
}

/**
 * Get the tangent angle at the end of a line (direction pointing from start to end)
 */
export function getLineTangentAtEnd(from: Point, to: Point): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

/**
 * Get the tangent angle at the start of a line (direction pointing from start to end)
 */
export function getLineTangentAtStart(from: Point, to: Point): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

/**
 * Calculate a point offset from the end of the line
 * (used for positioning arrow heads)
 */
export function getLineEndOffset(from: Point, to: Point, offset: number): Point {
  const angle = getLineTangentAtEnd(from, to);
  return {
    x: to.x - Math.cos(angle) * offset,
    y: to.y - Math.sin(angle) * offset,
  };
}

/**
 * Calculate a point offset from the start of the line
 */
export function getLineStartOffset(from: Point, to: Point, offset: number): Point {
  const angle = getLineTangentAtStart(from, to);
  return {
    x: from.x + Math.cos(angle) * offset,
    y: from.y + Math.sin(angle) * offset,
  };
}
