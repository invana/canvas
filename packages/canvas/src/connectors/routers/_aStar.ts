/**
 * A* search on an `ObstacleGrid` plus path simplification. Used internally
 * by obstacle-aware routers (`manhattan`, `metro`, `er`, `oneSide`).
 *
 * The search works in cell coordinates; converting back to world points is
 * the caller's job (`cellToWorld` from `_obstacleGrid`).
 */

import type { ObstacleGrid } from './_obstacleGrid';
import { isFreeCell } from './_obstacleGrid';

export interface Cell {
  readonly cx: number;
  readonly cy: number;
}

export type Connectivity = 4 | 8;

interface AStarOpts {
  readonly connectivity: Connectivity;
}

const SQRT2 = Math.SQRT2;

const DIRS_4: ReadonlyArray<readonly [number, number, number]> = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
];

const DIRS_8: ReadonlyArray<readonly [number, number, number]> = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, SQRT2],
  [1, -1, SQRT2],
  [-1, 1, SQRT2],
  [-1, -1, SQRT2],
];

/**
 * A* from `start` to `goal` on `grid`. Returns the cell path (inclusive of
 * start and goal) or `null` if unreachable.
 *
 * Connectivity:
 * - `4` — H/V neighbours only. Manhattan-distance heuristic.
 * - `8` — H/V/diagonal neighbours. Octile-distance heuristic. Diagonal cost
 *   is `√2`. Diagonal moves through a corner where one of the two flanking
 *   cells is blocked are forbidden ("no corner cutting").
 *
 * Blocked start/goal cells are snapped to the nearest free cell within an
 * 8-cell radius — useful when the literal endpoint sits inside an inflated
 * obstacle (commonly the source/target shape itself, when the renderer
 * forgot to exclude it). Returns `null` if no free cell is found.
 */
export function aStar(
  grid: ObstacleGrid,
  start: Cell,
  goal: Cell,
  opts: AStarOpts,
): Cell[] | null {
  const startSnapped = snapToFree(grid, start);
  const goalSnapped = snapToFree(grid, goal);
  if (!startSnapped || !goalSnapped) return null;

  const w = grid.width;
  const startIdx = startSnapped.cy * w + startSnapped.cx;
  const goalIdx = goalSnapped.cy * w + goalSnapped.cx;
  if (startIdx === goalIdx) return [startSnapped];

  const dirs = opts.connectivity === 4 ? DIRS_4 : DIRS_8;
  const heuristic = opts.connectivity === 4 ? manhattanH : octileH;

  const gScore = new Map<number, number>();
  const cameFrom = new Map<number, number>();
  const closed = new Set<number>();
  gScore.set(startIdx, 0);

  const open = new MinHeap();
  open.push(startIdx, heuristic(startSnapped, goalSnapped));

  while (open.size > 0) {
    const cur = open.pop()!;
    if (closed.has(cur)) continue;
    closed.add(cur);

    if (cur === goalIdx) return reconstruct(cameFrom, cur, w);

    const cx = cur % w;
    const cy = Math.floor(cur / w);
    const curG = gScore.get(cur)!;

    for (const [dx, dy, cost] of dirs) {
      const ncx = cx + dx;
      const ncy = cy + dy;
      if (!isFreeCell(grid, ncx, ncy)) continue;
      // No-corner-cutting on diagonal moves.
      if (dx !== 0 && dy !== 0) {
        if (!isFreeCell(grid, cx + dx, cy)) continue;
        if (!isFreeCell(grid, cx, cy + dy)) continue;
      }
      const nIdx = ncy * w + ncx;
      if (closed.has(nIdx)) continue;
      const tentativeG = curG + cost;
      const prevG = gScore.get(nIdx) ?? Infinity;
      if (tentativeG < prevG) {
        gScore.set(nIdx, tentativeG);
        cameFrom.set(nIdx, cur);
        const f = tentativeG + heuristic({ cx: ncx, cy: ncy }, goalSnapped);
        open.push(nIdx, f);
      }
    }
  }
  return null;
}

