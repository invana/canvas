import type { IRouter, Obstacle, Point } from '../../specs';
import { orthRouter } from './orth';
import { aStar, simplifyCellPath } from './_aStar';
import {
  buildObstacleGrid,
  cellToWorld,
  worldToCell,
} from './_obstacleGrid';

interface ManhattanOpts {
  /** Grid cell size in world units. Default `16`. */
  readonly gridStep?: number;
  /** Padding around the bounding region. Default `64`. */
  readonly margin?: number;
  /** Obstacle inflation in world units. Default `4`. */
  readonly inflate?: number;
  /** Hard cap on grid cells (width × height). Default `40_000`. */
  readonly maxCells?: number;
  /**
   * Length of the perpendicular stub off each tangent-bearing endpoint when
   * A* takes over. Guarantees the line exits/enters the shape along its
   * tangent before A* bends it around obstacles — feels "natural" like ER
   * routing. Default `24` world units. Set to `0` to disable stubs (line
   * will exit/enter wherever A* decides).
   */
  readonly stubLength?: number;
}

const DEFAULT_INFLATE = 4;
const DEFAULT_STUB_LENGTH = 24;

/**
 * Manhattan router — H/V segments only, **routing around obstacles when
 * necessary**.
 *
 * Naming follows X6 / JointJS / mxGraph where `Manhattan` is the
 * obstacle-aware variant and `Orth` is the simple non-avoiding one.
 *
 * Pipeline (lazy A*):
 *   1. Compute the simple `orthRouter` polyline first (single L-bend or
 *      tangent-aware Z-bend).
 *   2. If `ctx.obstacles` is empty OR no segment of the simple polyline
 *      crosses an inflated obstacle, return it directly. Same output as the
 *      `orth` router — clean, no stair-stepping.
 *   3. Otherwise build a coarse `ObstacleGrid` and run A* (connectivity 4)
 *      from source cell to target cell. Simplify the cell path to bend
 *      points only and convert back to world coordinates.
 *
 * Failure cases all fall back to the simple `orthRouter` polyline:
 *   - Grid construction returns `null` (cell-count cap exceeded).
 *   - A* finds no path (source/target unreachable through inflated obstacles).
 *
 * The fallback emits a `console.warn` so the dev sees why avoidance didn't
 * kick in; toggle `routerOpts.obstacles: 'none'` to skip the obstacle check
 * entirely.
 *
 * Waypoints are not yet threaded through A* — when present, the simple orth
 * polyline (which respects waypoints) is checked against obstacles. If it's
 * clear, return it; if not, A* runs between source and target only.
 * Routing through waypoints with obstacle awareness is a future extension.
 */
