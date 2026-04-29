// ── OrthogonalConnector ───────────────────────────────────────────────────────

import { BaseConnector } from '../BaseConnector.js';
import type { BaseConnectorSpec, PathCommand, Point } from '../spec/index.js';

export type OrthogonalRouteDirection = 'horizontal-first' | 'vertical-first' | 'auto';

/** Spec for an orthogonal (right-angle) connector. */
export interface OrthogonalConnectorSpec extends BaseConnectorSpec {
  direction?: OrthogonalRouteDirection;
}

/**
 * An orthogonal (right-angle) connector.
 */
export class OrthogonalConnector extends BaseConnector<OrthogonalConnectorSpec> {
  route(from: Point, to: Point, waypoints: Point[]): PathCommand[] {
    const cmds: PathCommand[] = [{ cmd: 'M', x: from.x, y: from.y }];

    if (waypoints.length > 0) {
      for (const wp of waypoints) {
        cmds.push({ cmd: 'L', x: wp.x, y: wp.y });
      }
      cmds.push({ cmd: 'L', x: to.x, y: to.y });
      return cmds;
    }

    const dir = this.spec.direction ?? 'auto';

    if (dir === 'horizontal-first') {
      cmds.push({ cmd: 'L', x: to.x,   y: from.y });
      cmds.push({ cmd: 'L', x: to.x,   y: to.y   });
    } else if (dir === 'vertical-first') {
      cmds.push({ cmd: 'L', x: from.x, y: to.y   });
      cmds.push({ cmd: 'L', x: to.x,   y: to.y   });
    } else {
      const dx = Math.abs(to.x - from.x), dy = Math.abs(to.y - from.y);
      if (dx >= dy) {
        cmds.push({ cmd: 'L', x: to.x,   y: from.y });
        cmds.push({ cmd: 'L', x: to.x,   y: to.y   });
      } else {
        cmds.push({ cmd: 'L', x: from.x, y: to.y   });
        cmds.push({ cmd: 'L', x: to.x,   y: to.y   });
      }
    }

    return cmds;
  }
}
