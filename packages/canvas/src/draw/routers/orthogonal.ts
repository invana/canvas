/**
 * `orthogonal` router — Manhattan-style L / Z routing in 3 segments.
 *
 * Picks horizontal-first vs vertical-first based on the larger axis-distance,
 * with the elbow placed at the midpoint of the dominant axis. Produces a
 * 4-point polyline:
 *
 *     a → (mid, a.y) → (mid, b.y) → b      (horizontal-first)
 *     a → (a.x, mid) → (b.x, mid) → b      (vertical-first)
 *
 * Endpoints already on a common axis collapse to the straight 2-point case.
 */

import type { Router } from '../types';

export const orthogonalRouter: Router = (a, b) => {
  const dx = Math.abs(b.x - a.x);
  const dy = Math.abs(b.y - a.y);

  if (dx === 0 || dy === 0) {
    return [
      { x: a.x, y: a.y },
      { x: b.x, y: b.y },
    ];
  }

  if (dx >= dy) {
    const midX = (a.x + b.x) / 2;
    return [
      { x: a.x, y: a.y },
      { x: midX, y: a.y },
      { x: midX, y: b.y },
      { x: b.x, y: b.y },
    ];
  }
  const midY = (a.y + b.y) / 2;
  return [
    { x: a.x, y: a.y },
    { x: a.x, y: midY },
    { x: b.x, y: midY },
    { x: b.x, y: b.y },
  ];
};
