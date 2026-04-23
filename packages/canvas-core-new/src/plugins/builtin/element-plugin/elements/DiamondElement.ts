// ── DiamondElement ────────────────────────────────────────────────────────────
// A 4-sided polygon rotated 45° — rendered as a diamond / rhombus.

import { PolygonElement } from './PolygonElement.js';
import type { BaseSolidSpec } from '../spec/index.js';

/** Spec for a diamond (rhombus) element. */
export interface DiamondElementSpec extends BaseSolidSpec {
  /** Half-width / half-height of the diamond in world-space pixels. */
  radius: number;
}

/**
 * A diamond (rhombus) element — a 4-sided polygon rotated 45°.
 *
 * @remarks
 * Convenience subclass of {@link PolygonElement} with `sides: 4` and
 * `rotation: 0` (flat top/bottom, points left/right).
 */
export class DiamondElement extends PolygonElement {
  constructor(spec: DiamondElementSpec) {
    super({ ...spec, sides: 4, rotation: 0 });
  }
}