/**
 * Drop interior cells whose direction-in equals direction-out — the result
 * is a polyline of bend points only. Works for both 4- and 8-connectivity
 * (the direction signature is `(dx, dy)` so diagonal runs collapse the
 * same way as cardinal ones).
 */
export function simplifyCellPath(cells: ReadonlyArray<Cell>): Cell[] {
  if (cells.length <= 2) return cells.slice();
  const out: Cell[] = [cells[0]!];
  for (let i = 1; i < cells.length - 1; i++) {
    const prev = cells[i - 1]!;
    const cur = cells[i]!;
    const next = cells[i + 1]!;
    const dx1 = sign(cur.cx - prev.cx);
    const dy1 = sign(cur.cy - prev.cy);
    const dx2 = sign(next.cx - cur.cx);
    const dy2 = sign(next.cy - cur.cy);
    if (dx1 !== dx2 || dy1 !== dy2) out.push(cur);
  }
  out.push(cells[cells.length - 1]!);
  return out;
}

function sign(n: number): number {
  return n > 0 ? 1 : n < 0 ? -1 : 0;
}

function manhattanH(a: Cell, b: Cell): number {
  return Math.abs(a.cx - b.cx) + Math.abs(a.cy - b.cy);
}

function octileH(a: Cell, b: Cell): number {
  const dx = Math.abs(a.cx - b.cx);
  const dy = Math.abs(a.cy - b.cy);
  return dx + dy + (SQRT2 - 2) * Math.min(dx, dy);
}

function snapToFree(grid: ObstacleGrid, c: Cell): Cell | null {
  if (isFreeCell(grid, c.cx, c.cy)) return c;
  for (let r = 1; r <= 8; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
        if (isFreeCell(grid, c.cx + dx, c.cy + dy)) {
          return { cx: c.cx + dx, cy: c.cy + dy };
        }
      }
    }
  }
  return null;
}

function reconstruct(cameFrom: Map<number, number>, end: number, w: number): Cell[] {
  const out: Cell[] = [];
  let cur: number | undefined = end;
  while (cur !== undefined) {
    out.push({ cx: cur % w, cy: Math.floor(cur / w) });
    cur = cameFrom.get(cur);
  }
  return out.reverse();
}

/**
 * Minimal binary min-heap. Two parallel arrays — priorities and values —
 * keyed by the same index. Stable ordering is not required; A* tolerates
 * stale entries via the `closed` set in the search loop.
 */
class MinHeap {
  private p: number[] = [];
  private v: number[] = [];

  get size(): number {
    return this.p.length;
  }

  push(value: number, priority: number): void {
    this.p.push(priority);
    this.v.push(value);
    this.bubbleUp(this.p.length - 1);
  }

  pop(): number | undefined {
    if (this.p.length === 0) return undefined;
    const top = this.v[0]!;
    const lastP = this.p.pop()!;
    const lastV = this.v.pop()!;
    if (this.p.length > 0) {
      this.p[0] = lastP;
      this.v[0] = lastV;
      this.bubbleDown(0);
    }
    return top;
  }

  private bubbleUp(i: number): void {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.p[i]! < this.p[parent]!) {
        this.swap(i, parent);
        i = parent;
      } else break;
    }
  }

  private bubbleDown(i: number): void {
    const n = this.p.length;
    while (true) {
      const left = i * 2 + 1;
      const right = i * 2 + 2;
      let smallest = i;
      if (left < n && this.p[left]! < this.p[smallest]!) smallest = left;
      if (right < n && this.p[right]! < this.p[smallest]!) smallest = right;
      if (smallest === i) break;
      this.swap(i, smallest);
      i = smallest;
    }
  }

  private swap(a: number, b: number): void {
    const pa = this.p[a]!;
    const va = this.v[a]!;
    this.p[a] = this.p[b]!;
    this.v[a] = this.v[b]!;
    this.p[b] = pa;
    this.v[b] = va;
  }
}
