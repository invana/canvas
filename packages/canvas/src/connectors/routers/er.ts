import type { IRouter, Point, Vec2 } from '../../specs';

interface ErOpts {
  /**
   * Length of the perpendicular stub off each endpoint that has a tangent
   * (set by the `boundary` anchor). Default `16` world units.
   */
  readonly stubLength?: number;
}

const DEFAULT_STUB_LENGTH = 16;

/**
 * ER (entity-relationship) router — exits each endpoint perpendicular to
 * its boundary, then routes orthogonally between the stub points.
 *
 * Reads the outward `tangent` set by the `boundary` anchor on each endpoint.
 * Each stub leg is `tangent * stubLength`. The bridge between stubs is a
 * single H-or-V segment plus one bend, picked so the bend axis alternates
 * with each stub direction (horizontal stubs → vertical bridge first).
 *
 * Falls back to a single bend (manhattan-equivalent) when neither endpoint
 * has a tangent. Waypoints are inserted between the stubs as plain
 * polyline points (no extra orthogonalisation pass).
 */
export const erRouter: IRouter = (source, target, waypoints, opts) => {
  const stubLen = (opts as ErOpts | undefined)?.stubLength ?? DEFAULT_STUB_LENGTH;

  const out: Point[] = [{ x: source.x, y: source.y }];

  let cur: Point = { x: source.x, y: source.y };
  if (source.tangent) {
    cur = offsetAlong(source, source.tangent, stubLen);
    out.push(cur);
  }

  let end: Point = { x: target.x, y: target.y };
  let preEnd: Point | null = null;
  if (target.tangent) {
    preEnd = offsetAlong(target, target.tangent, stubLen);
  }

  // Insert waypoints verbatim between the stub ends.
  if (waypoints && waypoints.length > 0) {
    for (const w of waypoints) {
      bridgeOrthogonal(out, cur, { x: w.x, y: w.y }, prevAxis(out));
      cur = { x: w.x, y: w.y };
    }
  }

  const bridgeTarget = preEnd ?? end;
  bridgeOrthogonal(out, cur, bridgeTarget, prevAxis(out));

  if (preEnd) out.push(end);

  return out;
};

function offsetAlong(p: Point, t: Vec2, dist: number): Point {
  return { x: p.x + t.x * dist, y: p.y + t.y * dist };
}

/**
 * Append a single H-then-V or V-then-H bend that connects `from` to `to`,
 * choosing H-first or V-first to alternate with the most recent leg axis.
 * Aligned points emit no bend.
 */
function bridgeOrthogonal(
  out: Point[],
  from: Point,
  to: Point,
  prevAxisDir: 'H' | 'V' | null,
): void {
  if (from.x === to.x || from.y === to.y) {
    if (from.x !== to.x || from.y !== to.y) out.push({ x: to.x, y: to.y });
    return;
  }
  // Alternate from previous axis; default to dominant axis if no history.
  const goHFirst = prevAxisDir === 'H'
    ? false
    : prevAxisDir === 'V'
      ? true
      : Math.abs(to.x - from.x) >= Math.abs(to.y - from.y);
  const bend: Point = goHFirst
    ? { x: to.x, y: from.y }
    : { x: from.x, y: to.y };
  out.push(bend);
  out.push({ x: to.x, y: to.y });
}

/** Direction of the most recently appended leg. */
function prevAxis(out: ReadonlyArray<Point>): 'H' | 'V' | null {
  if (out.length < 2) return null;
  const a = out[out.length - 2]!;
  const b = out[out.length - 1]!;
  if (a.x === b.x && a.y !== b.y) return 'V';
  if (a.y === b.y && a.x !== b.x) return 'H';
  return null;
}
