import type { IPathStyle, PathCommand } from '@invana/canvas-store';

interface BezierOpts {
  /**
   * Direction of the s-curve. `'h'` pulls control points horizontally,
   * `'v'` pulls them vertically, `'auto'` picks the dominant axis from the
   * source→target delta. Default `'auto'`.
   */
  readonly axis?: 'h' | 'v' | 'auto';
  /**
   * How far the control points pull along the axis, as a fraction of the
   * source→target delta on that axis. `0.5` produces a balanced s-curve;
   * `0` collapses to a straight line; `>0.5` produces an exaggerated swing.
   * Default `0.5`.
   */
  readonly tension?: number;
}

const DEFAULT_TENSION = 0.5;

/**
 * Single cubic Bézier between the first and last polyline points, with
 * auto-generated control handles. Intermediate polyline points (router
 * waypoints, manhattan corners, …) are **ignored** — pick `smooth` if you
 * want the path to follow them.
 *
 * Control-point strategy: direction-aware s-curve.
 * - For horizontal-dominant layouts the controls pull horizontally:
 *   `c1 = source + (dx * tension, 0)`, `c2 = target - (dx * tension, 0)`.
 *   Source leaves and target arrives along the x-axis.
 * - For vertical-dominant layouts the controls pull vertically.
 *
 * Output: `[M source, C target]` — a single curve segment.
 */
export const bezierPathStyle: IPathStyle = (polyline, opts) => {
  if (polyline.length < 2) return [];
  const o = opts as BezierOpts | undefined;
  const tension = o?.tension ?? DEFAULT_TENSION;
  const axisOpt = o?.axis ?? 'auto';

  const s = polyline[0]!;
  const t = polyline[polyline.length - 1]!;
  const dx = t.x - s.x;
  const dy = t.y - s.y;

  const axis: 'h' | 'v' = axisOpt === 'auto'
    ? Math.abs(dx) >= Math.abs(dy) ? 'h' : 'v'
    : axisOpt;

  const c1: { x: number; y: number } = axis === 'h'
    ? { x: s.x + dx * tension, y: s.y }
    : { x: s.x, y: s.y + dy * tension };

  const c2: { x: number; y: number } = axis === 'h'
    ? { x: t.x - dx * tension, y: t.y }
    : { x: t.x, y: t.y - dy * tension };

  const out: PathCommand[] = [
    { kind: 'M', x: s.x, y: s.y },
    { kind: 'C', c1x: c1.x, c1y: c1.y, c2x: c2.x, c2y: c2.y, x: t.x, y: t.y },
  ];
  return out;
};
