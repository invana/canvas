import type { Endpoint, IRouter, Obstacle, Point } from '../../specs';
import { aStar, simplifyCellPath } from './_aStar';
import { buildObstacleGrid, cellToWorld, worldToCell } from './_obstacleGrid';

interface MetroOpts {
  /** Grid cell size in world units. Default `16`. */
  readonly gridStep?: number;
  /** Padding around the bounding region. Default `64`. */
  readonly margin?: number;
  /** Obstacle inflation in world units. Default `4`. */
  readonly inflate?: number;
  /** Hard cap on grid cells (width × height). Default `40_000`. */
  readonly maxCells?: number;
}

const DEFAULT_INFLATE = 4;

/**
 * Metro router — manhattan-style topology with 45° diagonals.
 *
 * Pipeline (lazy A*):
 *   1. Compute the simple geometric metro polyline first — one straight
 *      axis-aligned leg followed by a 45° diagonal absorbing the remaining
 *      distance. Mirrors classic transit-map line drawing.
 *   2. If `ctx.obstacles` is empty OR no segment of the simple polyline
 *      crosses an inflated obstacle, return it directly.
 *   3. Otherwise run A* with **connectivity 8** (H + V + 45° moves) on a
 *      coarse grid. Simplify cell runs and convert back to world coords.
 *
 * Connectivity 8 is what makes this metro-shaped: diagonal cost `√2` is
 * cheaper than two cardinals (`1 + 1 = 2`), so A* prefers 45° moves where
 * obstacles permit — producing the metro look around obstacles too.
 */
export const metroRouter: IRouter = (source, target, waypoints, opts, ctx) => {
  const simple = simpleMetroPolyline(source, target, waypoints);
  const obstacles = ctx?.obstacles ?? [];
  if (obstacles.length === 0) return simple;

  const o = opts as MetroOpts | undefined;
  const inflate = o?.inflate ?? DEFAULT_INFLATE;

  if (!polylineCrossesAnyObstacle(simple, obstacles, inflate)) {
    return simple;
  }

  const grid = buildObstacleGrid({
    source,
    target,
    obstacles,
    gridStep: o?.gridStep,
    margin: o?.margin,
    inflate: o?.inflate,
    maxCells: o?.maxCells,
  });
  if (!grid) {
    if (typeof console !== 'undefined') {
      console.warn('metroRouter: obstacle grid exceeded maxCells; falling back to simple metro.');
    }
    return simple;
  }

  const startCell = worldToCell(grid, source);
  const goalCell = worldToCell(grid, target);
  const cells = aStar(grid, startCell, goalCell, { connectivity: 8 });
  if (!cells) {
    if (typeof console !== 'undefined') {
      console.warn('metroRouter: A* found no path through obstacles; falling back to simple metro.');
    }
    return simple;
  }

  const simplified = simplifyCellPath(cells);

  const out: Point[] = [{ x: source.x, y: source.y }];
  for (let i = 1; i < simplified.length - 1; i++) {
    const c = simplified[i]!;
    out.push(cellToWorld(grid, c.cx, c.cy));
  }
  out.push({ x: target.x, y: target.y });
  return out;
};

/**
 * Simple geometric metro — between two non-aligned points, one straight
 * axis-aligned leg followed by a 45° diagonal that absorbs the remaining
 * distance. Picks "horizontal first" when `|dx| ≥ |dy|`. Aligned points
 * and zero-area `|dx| === |dy|` cases collapse to a single straight
 * segment. Waypoints get the same per-pair treatment.
 */
function simpleMetroPolyline(
  source: Endpoint,
  target: Endpoint,
  waypoints: ReadonlyArray<Point> | undefined,
): Point[] {
  const points: ReadonlyArray<Endpoint | Point> = waypoints && waypoints.length > 0
    ? [source, ...waypoints, target]
    : [source, target];

  const out: Point[] = [{ x: source.x, y: source.y }];

  for (let i = 0; i < points.length - 1; i++) {
    const P = points[i]!;
    const Q = points[i + 1]!;
    const dx = Q.x - P.x;
    const dy = Q.y - P.y;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);

    if (adx === 0 || ady === 0 || adx === ady) {
      out.push({ x: Q.x, y: Q.y });
      continue;
    }

    if (adx > ady) {
      const bend: Point = { x: P.x + Math.sign(dx) * (adx - ady), y: P.y };
      out.push(bend);
      out.push({ x: Q.x, y: Q.y });
    } else {
      const bend: Point = { x: P.x, y: P.y + Math.sign(dy) * (ady - adx) };
      out.push(bend);
      out.push({ x: Q.x, y: Q.y });
    }
  }

  return out;
}

/**
 * Returns `true` if any segment of `polyline` (H, V, or 45° diagonal)
 * crosses any inflated obstacle's bounding box plus silhouette test.
 * Conservative: diagonal segments are tested via point-sampling at the
 * obstacle's `containsInflated` (when present) or rejected on AABB-only
 * obstacles (since we can't quickly decide an arbitrary-diagonal vs
 * non-axis AABB intersection cheaper than sampling).
 */
function polylineCrossesAnyObstacle(
  polyline: ReadonlyArray<Point>,
  obstacles: ReadonlyArray<Obstacle>,
  inflate: number,
): boolean {
  for (let i = 0; i < polyline.length - 1; i++) {
    const a = polyline[i]!;
    const b = polyline[i + 1]!;
    for (const r of obstacles) {
      if (segmentCrossesObstacle(a, b, r, inflate)) return true;
    }
  }
  return false;
}

function segmentCrossesObstacle(a: Point, b: Point, r: Obstacle, inflate: number): boolean {
  const x0 = r.x - inflate;
  const y0 = r.y - inflate;
  const x1 = r.x + r.width + inflate;
  const y1 = r.y + r.height + inflate;

  // Cheap AABB pre-filter: bounding box of the segment vs. obstacle.
  const segMinX = a.x < b.x ? a.x : b.x;
  const segMaxX = a.x < b.x ? b.x : a.x;
  const segMinY = a.y < b.y ? a.y : b.y;
  const segMaxY = a.y < b.y ? b.y : a.y;
  if (segMaxX < x0 || segMinX > x1 || segMaxY < y0 || segMinY > y1) return false;

  // Axis-aligned segment + AABB-only obstacle: the pre-filter is already
  // exact (segment within the AABB strip), so return true.
  if ((a.x === b.x || a.y === b.y) && !r.containsInflated) return true;

  // Silhouette refinement / diagonal segment: sample points along the
  // segment and consult `containsInflated`. Falls back to AABB-only
  // (sample test pass = blocked) when no silhouette test is present.
  const test = r.containsInflated;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  const step = Math.max(inflate / 2, 2);
  const samples = Math.min(64, Math.max(2, Math.ceil(len / step)));
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const wx = a.x + dx * t;
    const wy = a.y + dy * t;
    if (test) {
      if (test(wx, wy, inflate)) return true;
    } else {
      // No silhouette test — fall back to AABB containment per sample.
      if (wx >= x0 && wx <= x1 && wy >= y0 && wy <= y1) return true;
    }
  }
  return false;
}
