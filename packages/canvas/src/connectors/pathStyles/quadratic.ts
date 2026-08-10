import type { IPathStyle, PathCommand } from '@invana/canvas-store';

interface QuadraticOpts {
  /**
   * Perpendicular offset of the control point from the source→target chord,
   * in world units. Positive values bow the curve to the **right** of the
   * chord direction (in screen-y-down coordinates: rotating the chord 90°
   * CW); negative values bow it to the left. Default `30`.
   *
   * Choose the sign to give every edge in a radial / hub-and-spoke layout
   * a consistent rotational bias — a positive offset on every spoke makes
   * the bundle read as a coherent swirl rather than a noisy spray.
   */
  readonly curveOffset?: number;
  /**
   * Where along the chord the control point's foot sits, as a fraction
   * `0..1` (`0` = source, `1` = target). The perpendicular offset is
   * applied from this foot. Default `0.5` (chord midpoint), which
   * produces a symmetric arc.
   */
  readonly curvePosition?: number;
}

const DEFAULT_OFFSET = 30;
const DEFAULT_POSITION = 0.5;

/**
 * Quadratic Bézier from the first polyline point to the last with a single
 * control point placed **perpendicular to the chord** at `curvePosition`
 * along it and `curveOffset` units to the side.
 *
 * This is the G6-style "quadratic edge": one control point, signed
 * perpendicular offset, fixed position along the chord. Unlike axis-aligned
 * `bezier` (whose control handles pull along `axis: 'h' | 'v'`), the
 * perpendicular construction gives a real bow on **every** orientation —
 * cardinal chords no longer collapse to straight lines.
 *
 * Pair with `router: 'straight'`; intermediate polyline waypoints are
 * ignored (a router that produces extra points doesn't compose
 * meaningfully with a single-control-point quadratic).
 *
 * Edge cases:
 *  - Polyline shorter than two points → `[]` (matches the other pathStyles).
 *  - Coincident endpoints (`len === 0`) → degenerate `M` only; the
 *    perpendicular is undefined.
 */
export const quadraticPathStyle: IPathStyle = (polyline, opts) => {
  if (polyline.length < 2) return [];

  const o = opts as QuadraticOpts | undefined;
  const offset = o?.curveOffset ?? DEFAULT_OFFSET;
  const position = o?.curvePosition ?? DEFAULT_POSITION;

  const s = polyline[0]!;
  const t = polyline[polyline.length - 1]!;
  const dx = t.x - s.x;
  const dy = t.y - s.y;
  const len = Math.hypot(dx, dy);

  if (len === 0) {
    return [{ kind: 'M', x: s.x, y: s.y }];
  }

  // Anchor point along the chord at `position` (0 = source, 1 = target).
  const ax = s.x + dx * position;
  const ay = s.y + dy * position;

  // Unit perpendicular to the chord. In screen-y-down coords this rotates
  // the chord direction 90° clockwise so positive `offset` bows the curve
  // to the visual right of the chord direction (source → target).
  const px = dy / len;
  const py = -dx / len;

  const cx = ax + px * offset;
  const cy = ay + py * offset;

  const out: PathCommand[] = [
    { kind: 'M', x: s.x, y: s.y },
    { kind: 'Q', cx, cy, x: t.x, y: t.y },
  ];
  return out;
};
