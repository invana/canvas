// ── OrthogonalConnector ───────────────────────────────────────────────────────
// Right-angle (axis-aligned) connector that routes through bend points.

import { BaseEdge } from '../BaseEdge.js';
import type { BaseEdgeSpec, PathCommand, Point } from '../spec/index.js';

export type OrthogonalRouteDirection = 'horizontal-first' | 'vertical-first' | 'auto';

/** Spec for an orthogonal (right-angle) connector. */
export interface OrthogonalConnectorSpec extends BaseEdgeSpec {
  /**
   * Primary routing direction:
   * - `'horizontal-first'` — exit source horizontally, approach target vertically.
   * - `'vertical-first'`   — exit source vertically, approach target horizontally.
   * - `'auto'` (default)   — choose shorter route automatically.
   */
  direction?: OrthogonalRouteDirection;
}

/**
 * An orthogonal (right-angle) connector.
 *
 * @remarks
 * When `waypoints` are provided they act as explicit intermediate bend points.
 * When empty, bend points are auto-computed based on `direction`.
 *
 * Each segment is strictly horizontal or vertical — no diagonal lines.
 */
export class OrthogonalConnector extends BaseEdge<OrthogonalConnectorSpec> {
  route(from: Point, to: Point, waypoints: Point[]): PathCommand[] {
    const cmds: PathCommand[] = [{ cmd: 'M', x: from.x, y: from.y }];

    if (waypoints.length > 0) {
      // User-defined bend points
      for (const wp of waypoints) {
        cmds.push({ cmd: 'L', x: wp.x, y: wp.y });
      }
      cmds.push({ cmd: 'L', x: to.x, y: to.y });
      return cmds;
    }

    // Auto route
    const dir = this.spec.direction ?? 'auto';

    if (dir === 'horizontal-first') {
      cmds.push({ cmd: 'L', x: to.x,   y: from.y });
      cmds.push({ cmd: 'L', x: to.x,   y: to.y   });
    } else if (dir === 'vertical-first') {
      cmds.push({ cmd: 'L', x: from.x, y: to.y   });
      cmds.push({ cmd: 'L', x: to.x,   y: to.y   });
    } else {
      // 'auto' — choose horizontal-first for wide connections, vertical-first for tall
      const dx = Math.abs(to.x - from.x), dy = Math.abs(to.y - from.y);
      if (dx >= dy) {
        // horizontal-first (L-shape: across then down)
        cmds.push({ cmd: 'L', x: to.x,   y: from.y });
        cmds.push({ cmd: 'L', x: to.x,   y: to.y   });
      } else {
        // vertical-first (L-shape: down then across)
        cmds.push({ cmd: 'L', x: from.x, y: to.y   });
        cmds.push({ cmd: 'L', x: to.x,   y: to.y   });
      }
    }

    return cmds;
  }
}
