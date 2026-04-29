// ── HexagonShape ──────────────────────────────────────────────────────────────

import { PolygonShape } from './PolygonShape.js';
import type { PolygonShapeSpec } from './PolygonShape.js';

/** Spec for a hexagon shape (regular 6-sided polygon). */
export type HexagonShapeSpec = Omit<PolygonShapeSpec, 'sides'>;

/** @deprecated Use {@link HexagonShapeSpec} instead. */
export type HexagonNodeSpec = HexagonShapeSpec;

/**
 * A regular hexagon shape.
 *
 * @remarks
 * Convenience wrapper around {@link PolygonShape} with `sides` fixed to `6`.
 */
export class HexagonShape extends PolygonShape {
  constructor(spec: HexagonShapeSpec) {
    super({ ...spec, sides: 6 });
  }
}

/** @deprecated Use {@link HexagonShape} instead. */
export { HexagonShape as HexagonNode };
