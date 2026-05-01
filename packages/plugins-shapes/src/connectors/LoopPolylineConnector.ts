// ── LoopPolylineConnector ──────────────────────────────────────────────────────

import { BaseConnector } from '../BaseConnector.js';
import type { BaseConnectorSpec, PathCommand, Point } from '../spec/index.js';
import type { LoopPlacement } from './LoopCurveConnector.js';

/** Outward unit vector for each placement. y is in screen coords (down = +). */
const PLACEMENT_DIRS: Record<LoopPlacement, { x: number; y: number }> = {
  top:           { x:  0,           y: -1           },
  'top-right':   { x:  Math.SQRT1_2, y: -Math.SQRT1_2 },
  right:         { x:  1,           y:  0           },
  'bottom-right':{ x:  Math.SQRT1_2, y:  Math.SQRT1_2 },
  bottom:        { x:  0,           y:  1           },
  'bottom-left': { x: -Math.SQRT1_2, y:  Math.SQRT1_2 },
  left:          { x: -1,           y:  0           },
  'top-left':    { x: -Math.SQRT1_2, y: -Math.SQRT1_2 },
};

/**
 * A self-loop connector rendered as a rectangular polyline (three segments).
 * Intended for self-referencing edges (source === target).
 *
 * For cardinal placements the loop is axis-aligned. For diagonal placements
 * the rectangle is rotated to align with the diagonal — both legs run along
 * the placement direction and the crossbar runs perpendicular to it.
 *
 * `from` and `to` are two distinct boundary points set by the angular spread
 * (`loopSpreadAngle`) computed in GraphDataPlugin.
 */
export interface LoopPolylineConnectorSpec extends BaseConnectorSpec {
  /** Where the loop hangs off the node. Default: `'top'`. */
  placement?: LoopPlacement;
  /** How far the loop extends from the node in world-space pixels. Default: `40`. */
  loopSize?: number;
  /**
   * 0-based stacking index when multiple loops share the same node and placement.
   * Each increment adds `loopSpacing` to `loopSize`. Default: `0`.
   */
  loopIndex?: number;
  /** Extra pixels added to the loop size per index step. Default: `20`. */
  loopSpacing?: number;
}

export class LoopPolylineConnector extends BaseConnector<LoopPolylineConnectorSpec> {
  route(from: Point, to: Point, _waypoints: Point[]): PathCommand[] {
    const placement = this.spec.placement   ?? 'top';
    const index     = this.spec.loopIndex   ?? 0;
    const spacing   = this.spec.loopSpacing ?? 20;

    const effectiveSize = (this.spec.loopSize ?? 40) + index * spacing;
    const dir = PLACEMENT_DIRS[placement] ?? PLACEMENT_DIRS.top;

    // Project each anchor onto the placement direction, then push both legs
    // out to the same depth. Connecting leg endpoints gives a crossbar that
    // is purely perpendicular to dir (axis-aligned for cardinal placements,
    // rotated for diagonals), preserving the right-angle "rectangle" look.
    const dotFrom = from.x * dir.x + from.y * dir.y;
    const dotTo   = to.x   * dir.x + to.y   * dir.y;
    const depth   = Math.max(dotFrom, dotTo) + effectiveSize;

    const p2: Point = {
      x: from.x + (depth - dotFrom) * dir.x,
      y: from.y + (depth - dotFrom) * dir.y,
    };
    const p3: Point = {
      x: to.x + (depth - dotTo) * dir.x,
      y: to.y + (depth - dotTo) * dir.y,
    };

    return [
      { cmd: 'M', x: from.x, y: from.y },
      { cmd: 'L', x: p2.x,   y: p2.y   },
      { cmd: 'L', x: p3.x,   y: p3.y   },
      { cmd: 'L', x: to.x,   y: to.y   },
    ];
  }
}
