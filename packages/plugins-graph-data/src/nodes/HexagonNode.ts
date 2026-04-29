// ── HexagonNode ───────────────────────────────────────────────────────────────

import { PolygonNode } from './PolygonNode.js';
import type { PolygonNodeSpec } from './PolygonNode.js';

/** Spec for a hexagon node (regular 6-sided polygon). */
export type HexagonNodeSpec = Omit<PolygonNodeSpec, 'sides'>;

/**
 * A regular hexagon node.
 *
 * @remarks
 * Convenience wrapper around {@link PolygonNode} with `sides` fixed to `6`.
 * Accepts all other {@link PolygonNodeSpec} properties.
 *
 * @example
 * ```ts
 * graphPlugin.addNode('hexagon', {
 *   id: 'h1', x: 0, y: 0, radius: 40, label: 'Data Store',
 * });
 * ```
 */
export class HexagonNode extends PolygonNode {
  constructor(spec: HexagonNodeSpec) {
    super({ ...spec, sides: 6 });
  }
}
