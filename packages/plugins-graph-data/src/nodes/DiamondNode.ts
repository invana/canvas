// ── DiamondNode ───────────────────────────────────────────────────────────────
// A 4-sided polygon rotated 45° — rendered as a diamond / rhombus.

import { PolygonNode } from './PolygonNode.js';
import type { BaseNodeSpec } from '../spec/index.js';

/** Spec for a diamond (rhombus) node. */
export interface DiamondNodeSpec extends BaseNodeSpec {
  /** Half-width / half-height of the diamond in world-space pixels. */
  radius: number;
}

/**
 * A diamond (rhombus) node — a 4-sided polygon rotated 45°.
 *
 * @remarks
 * Convenience subclass of {@link PolygonNode} with `sides: 4` and
 * `rotation: 0` (flat top/bottom, points left/right).
 */
export class DiamondNode extends PolygonNode {
  constructor(spec: DiamondNodeSpec) {
    super({ ...spec, sides: 4, rotation: 0 });
  }
}