export const manhattanRouter: IRouter = (source, target, waypoints, opts, ctx) => {
  const obstacles = ctx?.obstacles ?? [];
  const simple = orthRouter(source, target, waypoints, opts, ctx);

  if (obstacles.length === 0) return simple;

  const o = opts as ManhattanOpts | undefined;
  const inflate = o?.inflate ?? DEFAULT_INFLATE;

  if (!polylineCrossesObstacles(simple, obstacles, inflate)) {
    return simple;
  }

  const stubLength = o?.stubLength ?? DEFAULT_STUB_LENGTH;

  // Stub endpoints: when an endpoint provides a tangent (from the
  // perpendicular / boundary anchor), project the actual A* start/goal one
  // `stubLength` away along the tangent. This guarantees the visible line
  // exits the source / enters the target along the tangent direction — A*
  // never sees the literal endpoints, so it can't accidentally pick a
  // first/last move along the "wrong" axis.
  const sourceStub: Point = source.tangent && stubLength > 0
    ? { x: source.x + source.tangent.x * stubLength, y: source.y + source.tangent.y * stubLength }
    : { x: source.x, y: source.y };
  const targetStub: Point = target.tangent && stubLength > 0
    ? { x: target.x + target.tangent.x * stubLength, y: target.y + target.tangent.y * stubLength }
    : { x: target.x, y: target.y };

  const grid = buildObstacleGrid({
    source: sourceStub,
    target: targetStub,
    obstacles,
    gridStep: o?.gridStep,
    margin: o?.margin,
    inflate: o?.inflate,
    maxCells: o?.maxCells,
  });
  if (!grid) {
    if (typeof console !== 'undefined') {
      console.warn('manhattanRouter: obstacle grid exceeded maxCells; falling back to orth.');
    }
    return simple;
  }

  const startCell = worldToCell(grid, sourceStub);
  const goalCell = worldToCell(grid, targetStub);
  const cells = aStar(grid, startCell, goalCell, { connectivity: 4 });
  if (!cells) {
    if (typeof console !== 'undefined') {
      console.warn('manhattanRouter: A* found no path through obstacles; falling back to orth.');
    }
    return simple;
  }

  const simplified = simplifyCellPath(cells);

  // A* cell path between the stub points → world points.
  const middle: Point[] = [{ x: sourceStub.x, y: sourceStub.y }];
  for (let i = 1; i < simplified.length - 1; i++) {
    const c = simplified[i]!;
    middle.push(cellToWorld(grid, c.cx, c.cy));
  }
  middle.push({ x: targetStub.x, y: targetStub.y });

  // Greedy L-bend simplification ONLY across the stub-to-stub portion. The
  // source/target stub legs are preserved as the perpendicular exit/entry.
  const simplifiedMiddle = simplifyOrthPolylineAroundObstacles(middle, obstacles, inflate);

  // Prepend the literal source / append the literal target. The stub legs
  // (source → sourceStub and targetStub → target) emerge automatically
  // because `simplifiedMiddle` starts at `sourceStub` and ends at
  // `targetStub`. When an endpoint has no tangent, its stub equals the
  // endpoint itself; the dedup below collapses the zero-length segment.
  const out: Point[] = [{ x: source.x, y: source.y }];
  for (const p of simplifiedMiddle) {
    const last = out[out.length - 1]!;
    if (p.x === last.x && p.y === last.y) continue;
    out.push(p);
  }
  const tEnd = { x: target.x, y: target.y };
  const lastOut = out[out.length - 1]!;
  if (lastOut.x !== tEnd.x || lastOut.y !== tEnd.y) out.push(tEnd);
  return out;
};

/**
 * Returns `true` if any axis-aligned segment of `polyline` crosses any
 * inflated `obstacle` rect. Designed for orth output (H/V segments only);
 * diagonal segments fall through as non-crossing.
 */
function polylineCrossesObstacles(
  polyline: ReadonlyArray<Point>,
  obstacles: ReadonlyArray<Obstacle>,
  inflate: number,
): boolean {
  for (let i = 0; i < polyline.length - 1; i++) {
    const a = polyline[i]!;
    const b = polyline[i + 1]!;
    for (const r of obstacles) {
      if (segmentCrossesRect(a, b, r, inflate)) return true;
    }
  }
  return false;
}

function segmentCrossesRect(a: Point, b: Point, r: Obstacle, inflate: number): boolean {
  const x0 = r.x - inflate;
  const y0 = r.y - inflate;
  const x1 = r.x + r.width + inflate;
  const y1 = r.y + r.height + inflate;

  // AABB pre-filter: if the segment misses the inflated bounding box, no
  // need to consult the silhouette.
  if (a.y === b.y) {
    if (a.y < y0 || a.y > y1) return false;
    const segMinX = a.x < b.x ? a.x : b.x;
    const segMaxX = a.x < b.x ? b.x : a.x;
    if (segMaxX < x0 || segMinX > x1) return false;
    // Inside AABB — silhouette refinement for non-rect obstacles.
    return segmentHitsSilhouette(a, b, r, inflate);
  }
  if (a.x === b.x) {
    if (a.x < x0 || a.x > x1) return false;
    const segMinY = a.y < b.y ? a.y : b.y;
    const segMaxY = a.y < b.y ? b.y : a.y;
    if (segMaxY < y0 || segMinY > y1) return false;
    return segmentHitsSilhouette(a, b, r, inflate);
  }
  // Diagonal segments (shouldn't appear in orth output) — be permissive
  // and let A* take over by reporting "blocked".
  return true;
}

