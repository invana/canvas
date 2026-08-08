import type { IPathStyle, PathCommand, Point } from '../../specs';

interface SmoothOpts {
  /**
   * Catmull-Rom tension. `1` is the standard uniform spline (visually
   * smooth, slightly loose at sharp turns); higher values tighten the
   * curve toward the polyline; `0` collapses to straight segments. Default
   * `1`.
   */
  readonly tension?: number;
}

const DEFAULT_TENSION = 1;

/**
 * Catmull-Rom spline through every polyline point, emitted as cubic Béziers.
 * The curve passes through every input point exactly; intermediate router
 * waypoints / manhattan corners become smoothly interpolated bends.
 *
 * For each segment `Pi → Pi+1`, the control points use Catmull-Rom to Bézier
 * conversion:
 *   `c1 = Pi + (Pi+1 - Pi-1) * tension / 6`
 *   `c2 = Pi+1 - (Pi+2 - Pi) * tension / 6`
 *
 * At the endpoints, the missing virtual neighbour is mirrored
 * (`P-1 = P0`, `Pn+1 = Pn`).
 *
 * For a 2-point polyline this produces a single cubic with collinear control
 * points — visually identical to a straight line.
 */
export const smoothPathStyle: IPathStyle = (polyline, opts) => {
  const n = polyline.length;
  if (n < 2) return [];

  const tension = (opts as SmoothOpts | undefined)?.tension ?? DEFAULT_TENSION;
  const k = tension / 6;

  const out: PathCommand[] = [{ kind: 'M', x: polyline[0]!.x, y: polyline[0]!.y }];

  for (let i = 0; i < n - 1; i++) {
    const p0 = polyline[i - 1] ?? polyline[i]!;
    const p1 = polyline[i]!;
    const p2 = polyline[i + 1]!;
    const p3 = polyline[i + 2] ?? p2;

    const c1: Point = { x: p1.x + (p2.x - p0.x) * k, y: p1.y + (p2.y - p0.y) * k };
    const c2: Point = { x: p2.x - (p3.x - p1.x) * k, y: p2.y - (p3.y - p1.y) * k };

    out.push({ kind: 'C', c1x: c1.x, c1y: c1.y, c2x: c2.x, c2y: c2.y, x: p2.x, y: p2.y });
  }

  return out;
};
