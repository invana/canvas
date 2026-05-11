import type { IRouter, Point } from '../../types';

interface OneSideOpts {
  /**
   * Which side of the source the line must leave on. Default `'right'`.
   */
  readonly side?: 'top' | 'right' | 'bottom' | 'left';
  /**
   * How far the source projects along the chosen side direction before
   * turning toward the target. Default `30` world units.
   */
  readonly padLength?: number;
}

const DEFAULT_SIDE: 'right' = 'right';
const DEFAULT_PAD = 30;

/**
 * oneSide router — forces the line to exit the source on a designated side,
 * then routes orthogonally to the target. Useful for swimlane / "all on one
 * side" diagrams where every connector must leave the source in the same
 * direction regardless of where the target is.
 *
 * Polyline shape:
 *   `source → exit → midBend → target`
 *
 * - `exit`     — source stepped `padLength` along the side direction.
 * - `midBend`  — perpendicular to the side at the target's parallel axis
 *                (so the leg from exit→midBend is along the side direction
 *                inverted, and midBend→target is perpendicular).
 *
 * For 'right' / 'left' the exit/midBend legs are horizontal then vertical;
 * for 'top' / 'bottom' they're vertical then horizontal. When source and
 * target are perfectly aligned with the side direction the path collapses
 * to a single-leg traversal.
 *
 * Waypoints are not honoured by this router — its purpose is the forced
 * exit, not free-form routing. Pass `manhattan` for waypoint routing.
 */
export const oneSideRouter: IRouter = (source, target, _waypoints, opts) => {
  const o = opts as OneSideOpts | undefined;
  const side = o?.side ?? DEFAULT_SIDE;
  const pad = o?.padLength ?? DEFAULT_PAD;

  const isHorizontal = side === 'left' || side === 'right';
  const exit: Point = isHorizontal
    ? { x: source.x + (side === 'right' ? pad : -pad), y: source.y }
    : { x: source.x, y: source.y + (side === 'bottom' ? pad : -pad) };

  // For horizontal sides, midBend is at (exit.x, target.y) — vertical leg
  // from exit, horizontal leg to target. For vertical sides, swap axes.
  const midBend: Point = isHorizontal
    ? { x: exit.x, y: target.y }
    : { x: target.x, y: exit.y };

  const out: Point[] = [{ x: source.x, y: source.y }, exit];
  if (midBend.x !== exit.x || midBend.y !== exit.y) out.push(midBend);
  if (midBend.x !== target.x || midBend.y !== target.y) out.push({ x: target.x, y: target.y });
  else if (out[out.length - 1]!.x !== target.x || out[out.length - 1]!.y !== target.y) {
    out.push({ x: target.x, y: target.y });
  }

  return out;
};
