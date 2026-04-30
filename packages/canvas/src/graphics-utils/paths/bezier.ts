import type { Graphics } from 'pixi.js';
import type { PathStyle } from '../types.js';

export interface BezierPoint { x: number; y: number; }

/**
 * Draw a cubic bezier curve.
 * If cp2 is omitted the curve is treated as quadratic.
 */
export function drawBezier(
  g: Graphics,
  from: BezierPoint,
  cp1: BezierPoint,
  to: BezierPoint,
  style: PathStyle = {},
  cp2?: BezierPoint,
): void {
  const { stroke = 0xffffff, strokeWidth = 1, strokeAlpha = 1, strokeCap, strokeJoin, strokeAlignment, strokeMiterLimit } = style;
  g.moveTo(from.x, from.y);
  if (cp2) {
    g.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, to.x, to.y);
  } else {
    g.quadraticCurveTo(cp1.x, cp1.y, to.x, to.y);
  }
  g.stroke({ color: stroke, width: strokeWidth, alpha: strokeAlpha, cap: strokeCap, join: strokeJoin, alignment: strokeAlignment, miterLimit: strokeMiterLimit });
}

/**
 * Draw a smooth auto-bezier between two points with a curvature offset.
 * curvature > 0 bulges upward, < 0 downward.
 */
export function drawAutoBezier(
  g: Graphics,
  from: BezierPoint,
  to: BezierPoint,
  style: PathStyle = {},
  curvature = 80,
): void {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const cp = {
    x: midX - (dy / len) * curvature,
    y: midY + (dx / len) * curvature,
  };
  drawBezier(g, from, cp, to, style);
}
