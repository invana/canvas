// ── DiamondShape ──────────────────────────────────────────────────────────────
// A 4-sided polygon rotated 45° — rendered as a diamond / rhombus.

import { PolygonShape } from './PolygonShape.js';
import type { BaseShapeSpec } from '../spec/index.js';

/** Spec for a diamond (rhombus) shape. */
export interface DiamondShapeSpec extends BaseShapeSpec {
  /** Half-width / half-height of the diamond in world-space pixels. */
  radius: number;
}

/** @deprecated Use {@link DiamondShapeSpec} instead. */
export type DiamondNodeSpec = DiamondShapeSpec;

/**
 * A diamond (rhombus) shape — a 4-sided polygon rotated 45°.
 */
export class DiamondShape extends PolygonShape {
  constructor(spec: DiamondShapeSpec) {
    super({ ...spec, sides: 4, rotation: 0 });
  }
}

/** @deprecated Use {@link DiamondShape} instead. */
export { DiamondShape as DiamondNode };
