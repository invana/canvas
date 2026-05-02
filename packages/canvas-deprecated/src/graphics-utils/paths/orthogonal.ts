/**
 * Orthogonal path — right-angle routed lines (for graph/flowchart edges).
 * Supports L-shape, Z-shape, S-shape routing with optional rounded corners.
 */

import type { Graphics } from 'pixi.js';
import { resolveStrokeOpts } from '../types.js';
import type { Direction, OrthogonalPoint, OrthogonalStyle } from './orthogonal-types.js';

export type { Direction, OrthogonalPoint, OrthogonalStyle };

export interface OrthogonalParams {
  from: OrthogonalPoint;
  to: OrthogonalPoint;
  sourceDirection?: Direction;
  targetDirection?: Direction;
  /** Minimum segment length before a bend (px) */
  minSegmentLength?: number;
  /** Corner radius for rounded variant (px, 0 = sharp) */
  cornerRadius?: number;
}

// ─── Routing helpers ──────────────────────────────────────────────────────────

function inferDir(from: OrthogonalPoint, to: OrthogonalPoint, isSource: boolean): Direction {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (isSource) {
    return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'bottom' : 'top');
  }
  return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'left' : 'right') : (dy > 0 ? 'top' : 'bottom');
}

function dirVec(dir: Direction): OrthogonalPoint {
  switch (dir) {
    case 'top':    return { x: 0,  y: -1 };
    case 'bottom': return { x: 0,  y:  1 };
    case 'left':   return { x: -1, y:  0 };
    case 'right':  return { x:  1, y:  0 };
    default:       return { x:  0, y:  0 };
  }
}

const isH = (d: Direction) => d === 'left' || d === 'right';
const isV = (d: Direction) => d === 'top'  || d === 'bottom';

function waypoints(
  from: OrthogonalPoint,
  to: OrthogonalPoint,
  srcDir: Direction,
  tgtDir: Direction,
  minLen: number,
): OrthogonalPoint[] {
  const pts: OrthogonalPoint[] = [];
  const v = dirVec(srcDir);

  if (isH(srcDir) && isH(tgtDir)) {
    const midX = (from.x + to.x) / 2;
    if (srcDir === tgtDir) {
      const ox = srcDir === 'right' ? Math.max(from.x, to.x) + minLen : Math.min(from.x, to.x) - minLen;
      pts.push({ x: ox, y: from.y }, { x: ox, y: to.y });
    } else {
      pts.push({ x: midX, y: from.y }, { x: midX, y: to.y });
    }
  } else if (isV(srcDir) && isV(tgtDir)) {
    const midY = (from.y + to.y) / 2;
    if (srcDir === tgtDir) {
      const oy = srcDir === 'bottom' ? Math.max(from.y, to.y) + minLen : Math.min(from.y, to.y) - minLen;
      pts.push({ x: from.x, y: oy }, { x: to.x, y: oy });
    } else {
      pts.push({ x: from.x, y: midY }, { x: to.x, y: midY });
    }
  } else if (isH(srcDir)) {
    const needsS =
      (srcDir === 'right' && to.x < from.x + minLen) ||
      (srcDir === 'left'  && to.x > from.x - minLen);
    if (needsS) {
      const ox = from.x + v.x * minLen;
      const midY = (from.y + to.y) / 2;
      pts.push({ x: ox, y: from.y }, { x: ox, y: midY }, { x: to.x, y: midY });
    } else {
      pts.push({ x: to.x, y: from.y });
    }
  } else {
    const needsS =
      (srcDir === 'bottom' && to.y < from.y + minLen) ||
      (srcDir === 'top'    && to.y > from.y - minLen);
    if (needsS) {
      const oy = from.y + v.y * minLen;
      const midX = (from.x + to.x) / 2;
      pts.push({ x: from.x, y: oy }, { x: midX, y: oy }, { x: midX, y: to.y });
    } else {
      pts.push({ x: from.x, y: to.y });
    }
  }
  // suppress unused tgtDir warning
  void tgtDir;
  return pts;
}

export function calculateOrthogonalPath(params: OrthogonalParams): OrthogonalPoint[] {
  const { from, to, sourceDirection = 'auto', targetDirection = 'auto', minSegmentLength = 20 } = params;
  const srcDir = sourceDirection === 'auto' ? inferDir(from, to, true)  : sourceDirection;
  const tgtDir = targetDirection === 'auto' ? inferDir(to, from, false) : targetDirection;
  return [from, ...waypoints(from, to, srcDir, tgtDir, minSegmentLength), to];
}

// ─── Draw ─────────────────────────────────────────────────────────────────────

export function drawOrthogonalPath(
  g: Graphics,
  params: OrthogonalParams,
  style: OrthogonalStyle = {},
): void {
  const points = calculateOrthogonalPath(params);
  if (points.length < 2) return;

  g.moveTo(points[0]!.x, points[0]!.y);
  for (let i = 1; i < points.length; i++) g.lineTo(points[i]!.x, points[i]!.y);
  g.stroke(resolveStrokeOpts(style, { cap: 'square', join: 'miter' }));
}

export function drawRoundedOrthogonalPath(
  g: Graphics,
  params: OrthogonalParams,
  style: OrthogonalStyle = {},
): void {
  const { cornerRadius = 8 } = params;
  const points = calculateOrthogonalPath(params);
  if (points.length < 2) return;

  g.moveTo(points[0]!.x, points[0]!.y);

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1]!;
    const curr = points[i]!;
    const next = points[i + 1]!;

    const v1 = { x: curr.x - prev.x, y: curr.y - prev.y };
    const v2 = { x: next.x - curr.x, y: next.y - curr.y };
    const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
    const r = Math.min(len1 / 2, len2 / 2, cornerRadius);

    const arcStart = { x: curr.x - (v1.x / len1) * r, y: curr.y - (v1.y / len1) * r };
    const arcEnd   = { x: curr.x + (v2.x / len2) * r, y: curr.y + (v2.y / len2) * r };

    g.lineTo(arcStart.x, arcStart.y);
    g.quadraticCurveTo(curr.x, curr.y, arcEnd.x, arcEnd.y);
  }

  const last = points[points.length - 1]!;
  g.lineTo(last.x, last.y);
  g.stroke(resolveStrokeOpts(style, { cap: 'round', join: 'round' }));
}
