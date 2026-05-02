// ── SmoothConnector ───────────────────────────────────────────────────────────

import { BaseConnector } from '../BaseConnector.js';
import type { BaseConnectorSpec, PathCommand, Point } from '../spec/index.js';

/** Spec for a smooth (Catmull-Rom) spline connector. */
export interface SmoothConnectorSpec extends BaseConnectorSpec {
  tension?: number;
}

/**
 * Smooth connector — Catmull-Rom spline through all provided waypoints.
 */
export class SmoothConnector extends BaseConnector<SmoothConnectorSpec> {
  route(from: Point, to: Point, waypoints: Point[]): PathCommand[] {
    const pts: Point[] = [from, ...waypoints, to];
    const tension = this.spec.tension ?? 0.5;

    if (pts.length === 2) {
      return [
        { cmd: 'M', x: from.x, y: from.y },
        { cmd: 'L', x: to.x,   y: to.y   },
      ];
    }

    return catmullRomToBezier(pts, tension);
  }
}

function catmullRomToBezier(pts: Point[], tension: number): PathCommand[] {
  const alpha = tension;
  const all: Point[] = [
    _reflect(pts[1]!, pts[0]!),
    ...pts,
    _reflect(pts[pts.length - 2]!, pts[pts.length - 1]!),
  ];

  const cmds: PathCommand[] = [
    { cmd: 'M', x: pts[0]!.x, y: pts[0]!.y },
  ];

  for (let i = 1; i < all.length - 2; i++) {
    const p0 = all[i - 1]!;
    const p1 = all[i]!;
    const p2 = all[i + 1]!;
    const p3 = all[i + 2]!;

    const cp1: Point = {
      x: p1.x + (p2.x - p0.x) * alpha / 6,
      y: p1.y + (p2.y - p0.y) * alpha / 6,
    };
    const cp2: Point = {
      x: p2.x - (p3.x - p1.x) * alpha / 6,
      y: p2.y - (p3.y - p1.y) * alpha / 6,
    };

    cmds.push({
      cmd: 'C',
      cp1x: cp1.x, cp1y: cp1.y,
      cp2x: cp2.x, cp2y: cp2.y,
      x: p2.x, y: p2.y,
    });
  }

  return cmds;
}

function _reflect(a: Point, b: Point): Point {
  return { x: 2 * b.x - a.x, y: 2 * b.y - a.y };
}
