/**
 * Coarse-grid construction for obstacle-aware routing. Used internally by
 * `manhattan`, `metro`, `er`, and `oneSide` routers when `RouterCtx.obstacles`
 * is non-empty. Pure data structure — no pixi, no router, no scene access.
 */

import type { Obstacle, Point } from '../../types';

export interface ObstacleGrid {
  /** Cell count along x. */
  readonly width: number;
  /** Cell count along y. */
  readonly height: number;
  /** World-space x of cell `(0, _)` centre. */
  readonly originX: number;
  /** World-space y of cell `(_, 0)` centre. */
  readonly originY: number;
  /** Edge length of each cell in world units. */
  readonly cellSize: number;
  /** Length = `width * height`; `1` = blocked, `0` = free. */
  readonly cells: Uint8Array;
}

export interface BuildGridOpts {
  readonly source: Point;
  readonly target: Point;
  readonly obstacles: ReadonlyArray<Obstacle>;
  /** Cell edge length in world units. Default `16`. */
  readonly gridStep?: number;
  /** Padding around the bounding region of source / target / obstacles. Default `64`. */
  readonly margin?: number;
  /** Per-obstacle inflation in world units (so the path doesn't graze edges). Default `4`. */
  readonly inflate?: number;
  /** Hard cap on `width * height`. Default `40_000` (200×200). Returns `null` on overflow. */
  readonly maxCells?: number;
}

const DEFAULT_GRID_STEP = 16;
const DEFAULT_MARGIN = 64;
const DEFAULT_INFLATE = 4;
const DEFAULT_MAX_CELLS = 40_000;

/**
 * Build a grid covering the **neighbourhood of this edge** — the bounding box
 * of `source` / `target` (padded by `margin`), expanded to fully contain any
 * obstacle that intersects that box. Obstacles elsewhere in the scene are
 * ignored: a whole-graph grid would need millions of cells for a single edge
 * (blowing `maxCells`), so avoidance would never run on a large diagram. The
 * edge can only route through its own neighbourhood anyway, so bounding the
 * grid there keeps it small without losing the obstacles that actually matter.
 *
 * Each obstacle is inflated by `inflate` and any cell whose centre lies inside
 * an inflated rect is marked blocked. The cell size adapts upward (never below
 * `gridStep`) so the grid always fits `maxCells` — long spans route coarsely
 * but still avoid, rather than bailing to a straight line through nodes.
 *
 * Returns `null` only for a degenerate `gridStep <= 0`.
 */
export function buildObstacleGrid(opts: BuildGridOpts): ObstacleGrid | null {
  const requestedStep = opts.gridStep ?? DEFAULT_GRID_STEP;
  const margin = opts.margin ?? DEFAULT_MARGIN;
  const inflate = opts.inflate ?? DEFAULT_INFLATE;
  const maxCells = opts.maxCells ?? DEFAULT_MAX_CELLS;

  if (requestedStep <= 0) return null;

  // Seed region: just the source / target span + margin.
  const seedMinX = Math.min(opts.source.x, opts.target.x) - margin;
  const seedMaxX = Math.max(opts.source.x, opts.target.x) + margin;
  const seedMinY = Math.min(opts.source.y, opts.target.y) - margin;
  const seedMaxY = Math.max(opts.source.y, opts.target.y) + margin;

  // Expand to fully contain obstacles that intersect the seed region, so a
  // node straddling the boundary is marked in full. Test against the *seed*
  // bounds (not the growing region) so the result is order-independent and the
  // region stays the edge's locality rather than chaining out to the whole graph.
  let minX = seedMinX;
  let maxX = seedMaxX;
  let minY = seedMinY;
  let maxY = seedMaxY;
  for (const r of opts.obstacles) {
    const r1x = r.x + r.width;
    const r1y = r.y + r.height;
    if (r.x > seedMaxX || r1x < seedMinX || r.y > seedMaxY || r1y < seedMinY) continue;
    if (r.x < minX) minX = r.x;
    if (r.y < minY) minY = r.y;
    if (r1x > maxX) maxX = r1x;
    if (r1y > maxY) maxY = r1y;
  }

  // Adaptive cell size: coarsen so `width * height <= maxCells` instead of
  // returning null (which would fall back to a node-crossing straight line).
  const spanX = maxX - minX;
  const spanY = maxY - minY;
  const fitStep = Math.sqrt((Math.max(spanX, 1) * Math.max(spanY, 1)) / maxCells);
  const gridStep = fitStep > requestedStep ? fitStep : requestedStep;

  const width = Math.max(1, Math.ceil(spanX / gridStep));
  const height = Math.max(1, Math.ceil(spanY / gridStep));

  const cells = new Uint8Array(width * height);

  const originX = minX + gridStep / 2;
  const originY = minY + gridStep / 2;

  for (const r of opts.obstacles) {
    const ix0 = r.x - inflate;
    const iy0 = r.y - inflate;
    const ix1 = r.x + r.width + inflate;
    const iy1 = r.y + r.height + inflate;
    const cMinX = Math.max(0, Math.floor((ix0 - originX) / gridStep));
    const cMaxX = Math.min(width - 1, Math.ceil((ix1 - originX) / gridStep));
    const cMinY = Math.max(0, Math.floor((iy0 - originY) / gridStep));
    const cMaxY = Math.min(height - 1, Math.ceil((iy1 - originY) / gridStep));
    const silhouette = r.containsInflated;
    for (let cy = cMinY; cy <= cMaxY; cy++) {
      for (let cx = cMinX; cx <= cMaxX; cx++) {
        const wx = originX + cx * gridStep;
        const wy = originY + cy * gridStep;
        // Cheap AABB pre-filter — skips cells well outside the obstacle's
        // bounding box. Required because the cell range above is rounded
        // up/down by `Math.floor` / `Math.ceil`.
        if (wx < ix0 || wx > ix1 || wy < iy0 || wy > iy1) continue;
        // Silhouette test when provided — tightens the marking from the
        // bounding box to the actual shape (circle disc, polygon outline, …).
        // When absent, the inflated AABB IS the obstacle.
        if (silhouette && !silhouette(wx, wy, inflate)) continue;
        cells[cy * width + cx] = 1;
      }
    }
  }

  return { width, height, originX, originY, cellSize: gridStep, cells };
}

/** Round-to-nearest cell containing the world-space point. */
export function worldToCell(grid: ObstacleGrid, p: Point): { cx: number; cy: number } {
  return {
    cx: Math.round((p.x - grid.originX) / grid.cellSize),
    cy: Math.round((p.y - grid.originY) / grid.cellSize),
  };
}

/** World-space centre of cell `(cx, cy)`. */
export function cellToWorld(grid: ObstacleGrid, cx: number, cy: number): Point {
  return {
    x: grid.originX + cx * grid.cellSize,
    y: grid.originY + cy * grid.cellSize,
  };
}

/** True when `(cx, cy)` is inside the grid and not blocked. */
export function isFreeCell(grid: ObstacleGrid, cx: number, cy: number): boolean {
  if (cx < 0 || cy < 0 || cx >= grid.width || cy >= grid.height) return false;
  return grid.cells[cy * grid.width + cx] === 0;
}
