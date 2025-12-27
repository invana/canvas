/**
 * Orthogonal Path Drawing
 * Paths with only horizontal and vertical segments
 */

import type { Graphics } from 'pixi.js';
import type { Point, PathStyle, Direction } from './types';

/**
 * Parameters for orthogonal path
 */
export interface OrthogonalParams {
  from: Point;
  to: Point;
  /** Direction to exit from source */
  sourceDirection?: Direction;
  /** Direction to enter target */
  targetDirection?: Direction;
  /** Minimum segment length */
  minSegmentLength?: number;
}

/**
 * Calculate the orthogonal path waypoints
 */
export function calculateOrthogonalPath(params: OrthogonalParams): Point[] {
  const { from, to, sourceDirection = 'auto', targetDirection = 'auto', minSegmentLength = 20 } = params;

  const srcDir = sourceDirection === 'auto' ? inferDirection(from, to, true) : sourceDirection;
  const tgtDir = targetDirection === 'auto' ? inferDirection(to, from, false) : targetDirection;

  const points: Point[] = [from];
  
  // Calculate intermediate waypoints based on directions
  const waypoints = calculateWaypoints(from, to, srcDir, tgtDir, minSegmentLength);
  points.push(...waypoints);
  
  points.push(to);
  return points;
}

/**
 * Infer direction based on relative position
 */
function inferDirection(from: Point, to: Point, isSource: boolean): Direction {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  if (isSource) {
    // Source: prefer to exit toward target
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left';
    }
    return dy > 0 ? 'bottom' : 'top';
  } else {
    // Target: prefer to enter from the direction of source
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'left' : 'right';
    }
    return dy > 0 ? 'top' : 'bottom';
  }
}

/**
 * Calculate waypoints for orthogonal routing
 */
function calculateWaypoints(
  from: Point,
  to: Point,
  srcDir: Direction,
  tgtDir: Direction,
  minLen: number
): Point[] {
  const waypoints: Point[] = [];

  // Get direction vector for source
  const srcVec = getDirectionVector(srcDir);
  // Note: tgtDir is used for path logic below

  // Simple case: aligned axes
  if (isHorizontal(srcDir) && isHorizontal(tgtDir)) {
    // Both horizontal - use midpoint Y or staggered
    const midX = (from.x + to.x) / 2;
    if (srcDir === tgtDir) {
      // Same direction - need to go around
      const offsetX = srcDir === 'right' ? Math.max(from.x, to.x) + minLen : Math.min(from.x, to.x) - minLen;
      waypoints.push({ x: offsetX, y: from.y });
      waypoints.push({ x: offsetX, y: to.y });
    } else {
      // Opposite directions - simple Z routing
      waypoints.push({ x: midX, y: from.y });
      waypoints.push({ x: midX, y: to.y });
    }
  } else if (isVertical(srcDir) && isVertical(tgtDir)) {
    // Both vertical - use midpoint X or staggered
    const midY = (from.y + to.y) / 2;
    if (srcDir === tgtDir) {
      // Same direction - need to go around
      const offsetY = srcDir === 'bottom' ? Math.max(from.y, to.y) + minLen : Math.min(from.y, to.y) - minLen;
      waypoints.push({ x: from.x, y: offsetY });
      waypoints.push({ x: to.x, y: offsetY });
    } else {
      // Opposite directions - simple Z routing
      waypoints.push({ x: from.x, y: midY });
      waypoints.push({ x: to.x, y: midY });
    }
  } else {
    // Mixed directions - L-shape or S-shape
    if (isHorizontal(srcDir)) {
      // Start horizontal, end vertical
      const corner = { x: to.x, y: from.y };
      
      // Check if we need extra segments
      if (
        (srcDir === 'right' && to.x < from.x + minLen) ||
        (srcDir === 'left' && to.x > from.x - minLen)
      ) {
        // Need S-shape
        const offsetX = from.x + srcVec.x * minLen;
        const midY = (from.y + to.y) / 2;
        waypoints.push({ x: offsetX, y: from.y });
        waypoints.push({ x: offsetX, y: midY });
        waypoints.push({ x: to.x, y: midY });
      } else {
        waypoints.push(corner);
      }
    } else {
      // Start vertical, end horizontal
      const corner = { x: from.x, y: to.y };
      
      // Check if we need extra segments
      if (
        (srcDir === 'bottom' && to.y < from.y + minLen) ||
        (srcDir === 'top' && to.y > from.y - minLen)
      ) {
        // Need S-shape
        const offsetY = from.y + srcVec.y * minLen;
        const midX = (from.x + to.x) / 2;
        waypoints.push({ x: from.x, y: offsetY });
        waypoints.push({ x: midX, y: offsetY });
        waypoints.push({ x: midX, y: to.y });
      } else {
        waypoints.push(corner);
      }
    }
  }

  return waypoints;
}

