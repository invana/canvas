// ── OrthRouter ────────────────────────────────────────────────────────────────
// Orthogonal router — ensures all segments are horizontal or vertical.

import type { RouterFn, Point } from '../spec/index.js';

export interface OrthRouterArgs {
  /** Minimum padding from source/target before the first turn (default: 20). */
  padding?: number;
  /**
   * Primary routing direction:
   * - `'horizontal-first'` — exit horizontally, arrive vertically.
   * - `'vertical-first'`   — exit vertically, arrive horizontally.
   * - `'auto'` (default)   — choose the shorter L-shape.
   */
  direction?: 'horizontal-first' | 'vertical-first' | 'auto';
}

/**
 * Orthogonal router.
 * Converts the source → target path into right-angle (L-shaped or Z-shaped)
 * segments.  User-supplied vertices are treated as explicit bend points and
 * orthogonalised by snapping intermediate segments to H/V.
 *
 * @returns Intermediate waypoints (NOT including `from` and `to`).
 */
export const orthRouter: RouterFn = (from, to, vertices, rawArgs) => {
  const args = (rawArgs ?? {}) as OrthRouterArgs;
  const dir = args.direction ?? 'auto';

  if (vertices.length > 0) {
    // Orthogonalise the user-provided bend points by building a full chain
    // from → v0 → v1 → … → to and snapping each turn to H/V.
    return _orthogonaliseChain([from, ...vertices, to]).slice(1, -1);
  }

  // Auto route: single L-shape (or straight if already aligned)
  if (from.x === to.x || from.y === to.y) {
    return []; // Already straight — no bends needed
  }

  if (dir === 'horizontal-first') {
    return [{ x: to.x, y: from.y }];
  }
  if (dir === 'vertical-first') {
    return [{ x: from.x, y: to.y }];
  }

  // 'auto' — pick the direction that results in a shorter first segment
  const dx = Math.abs(to.x - from.x);
  const dy = Math.abs(to.y - from.y);
  if (dx >= dy) {
    return [{ x: to.x, y: from.y }]; // horizontal-first
  }
  return [{ x: from.x, y: to.y }]; // vertical-first
};

/**
 * Orthogonalise a chain of points by inserting corner bends.
 * Each consecutive pair is connected via an L-shape so all segments are H/V.
 */
function _orthogonaliseChain(pts: Point[]): Point[] {
  if (pts.length < 2) return pts;
  const result: Point[] = [pts[0]!];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i]!;
    const b = pts[i + 1]!;
    if (a.x !== b.x && a.y !== b.y) {
      // Insert a corner — prefer H then V
      result.push({ x: b.x, y: a.y });
    }
    result.push(b);
  }
  return result;
}
