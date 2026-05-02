// ── RoundedConnector ─────────────────────────────────────────────────────────

import { BaseConnector } from '../BaseConnector.js';
import type { BaseConnectorSpec, PathCommand, Point } from '../spec/index.js';

/** Spec for a rounded orthogonal connector. */
export interface RoundedConnectorSpec extends BaseConnectorSpec {
  radius?: number;
}

/**
 * Rounded connector — orthogonal segments with circular arc corners.
 */
export class RoundedConnector extends BaseConnector<RoundedConnectorSpec> {
  route(from: Point, to: Point, waypoints: Point[]): PathCommand[] {
    const r = this.spec.radius ?? 8;
    const pts: Point[] = [from, ...waypoints, to];

    if (pts.length < 3) {
      return [
        { cmd: 'M', x: from.x, y: from.y },
        { cmd: 'L', x: to.x,   y: to.y   },
      ];
    }

    const cmds: PathCommand[] = [];

    for (let i = 0; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i]!;
      const next = pts[i + 1];

      if (i === 0) {
        if (next) {
          const clamp = _clampRadius(curr, next, r);
          const startPt = _lerp(curr, next, clamp / _dist(curr, next));
          cmds.push({ cmd: 'M', x: startPt.x, y: startPt.y });
        } else {
          cmds.push({ cmd: 'M', x: curr.x, y: curr.y });
        }
      } else if (i === pts.length - 1) {
        cmds.push({ cmd: 'L', x: curr.x, y: curr.y });
      } else {
        const d1 = _dist(prev!, curr);
        const d2 = _dist(curr, next!);
        const clamp = Math.min(r, d1 * 0.5, d2 * 0.5);
        const enterPt = _lerp(curr, prev!, clamp / d1);
        const exitPt  = _lerp(curr, next!, clamp / d2);
        cmds.push({ cmd: 'L', x: enterPt.x, y: enterPt.y });
        cmds.push({
          cmd: 'Q',
          cpx: curr.x, cpy: curr.y,
          x: exitPt.x, y: exitPt.y,
        });
      }
    }

    return cmds;
  }
}

function _dist(a: Point, b: Point): number {
  const dx = b.x - a.x, dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy) || 0.001;
}

function _lerp(a: Point, b: Point, t: number): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function _clampRadius(a: Point, b: Point, r: number): number {
  return Math.min(r, _dist(a, b) * 0.5);
}
