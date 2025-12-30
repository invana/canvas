/**
 * Line Path Drawing
 * Simple straight line between two points
 */

import type { Graphics } from 'pixi.js';
import type { Point, PathStyle } from './types';
import { drawDashedLine, drawDottedLine, drawPatternLine } from '../shapes/dashedStrokes';
import { getStrokeOptions } from '../shapes/strokeHelper';

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
 * Get stroke dash pattern from style
 */
function getStrokeDashPattern(style: PathStyle): number[] | null {
  // If custom pattern provided, use it
  if (style.strokeDashPattern && style.strokeDashPattern.length >= 2) {
    return style.strokeDashPattern;
  }

  // Check strokeStyle for predefined patterns
  if (style.strokeStyle === 'dashed') {
    return [8, 4];
  } else if (style.strokeStyle === 'dotted') {
    return [2, 3];
  }

  // Default: solid (no dash)
  return null;
}

/**
 * Draw a straight line between two points
 */
export function drawLine(g: Graphics, params: LineParams, style: PathStyle): void {
  const { from, to } = params;
  const dashPattern = getStrokeDashPattern(style);
  const offset = style.strokeDashOffset ?? 0;
  
  if (dashPattern && dashPattern.length >= 2) {
    if (style.strokeStyle === 'dotted') {
      drawDottedLine(g, from.x, from.y, to.x, to.y, 
        dashPattern[0]! + dashPattern[1]!, 
        style.stroke, 
        style.strokeWidth, 
        style.strokeAlpha ?? 1,
        offset);
    } else if (dashPattern.length > 2) {
      drawPatternLine(g, from.x, from.y, to.x, to.y, 
        dashPattern, 
        style.stroke, 
        style.strokeWidth, 
        style.strokeAlpha ?? 1,
        offset);
    } else {
      drawDashedLine(g, from.x, from.y, to.x, to.y, 
        dashPattern[0]!, 
        dashPattern[1]!, 
        style.stroke, 
        style.strokeWidth, 
        style.strokeAlpha ?? 1,
        offset);
    }
  } else {
    // Solid stroke - use same pattern as shapes
    g.moveTo(from.x, from.y);
    g.lineTo(to.x, to.y);
    g.stroke(getStrokeOptions(style));
  }
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

  const dashPattern = getStrokeDashPattern(style);
  const offset = style.strokeDashOffset ?? 0;
  
  // If dashed/dotted, draw each segment individually
  if (dashPattern && dashPattern.length >= 2) {
    for (let i = 0; i < points.length - 1; i++) {
      const from = points[i]!;
      const to = points[i + 1]!;
      
      if (style.strokeStyle === 'dotted') {
        drawDottedLine(g, from.x, from.y, to.x, to.y,
          dashPattern[0]! + dashPattern[1]!,
          style.stroke,
          style.strokeWidth,
          style.strokeAlpha ?? 1,
          offset);
      } else if (dashPattern.length > 2) {
        drawPatternLine(g, from.x, from.y, to.x, to.y,
          dashPattern,
          style.stroke,
          style.strokeWidth,
          style.strokeAlpha ?? 1,
          offset);
      } else {
        drawDashedLine(g, from.x, from.y, to.x, to.y,
          dashPattern[0]!,
          dashPattern[1]!,
          style.stroke,
          style.strokeWidth,
          style.strokeAlpha ?? 1,
          offset);
      }
    }
  } else {
    // Solid line - use regular path
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
      cap: style.strokeCap ?? style.lineCap ?? 'round',
      join: style.lineJoin ?? 'round',
      alignment: style.strokeAlignment,
    });
  }
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
