import type { Endpoint, IRouter, Point } from '../../specs';

/**
 * Orth router — produces a polyline made of horizontal and vertical
 * segments only. Simple, geometric, **no obstacle awareness**: pick this
 * for clean H/V routing in layouts you trust to have no shapes in the way.
 * For obstacle avoidance, use `manhattan` (which is built on top of A*).
 *
 * Naming follows X6 / JointJS / mxGraph: their `Orth` is also the simple
 * H/V router, while their `Manhattan` is the obstacle-aware variant.
 *
 * For each consecutive pair `(P, Q)` of `[source, ...waypoints, target]`,
 * one bend point is inserted (producing an L-shape for that pair). The bend
 * direction (H-first vs V-first) is chosen by:
 *
 *   1. **Source tangent** on the first segment — the line exits along the
 *      tangent's dominant axis. The boundary anchor sets this as an outward
 *      normal hint.
 *   2. **Target tangent** on the last segment — the line approaches matching
 *      the tangent's dominant axis (so the final leg is perpendicular to the
 *      target boundary).
 *   3. **Alternation** in between — alternate H ↔ V across consecutive
 *      segments to avoid back-tracking.
 *   4. **Dominant axis** as a final fallback when no other signal applies.
 *
 * Aligned consecutive points (same x or same y) emit no bend.
 */
export const orthRouter: IRouter = (source, target, waypoints) => {
  const hasWaypoints = waypoints !== undefined && waypoints.length > 0;

  // Special case: no waypoints, both endpoints provide tangents that agree
  // on axis. A single L-bend can't satisfy both tangents (one leg would
  // exit along the wrong axis), so emit a Z-bend with two corners. Examples:
  //   - both horizontal tangents → out H, V at midX, in H
  //   - both vertical tangents   → out V, H at midY, in V
  if (!hasWaypoints && source.tangent && target.tangent && source.x !== target.x && source.y !== target.y) {
    const srcH = Math.abs(source.tangent.x) > Math.abs(source.tangent.y);
    const tgtH = Math.abs(target.tangent.x) > Math.abs(target.tangent.y);
    if (srcH && tgtH) {
      const midX = (source.x + target.x) / 2;
      return [
        { x: source.x, y: source.y },
        { x: midX, y: source.y },
        { x: midX, y: target.y },
        { x: target.x, y: target.y },
      ];
    }
    if (!srcH && !tgtH) {
      const midY = (source.y + target.y) / 2;
      return [
        { x: source.x, y: source.y },
        { x: source.x, y: midY },
        { x: target.x, y: midY },
        { x: target.x, y: target.y },
      ];
    }
    // Mismatched axes (one H, one V) — a single L-bend already satisfies both
    // tangents naturally, so fall through to the standard logic below.
  }

  const points: ReadonlyArray<Endpoint | Point> = hasWaypoints
    ? [source, ...waypoints, target]
    : [source, target];

  const out: Point[] = [{ x: source.x, y: source.y }];
  let prevDir: 'H' | 'V' | null = null;

  for (let i = 0; i < points.length - 1; i++) {
    const P = points[i]!;
    const Q = points[i + 1]!;
    const isFirst = i === 0;
    const isLast = i === points.length - 2;

    if (P.x === Q.x) {
      out.push({ x: Q.x, y: Q.y });
      prevDir = 'V';
      continue;
    }
    if (P.y === Q.y) {
      out.push({ x: Q.x, y: Q.y });
      prevDir = 'H';
      continue;
    }

    const goHFirst = pickHFirst({
      source: isFirst ? source : null,
      target: isLast ? target : null,
      prevDir,
      P, Q,
    });

    const bend: Point = goHFirst
      ? { x: Q.x, y: P.y }
      : { x: P.x, y: Q.y };

    out.push(bend);
    out.push({ x: Q.x, y: Q.y });
    prevDir = goHFirst ? 'V' : 'H';
  }

  return out;
};

interface PickArgs {
  readonly source: Endpoint | null;
  readonly target: Endpoint | null;
  readonly prevDir: 'H' | 'V' | null;
  readonly P: Endpoint | Point;
  readonly Q: Endpoint | Point;
}

function pickHFirst({ source, target, prevDir, P, Q }: PickArgs): boolean {
  if (source?.tangent) {
    return Math.abs(source.tangent.x) >= Math.abs(source.tangent.y);
  }
  if (target?.tangent) {
    // Last leg should align with the target's tangent axis. If target tangent
    // is vertical, last leg is V → first leg of this segment is H.
    return Math.abs(target.tangent.y) >= Math.abs(target.tangent.x);
  }
  if (prevDir === 'H') return false;
  if (prevDir === 'V') return true;
  return Math.abs(Q.x - P.x) >= Math.abs(Q.y - P.y);
}