function getDirectionVector(dir: Direction): Point {
  switch (dir) {
    case 'top': return { x: 0, y: -1 };
    case 'bottom': return { x: 0, y: 1 };
    case 'left': return { x: -1, y: 0 };
    case 'right': return { x: 1, y: 0 };
    default: return { x: 0, y: 0 };
  }
}

function isHorizontal(dir: Direction): boolean {
  return dir === 'left' || dir === 'right';
}

function isVertical(dir: Direction): boolean {
  return dir === 'top' || dir === 'bottom';
}

/**
 * Draw an orthogonal path
 */
export function drawOrthogonalPath(
  g: Graphics,
  params: OrthogonalParams,
  style: PathStyle
): void {
  const points = calculateOrthogonalPath(params);
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
    cap: style.strokeCap ?? style.lineCap ?? 'square',
    join: style.lineJoin ?? 'miter',
    alignment: style.strokeAlignment,
  });
}

/**
 * Draw an orthogonal path with rounded corners
 */
export function drawRoundedOrthogonalPath(
  g: Graphics,
  params: OrthogonalParams & { cornerRadius?: number },
  style: PathStyle
): void {
  const { cornerRadius = 8 } = params;
  const points = calculateOrthogonalPath(params);
  if (points.length < 2) return;

  const first = points[0]!;
  g.moveTo(first.x, first.y);

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1]!;
    const curr = points[i]!;
    const next = points[i + 1]!;

    // Calculate vectors
    const v1 = { x: curr.x - prev.x, y: curr.y - prev.y };
    const v2 = { x: next.x - curr.x, y: next.y - curr.y };

    // Normalize and get lengths
    const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

    // Limit corner radius by segment lengths
    const maxRadius = Math.min(len1 / 2, len2 / 2, cornerRadius);

    // Points where arc starts and ends
    const arcStart = {
      x: curr.x - (v1.x / len1) * maxRadius,
      y: curr.y - (v1.y / len1) * maxRadius,
    };
    const arcEnd = {
      x: curr.x + (v2.x / len2) * maxRadius,
      y: curr.y + (v2.y / len2) * maxRadius,
    };

    g.lineTo(arcStart.x, arcStart.y);
    g.quadraticCurveTo(curr.x, curr.y, arcEnd.x, arcEnd.y);
  }

  // Final line to end point
  const lastPoint = points[points.length - 1]!;
  g.lineTo(lastPoint.x, lastPoint.y);

  g.stroke({
    color: style.stroke,
    width: style.strokeWidth,
    alpha: style.strokeAlpha ?? 1,
    cap: style.strokeCap ?? style.lineCap ?? 'round',
    join: style.lineJoin ?? 'round',
    alignment: style.strokeAlignment,
  });
}

/**
 * Get the tangent angle at the end of an orthogonal path
 */
export function getOrthogonalTangentAtEnd(params: OrthogonalParams): number {
  const points = calculateOrthogonalPath(params);
  if (points.length < 2) return 0;
  
  const last = points[points.length - 1]!;
  const prev = points[points.length - 2]!;
  return Math.atan2(last.y - prev.y, last.x - prev.x);
}

/**
 * Get the tangent angle at the start of an orthogonal path
 */
export function getOrthogonalTangentAtStart(params: OrthogonalParams): number {
  const points = calculateOrthogonalPath(params);
  if (points.length < 2) return 0;
  
  const p0 = points[0]!;
  const p1 = points[1]!;
  return Math.atan2(p1.y - p0.y, p1.x - p0.x);
}
