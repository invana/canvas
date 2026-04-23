// ── OneSideRouter ─────────────────────────────────────────────────────────────
// Constrained orthogonal router — forces the path to exit the source node from
// exactly one side, producing a 3-segment U-shape or S-shape.

import type { RouterFn } from '../spec/index.js';

export interface OneSideRouterArgs {
  /**
   * Which side of the source node to exit from.
   * Defaults to `'bottom'` when not specified.
   */
  side?: 'top' | 'bottom' | 'left' | 'right';
  /**
   * How far from the source to place the first bend (default: 30).
   */
  offset?: number;
}

/**
 * OneSide router.
 * Forces the connector to exit the source from a single constrained side.
 * Produces exactly 3 orthogonal segments: exit → cross → approach.
 *
 * @returns Intermediate waypoints (NOT including `from` and `to`).
 */
export const oneSideRouter: RouterFn = (from, to, _vertices, rawArgs) => {
  const args = (rawArgs ?? {}) as OneSideRouterArgs;
  const side   = args.side   ?? 'bottom';
  const offset = args.offset ?? 30;

  switch (side) {
    case 'bottom': {
      const midY = Math.max(from.y + offset, (from.y + to.y) / 2);
      return [
        { x: from.x, y: midY },
        { x: to.x,   y: midY },
      ];
    }
    case 'top': {
      const midY = Math.min(from.y - offset, (from.y + to.y) / 2);
      return [
        { x: from.x, y: midY },
        { x: to.x,   y: midY },
      ];
    }
    case 'right': {
      const midX = Math.max(from.x + offset, (from.x + to.x) / 2);
      return [
        { x: midX, y: from.y },
        { x: midX, y: to.y   },
      ];
    }
    case 'left': {
      const midX = Math.min(from.x - offset, (from.x + to.x) / 2);
      return [
        { x: midX, y: from.y },
        { x: midX, y: to.y   },
      ];
    }
  }
};
