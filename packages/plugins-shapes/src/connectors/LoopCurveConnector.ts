// ── LoopCurveConnector ─────────────────────────────────────────────────────────

import { BaseConnector } from '../BaseConnector.js';
import type { BaseConnectorSpec, PathCommand, Point } from '../spec/index.js';

/** 8-way placement keyword. */
export type LoopPlacement =
  | 'top' | 'right' | 'bottom' | 'left'
  | 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left';

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
 * A self-loop connector rendered as a smooth balloon curve (single cubic Bézier).
 * Intended for self-referencing edges (source === target).
 *
 * `from` and `to` are two distinct boundary points set by the angular spread
 * (`loopSpreadAngle`) computed in GraphDataPlugin. Both points lie exactly on
 * the node surface, giving the balloon a natural attachment on any shape.
 *
 * Supports the four cardinal sides plus the four diagonals
 * (`top-right`, `bottom-right`, `bottom-left`, `top-left`).
 */
export interface LoopCurveConnectorSpec extends BaseConnectorSpec {
  /** Where the loop hangs off the node. Default: `'top'`. */
  placement?: LoopPlacement;
  /** How far the loop balloon extends from the node in world-space pixels. Default: `60`. */
  loopSize?: number;
  /**
   * 0-based stacking index when multiple loops share the same node and placement.
   * Each increment adds `loopSpacing` to `loopSize`. Default: `0`.
   */
  loopIndex?: number;
  /** Extra pixels added to the loop size per index step. Default: `25`. */
  loopSpacing?: number;
}

export class LoopCurveConnector extends BaseConnector<LoopCurveConnectorSpec> {
  route(from: Point, to: Point, _waypoints: Point[]): PathCommand[] {
    const placement = this.spec.placement   ?? 'top';
    const index     = this.spec.loopIndex   ?? 0;
    const spacing   = this.spec.loopSpacing ?? 25;

    const effectiveSize = (this.spec.loopSize ?? 60) + index * spacing;
    const dir = PLACEMENT_DIRS[placement] ?? PLACEMENT_DIRS.top;

    // Bow each control point AWAY from the opposite anchor along the chord
    // direction. Using the from→to chord (instead of a fixed per-placement
    // perpendicular) keeps the curve a single outward petal for any placement —
    // cardinal or diagonal — and avoids the figure-8 crossing that happens when
    // cp1 and cp2 fall on the wrong sides of the placement axis.
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.hypot(dx, dy) || 1;
    const tx = dx / dist;
    const ty = dy / dist;

    const bowing = effectiveSize * 0.9;
    const cp1: Point = {
      x: from.x + dir.x * effectiveSize - tx * bowing,
      y: from.y + dir.y * effectiveSize - ty * bowing,
    };
    const cp2: Point = {
      x: to.x + dir.x * effectiveSize + tx * bowing,
      y: to.y + dir.y * effectiveSize + ty * bowing,
    };

    return [
      { cmd: 'M', x: from.x, y: from.y },
      { cmd: 'C', cp1x: cp1.x, cp1y: cp1.y, cp2x: cp2.x, cp2y: cp2.y, x: to.x, y: to.y },
    ];
  }
}