/**
 * Walks an axis-aligned segment that already passed the AABB pre-filter and
 * tests sample points against the obstacle's `containsInflated` silhouette.
 * When the obstacle has no silhouette, the segment is considered blocked
 * (AABB IS the obstacle). Sample density is `~inflate / 2`, capped to a
 * reasonable max.
 */
function segmentHitsSilhouette(
  a: Point,
  b: Point,
  obstacle: Obstacle,
  inflate: number,
): boolean {
  const test = obstacle.containsInflated;
  if (!test) return true;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.abs(dx) + Math.abs(dy); // axis-aligned, so Manhattan = Euclidean
  const step = Math.max(inflate / 2, 2);
  const samples = Math.min(64, Math.max(2, Math.ceil(len / step)));
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const wx = a.x + dx * t;
    const wy = a.y + dy * t;
    if (test(wx, wy, inflate)) return true;
  }
  return false;
}

/**
 * Greedy L-bend reduction of an orthogonal polyline. Walks the points
 * forward; at each step looks as far ahead as possible while the connection
 * from the current point to that look-ahead point can still be made with
 * **at most one bend** that doesn't cross any obstacle. Replaces the
 * skipped intermediate points with that single bend (or no bend, when the
 * two points are already axis-aligned).
 *
 * The result preserves both endpoints exactly and stays obstacle-free; it
 * reduces a stair-stepped A* output to the minimum-bend orthogonal path
 * around the obstacle. Worst case is O(n²) in polyline length but n is
 * typically the bend count (≤ 10 for sensible diagrams), so this is cheap.
 */
function simplifyOrthPolylineAroundObstacles(
  points: ReadonlyArray<Point>,
  obstacles: ReadonlyArray<Obstacle>,
  inflate: number,
): Point[] {
  if (points.length <= 2) return points.slice();

  const out: Point[] = [points[0]!];
  let i = 0;

  while (i < points.length - 1) {
    let bestJ = i + 1;
    let bestBend: Point | null = null;

    for (let j = i + 2; j < points.length; j++) {
      const conn = findClearOrthConnection(points[i]!, points[j]!, obstacles, inflate);
      if (conn === undefined) break;
      bestJ = j;
      bestBend = conn;
    }

    if (bestBend !== null) {
      const last = out[out.length - 1]!;
      if (bestBend.x !== last.x || bestBend.y !== last.y) out.push(bestBend);
    }
    out.push(points[bestJ]!);
    i = bestJ;
  }

  return out;
}

/**
 * Returns:
 *   - `null`      — `a` and `b` are axis-aligned and the straight segment is clear (no bend needed)
 *   - `Point`     — a clear L-bend (the bend point) connects `a` and `b`
 *   - `undefined` — neither a straight nor an L-bend can connect `a` and `b` without crossing an obstacle
 */
function findClearOrthConnection(
  a: Point,
  b: Point,
  obstacles: ReadonlyArray<Obstacle>,
  inflate: number,
): Point | null | undefined {
  if (a.x === b.x || a.y === b.y) {
    return segmentCrosses(a, b, obstacles, inflate) ? undefined : null;
  }
  const bendH: Point = { x: b.x, y: a.y };
  const hClear =
    !segmentCrosses(a, bendH, obstacles, inflate) &&
    !segmentCrosses(bendH, b, obstacles, inflate);
  if (hClear) return bendH;

  const bendV: Point = { x: a.x, y: b.y };
  const vClear =
    !segmentCrosses(a, bendV, obstacles, inflate) &&
    !segmentCrosses(bendV, b, obstacles, inflate);
  if (vClear) return bendV;

  return undefined;
}

function segmentCrosses(
  a: Point,
  b: Point,
  obstacles: ReadonlyArray<Obstacle>,
  inflate: number,
): boolean {
  for (const r of obstacles) {
    if (segmentCrossesRect(a, b, r, inflate)) return true;
  }
  return false;
}
