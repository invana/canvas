// ── RoundedConnector ─────────────────────────────────────────────────────────
// Orthogonal segments with circular arc corners.
// Designed to be used with the 'orth' router (which supplies the right-angle
// bend points), but also works standalone with explicit waypoints.

import { BaseEdge } from '../BaseEdge.js';
import type { BaseEdgeSpec, PathCommand, Point } from '../spec/index.js';

/** Spec for a rounded orthogonal connector. */
export interface RoundedConnectorSpec extends BaseEdgeSpec {
  /**
   * Corner arc radius in world-space pixels.  Default: 8.
   * Clamped to half the shortest adjacent segment length to avoid artefacts.
   */
  radius?: number;
}

/**
 * Rounded connector.
 *
 * @remarks
 * Takes the routed point list (already orthogonal after the `orth` router runs)
 * and replaces each interior corner with a quadratic Bézier arc of `radius`.
 * Pair with `router: 'orth'` for fully rounded orthogonal edges, e.g.:
 * ```ts
 * elementPlugin.addConnector('rounded', {
 *   id: 'e1',
 *   from: { x: 0, y: 0 }, to: { x: 200, y: 100 },
 *   router: 'orth',
 * });
 * ```
 */
export class RoundedConnector extends BaseEdge<RoundedConnectorSpec> {
  route(from: Point, to: Point, waypoints: Point[]): PathCommand[] {
    const r = this.spec.radius ?? 8;
    const pts: Point[] = [from, ...waypoints, to];

    if (pts.length < 3) {
      // No corners — degenerate to straight line
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
        // Start point — move to position before first corner
        if (next) {
          const clamp = _clampRadius(curr, next, r);
          const startPt = _lerp(curr, next, clamp / _dist(curr, next));
          cmds.push({ cmd: 'M', x: startPt.x, y: startPt.y });
        } else {
          cmds.push({ cmd: 'M', x: curr.x, y: curr.y });
        }
      } else if (i === pts.length - 1) {
        // End point — straight line to it
        cmds.push({ cmd: 'L', x: curr.x, y: curr.y });
      } else {
        // Interior corner — draw arc
        const d1 = _dist(prev!, curr);
        const d2 = _dist(curr, next!);
        const clamp = Math.min(r, d1 * 0.5, d2 * 0.5);
        const enterPt = _lerp(curr, prev!, clamp / d1);
        const exitPt  = _lerp(curr, next!, clamp / d2);
        cmds.push({ cmd: 'L', x: enterPt.x, y: enterPt.y });
        // Quadratic Bézier through the corner
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

// ── helpers ───────────────────────────────────────────────────────────────────

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
