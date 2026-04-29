// ── ErRouter ──────────────────────────────────────────────────────────────────

import type { RouterFn } from '../spec/index.js';

export interface ErRouterArgs {
  offset?: number;
  direction?: 'H' | 'V';
}

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

  return [
    { x: from.x, y: from.y + offset },
    { x: to.x,   y: to.y   - offset },
  ];
};
