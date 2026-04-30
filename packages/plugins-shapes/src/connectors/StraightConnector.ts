// ── StraightConnector ─────────────────────────────────────────────────────────

import { BaseConnector } from '../BaseConnector.js';
import type { BaseConnectorSpec, PathCommand, Point } from '../spec/index.js';

/**
 * A straight-line connector between two endpoints.
 *
 * @example
 * ```ts
 * shapesPlugin.addConnector('straight', {
 *   id: 'c1', from: { x: 0, y: 0 }, to: { x: 200, y: 100 },
 *   style: { stroke: '#58a6ff', strokeWidth: 2 },
 *   endArrow: { type: 'triangle', size: 10 },
 * });
 * ```
 */
export class StraightConnector extends BaseConnector<BaseConnectorSpec> {
  route(from: Point, to: Point, waypoints: Point[]): PathCommand[] {
    return [
      { cmd: 'M', x: from.x, y: from.y },
      ...waypoints.map(p => ({ cmd: 'L' as const, x: p.x, y: p.y })),
      { cmd: 'L', x: to.x,   y: to.y   },
    ];
  }
}
