// ── OneSideRouter ─────────────────────────────────────────────────────────────

import type { RouterFn } from '../spec/index.js';

export interface OneSideRouterArgs {
  side?: 'top' | 'bottom' | 'left' | 'right';
  offset?: number;
}

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
