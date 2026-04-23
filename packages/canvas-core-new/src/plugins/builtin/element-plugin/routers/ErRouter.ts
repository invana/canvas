// ── ErRouter ─────────────────────────────────────────────────────────────────
// Entity-Relationship router — produces Z-shaped diagonal segments, commonly
// used in ER diagrams to connect entity boxes.

import type { RouterFn } from '../spec/index.js';

export interface ErRouterArgs {
  /**
   * How far from each endpoint the first/last segment extends before turning.
   * Default: 32.
   */
  offset?: number;
  /**
   * Primary routing direction:
   * - `'H'` (default) — exit/enter horizontally first.
   * - `'V'`           — exit/enter vertically first.
   */
  direction?: 'H' | 'V';
}

/**
 * Entity-Relationship router.
 * Produces a Z-shaped path: a short horizontal (or vertical) stub from each
 * endpoint with a diagonal segment connecting the stubs' midpoints.
 *
 * Example (horizontal mode):
 *   from → (from.x + offset, from.y) → (to.x - offset, to.y) → to
 *
 * @returns Intermediate waypoints (NOT including `from` and `to`).
 */
export const erRouter: RouterFn = (from, to, _vertices, rawArgs) => {
  const args = (rawArgs ?? {}) as ErRouterArgs;
  const offset    = args.offset    ?? 32;
  const direction = args.direction ?? 'H';

  if (direction === 'H') {
    return [
      { x: from.x + offset, y: from.y },
      { x: to.x   - offset, y: to.y   },
    ];
  }

  // Vertical mode
  return [
    { x: from.x, y: from.y + offset },
    { x: to.x,   y: to.y   - offset },
  ];
};
