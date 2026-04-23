// ── Element plugin spec types ─────────────────────────────────────────────────
// These types define the data shapes for all solid elements and connectors.
// They deliberately use the same DrawStyle / PathStyle as graphics-utils so
// element authors can pass style objects directly to DrawContext methods.

import type { DrawStyle, PathStyle } from '../../../../graphics-utils/types.js';

// ── Geometry primitives ───────────────────────────────────────────────────────

/** A point in world space. */
export interface Point {
  x: number;
  y: number;
}

/** Axis-aligned bounding box for RBush spatial indexing. */
export interface BBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

// ── Path commands (subset of SVG path spec) ───────────────────────────────────

export type PathCommand =
  | { cmd: 'M'; x: number; y: number }
  | { cmd: 'L'; x: number; y: number }
  | { cmd: 'C'; cp1x: number; cp1y: number; cp2x: number; cp2y: number; x: number; y: number }
  | { cmd: 'Q'; cpx: number; cpy: number; x: number; y: number }
  | { cmd: 'Z' };

// ── Arrow marker ──────────────────────────────────────────────────────────────

/**
 * Arrowhead marker placed at a connector endpoint.
 * Use `type: 'none'` to suppress the arrowhead explicitly.
 */
export interface ArrowSpec {
  /** Arrow shape. Defaults to `'triangle'`. */
  type: 'triangle' | 'triangle-outline' | 'diamond' | 'circle' | 'square' | 'none';
  /** Arrow fill/stroke color. Defaults to the connector stroke color. */
  color?: string;
  /** Arrow size in world-space pixels. Defaults to 10. */
  size?: number;
}

// ── Shared re-exports for element authors ─────────────────────────────────────

export type { DrawStyle, PathStyle };

// ── Base specs ────────────────────────────────────────────────────────────────

/**
 * Base spec shared by all solid (closed/filled) elements.
 *
 * @remarks
 * `style` maps directly to {@link DrawStyle} from `graphics-utils`.
 * Per-state style overrides (`states`) are applied on top of the base style
 * whenever the corresponding state is active (e.g. `'hovered'`, `'selected'`).
 */
export interface BaseSolidSpec {
  /** Unique element id. */
  id: string;
  /** World-space x coordinate of the element's anchor (typically centre). */
  x: number;
  /** World-space y coordinate of the element's anchor. */
  y: number;
  /** Optional label shown at {@link RenderDetail.DETAIL} zoom level. */
  label?: string;
  /** Fill and stroke style. */
  style?: DrawStyle;
  /** Container alpha (0–1). */
  opacity?: number;
  /** z-ordering within the element layer (higher = on top). */
  zIndex?: number;
  /** Whether pointer events are enabled for this element. */
  interactive?: boolean;
  /** CSS cursor shown on hover. Only meaningful when `interactive: true`. */
  cursor?: string;
  /** Whether the element can be dragged. Only meaningful when `interactive: true`. */
  draggable?: boolean;
  /**
   * Per-state style overrides.
   * Keys are state names; values are partial DrawStyle merged over the base style
   * whenever that state is active.
   *
   * @example
   * ```ts
   * states: {
   *   hovered:  { stroke: '#58a6ff', strokeWidth: 3 },
   *   selected: { stroke: '#f78166', strokeWidth: 3, fill: '#2d333b' },
   * }
   * ```
   */
  states?: Record<string, DrawStyle>;
  /** Arbitrary consumer data — forwarded in event payloads unchanged. */
  data?: Record<string, unknown>;
}

/**
 * Base spec shared by all connector (path/routing) elements.
 *
 * @remarks
 * `style` maps directly to {@link PathStyle} from `graphics-utils`.
 * `from` / `to` are world-space endpoint positions. When used by `plugin-graph`
 * these will be the `getConnectionPoint()` results from the source/target nodes.
 */
export interface BaseConnectorSpec {
  /** Unique element id. */
  id: string;
  /** Source endpoint in world space. */
  from: Point;
  /** Target endpoint in world space. */
  to: Point;
  /** Intermediate control / bend points. Interpretation depends on the connector class. */
  waypoints?: Point[];
  /** Optional midpoint label shown at {@link RenderDetail.DETAIL} zoom level. */
  label?: string;
  /** Stroke style. */
  style?: PathStyle;
  /** Arrowhead at the source end. `undefined` = no arrow. */
  startArrow?: ArrowSpec;
  /** Arrowhead at the target end. Defaults to a small triangle when unset. */
  endArrow?: ArrowSpec;
  /** Container alpha (0–1). */
  opacity?: number;
  /** z-ordering within the connector layer. */
  zIndex?: number;
  /** Whether pointer events are enabled for this connector. */
  interactive?: boolean;
  /** CSS cursor shown on hover. */
  cursor?: string;
  /** Whether the connector can be dragged (moves both endpoints). */
  draggable?: boolean;
  /**
   * Per-state style overrides.
   * Keys are state names; values are partial PathStyle merged over the base style.
   */
  states?: Record<string, PathStyle>;
  /** Arbitrary consumer data — forwarded in event payloads unchanged. */
  data?: Record<string, unknown>;
}
