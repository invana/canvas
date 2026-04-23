// ── HexagonElement ────────────────────────────────────────────────────────────

import { PolygonElement } from './PolygonElement.js';
import type { PolygonElementSpec } from './PolygonElement.js';

/** Spec for a hexagon element (regular 6-sided polygon). */
export type HexagonElementSpec = Omit<PolygonElementSpec, 'sides'>;

/**
 * A regular hexagon element.
 *
 * @remarks
 * Convenience wrapper around {@link PolygonElement} with `sides` fixed to `6`.
 * Accepts all other {@link PolygonElementSpec} properties.
 *
 * @example
 * ```ts
 * elementPlugin.addSolid('hexagon', {
 *   id: 'h1', x: 0, y: 0, radius: 40, label: 'Data Store',
 * });
 * ```
 */
export class HexagonElement extends PolygonElement {
  constructor(spec: HexagonElementSpec) {
    super({ ...spec, sides: 6 });
  }
}
