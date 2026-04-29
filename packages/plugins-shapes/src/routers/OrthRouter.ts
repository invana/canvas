// ── OrthRouter ────────────────────────────────────────────────────────────────

import type { RouterFn, Point } from '../spec/index.js';

export interface OrthRouterArgs {
  padding?: number;
  direction?: 'horizontal-first' | 'vertical-first' | 'auto';
}

export const orthRouter: RouterFn = (from, to, vertices, rawArgs) => {
  const args = (rawArgs ?? {}) as OrthRouterArgs;
  const dir = args.direction ?? 'auto';

  if (vertices.length > 0) {
    return _orthogonaliseChain([from, ...vertices, to]).slice(1, -1);
  }

  if (from.x === to.x || from.y === to.y) {
    return [];
  }

  if (dir === 'horizontal-first') {
    return [{ x: to.x, y: from.y }];
  }
  if (dir === 'vertical-first') {
    return [{ x: from.x, y: to.y }];
  }

  const dx = Math.abs(to.x - from.x);
  const dy = Math.abs(to.y - from.y);
  if (dx >= dy) {
    return [{ x: to.x, y: from.y }];
  }
  return [{ x: from.x, y: to.y }];
};

function _orthogonaliseChain(pts: Point[]): Point[] {
  if (pts.length < 2) return pts;
  const result: Point[] = [pts[0]!];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i]!;
    const b = pts[i + 1]!;
    if (a.x !== b.x && a.y !== b.y) {
      result.push({ x: b.x, y: a.y });
    }
    result.push(b);
  }
  return result;
}
