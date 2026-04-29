// ── StraightConnector ─────────────────────────────────────────────────────────

import { BaseEdge } from '../BaseEdge.js';
import type { BaseEdgeSpec, PathCommand, Point } from '../spec/index.js';

/**
 * A straight-line connector between two endpoints.
 *
 * @example
 * ```ts
 * elementPlugin.addConnector('straight', {
 *   id: 'e1', from: { x: 0, y: 0 }, to: { x: 200, y: 100 },
 *   style: { stroke: '#58a6ff', strokeWidth: 2 },
 *   endArrow: { type: 'triangle', size: 10 },
 * });
 * ```
 */
export class StraightConnector extends BaseEdge<BaseEdgeSpec> {
  route(from: Point, to: Point): PathCommand[] {
    return [
      { cmd: 'M', x: from.x, y: from.y },
      { cmd: 'L', x: to.x,   y: to.y   },
    ];
  }
}
