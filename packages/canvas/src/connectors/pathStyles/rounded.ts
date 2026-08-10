import type { IPathStyle, PathCommand, Point } from '@invana/canvas-store';

interface RoundedOpts {
  /** Corner fillet radius in world units. Default `8`. Auto-clamped per corner. */
  readonly radius?: number;
}

const DEFAULT_RADIUS = 8;

/**
 * Quadratic arc fillets at every interior polyline corner.
 *
 * For each interior corner B between segments A→B and B→C:
 *   - Pick a per-corner radius `t = min(radius, |AB|/2, |BC|/2)`.
 *   - Approach point P1 on segment AB at distance `t` from B.
 *   - Departure point P2 on segment BC at distance `t` from B.
 *   - Emit `L P1`, then `Q B P2` — the corner becomes a quadratic with control
 *     at the original corner.
 *
 * For a 2-point polyline (no interior corners) the output is identical to
 * `normal`: `[M, L]`. Collinear corners (parallel incoming/outgoing) emit a
 * straight `L` through B with no Q (degenerate fillet).
 */
export const roundedPathStyle: IPathStyle = (polyline, opts) => {
  if (polyline.length < 2) return [];
  const radius = (opts as RoundedOpts | undefined)?.radius ?? DEFAULT_RADIUS;

  const out: PathCommand[] = [{ kind: 'M', x: polyline[0]!.x, y: polyline[0]!.y }];

  if (polyline.length === 2) {
    out.push({ kind: 'L', x: polyline[1]!.x, y: polyline[1]!.y });
    return out;
  }

  for (let i = 1; i < polyline.length - 1; i++) {
    const a = polyline[i - 1]!;
    const b = polyline[i]!;
    const c = polyline[i + 1]!;

    const ab = sub(b, a);
    const bc = sub(c, b);
    const lenAB = len(ab);
    const lenBC = len(bc);
    if (lenAB === 0 || lenBC === 0) {
      out.push({ kind: 'L', x: b.x, y: b.y });
      continue;
    }

    // Cap the fillet so adjacent corners can't overlap on short segments.
    const t = Math.min(radius, lenAB / 2, lenBC / 2);
    if (t <= 0) {
      out.push({ kind: 'L', x: b.x, y: b.y });
      continue;
    }

    const p1 = { x: b.x - (ab.x / lenAB) * t, y: b.y - (ab.y / lenAB) * t };
    const p2 = { x: b.x + (bc.x / lenBC) * t, y: b.y + (bc.y / lenBC) * t };

    out.push({ kind: 'L', x: p1.x, y: p1.y });
    out.push({ kind: 'Q', cx: b.x, cy: b.y, x: p2.x, y: p2.y });
  }

  const last = polyline[polyline.length - 1]!;
  out.push({ kind: 'L', x: last.x, y: last.y });
  return out;
};

function sub(a: Point, b: Point): Point {
  return { x: a.x - b.x, y: a.y - b.y };
}

function len(v: Point): number {
  return Math.hypot(v.x, v.y);
}
