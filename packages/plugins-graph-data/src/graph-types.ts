// ── GraphDataPlugin types ──────────────────────────────────────────────────────

import type { BaseEdgeSpec, DrawStyle, Point } from '@invana/plugins-shapes';

// ── Node / Edge data ──────────────────────────────────────────────────────────

/** Supported built-in node shape types. */
export type NodeShape = 'circle' | 'rect' | 'ellipse' | 'polygon' | 'diamond' | 'star' | 'hexagon';

/** Supported built-in edge path types. */
export type EdgePathType =
  | 'straight'
  | 'bezier'
  | 'cubic'
  | 'cubic-horizontal'
  | 'cubic-vertical'
  | 'orthogonal'
  | 'quadratic'
  | 'rounded'
  | 'smooth'
  | 'loop-polyline'
  | 'loop-curve';

/**
 * Edge direction filter for graph traversal queries.
 *
 * - `'in'`   — follow edges where the start node is the `target`.
 * - `'out'`  — follow edges where the start node is the `source`.
 * - `'both'` — follow edges in either direction (treat the graph as undirected).
 */
export type TraversalDirection = 'in' | 'out' | 'both';

/**
 * Data descriptor for a single graph node.
 * GraphDataPlugin maps this to an GraphPlugin node spec.
 */
export interface INodeData {
  /** Unique node id. */
  id: string;
  /** Initial world-space x position. */
  x?: number;
  /** Initial world-space y position. */
  y?: number;
  /** Node shape type (default: `'circle'`). Built-in values: {@link NodeShape}. Any registered custom type is also valid. */
  shape?: NodeShape | (string & {});
  /** Uniform size in world-space units (default: 40). */
  size?: number;
  /** Number of sides for `polygon` shapes (3 = triangle, 5 = pentagon, …). */
  sides?: number;
  /** Optional text label. */
  label?: string;
  /** Whether the node can be dragged (default: true). */
  draggable?: boolean;
  /** Whether the node is interactive (pointer events, default: true). */
  interactive?: boolean;
  /** Initial states (e.g. `['selected']`). */
  states?: string[];
  /** z-ordering hint. */
  zIndex?: number;
  /** Cursor override (e.g. `'pointer'`). */
  cursor?: string;
  /** Opacity 0-1 (default: 1). */
  opacity?: number;
  /** Arbitrary extra data, available in events via `event.data`. */
  data?: Record<string, unknown>;
  /** Custom geometry fields forwarded as-is to the shape spec (e.g. radius, width, height). */
  [key: string]: unknown;
}

/**
 * Data descriptor for a single graph edge.
 * GraphDataPlugin maps this to an GraphPlugin edge spec.
 */
export interface IEdgeData {
  /** Unique edge id. */
  id: string;
  /** Source node id. */
  source: string;
  /** Target node id. */
  target: string;
  /** Edge path type (default: `'bezier'`). */
  pathType?: EdgePathType;
  /** Optional text label. */
  label?: string;
  /** Router name or config. */
  router?: BaseEdgeSpec['router'];
  /** Manual waypoints. */
  vertices?: BaseEdgeSpec['vertices'];
  /**
   * Explicit control points for cubic-family connectors (`bezier`, `cubic`,
   * `cubic-horizontal`, `cubic-vertical`). When set, `curvePosition` and
   * `curveOffset` are ignored. For `quadratic`, supply a single-element array
   * (or use {@link controlPoint}).
   */
  controlPoints?: [Point, Point] | Point[];
  /**
   * Explicit single control point for `quadratic` connectors. When set,
   * `curvePosition` and `curveOffset` are ignored.
   */
  controlPoint?: Point;
  /**
   * Relative position(s) of the control point(s) along the source-target
   * chord, in the range `0–1`. Scalar applies to both CPs (cubic-family) or
   * the single CP (quadratic); tuple `[t1, t2]` controls cp1-from-source and
   * cp2-from-target independently. Only applies to `bezier` / `cubic` /
   * `cubic-horizontal` / `cubic-vertical` / `quadratic`.
   *
   * Defaults: `[0.25, 0.25]` (cubic), `[0.5, 0.5]` (cubic-horizontal /
   * cubic-vertical), `0.5` (quadratic).
   */
  curvePosition?: number | [number, number];
  /**
   * Perpendicular offset(s) of the control point(s) from the chord, in
   * world-space pixels. Sign chooses the side (negative flips the bend).
   * Scalar applies to both CPs; tuple `[o1, o2]` controls cp1 and cp2
   * independently. Only applies to `bezier` / `cubic` / `cubic-horizontal` /
   * `cubic-vertical` / `quadratic`.
   *
   * Defaults: `[20, 20]` (cubic), `[0, 0]` (cubic-horizontal / cubic-vertical),
   * `30` (quadratic).
   */
  curveOffset?: number | [number, number];
  /** Visible gap (px) between the source perimeter and the start arrow tip. Default 0. */
  sourceOffset?: BaseEdgeSpec['sourceOffset'];
  /** Visible gap (px) between the target perimeter and the end arrow tip. Default 0. */
  targetOffset?: BaseEdgeSpec['targetOffset'];
  /** Optional id of a named port on the source node (see `BaseShape.getPorts()`). */
  sourcePortId?: string;
  /** Optional id of a named port on the target node. */
  targetPortId?: string;
  startMarker?: BaseEdgeSpec['startMarker'];
  endMarker?: BaseEdgeSpec['endMarker'];
  states?: string[];
  opacity?: number;
  cursor?: string;
  zIndex?: number;
  draggable?: boolean;
  interactive?: boolean;
  /**
   * Placement of a self-loop relative to the node. Only used when `pathType` is
   * `'loop-polyline'` or `'loop-curve'`. Supports the four cardinal sides
   * (`'top' | 'right' | 'bottom' | 'left'`) and the four diagonals
   * (`'top-right' | 'bottom-right' | 'bottom-left' | 'top-left'`).
   * Default: `'top'`.
   */
  placement?:
    | 'top' | 'right' | 'bottom' | 'left'
    | 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left';
  /** How far the loop extends from the node in world-space pixels. Default: `40` (polyline) / `60` (curve). */
  loopSize?: number;
  /**
   * Angular spread (radians) between the two anchor points on the node boundary.
   * Controls the opening width of the loop: wider angle = wider opening.
   * Default: `0.3` (~17°).  Works for both `loop-polyline` and `loop-curve`.
   */
  loopSpreadAngle?: number;
  /**
   * 0-based stacking index for multiple loops on the same node and side.
   * Each step adds `loopSpacing` px to the loop size. Default: `0`.
   */
  loopIndex?: number;
  /** Extra pixels added to loop size per `loopIndex` step. Default: `20` (polyline) / `25` (curve). */
  loopSpacing?: number;
  /** Arbitrary extra data. */
  data?: Record<string, unknown>;
  /** Custom fields forwarded as-is to the connector spec (e.g. per-edge style). */
  [key: string]: unknown;
}

/**
 * Full graph dataset passed to {@link GraphDataPlugin.setData}.
 */
export interface ICanvasData {
  nodes: INodeData[];
  edges: IEdgeData[];
}

// ── Styles ────────────────────────────────────────────────────────────────────

/** Node style overrides. */
export interface INodeStyle {
  fill?: DrawStyle['fill'] | ((node: INodeData) => DrawStyle['fill']);
  stroke?: DrawStyle['stroke'] | ((node: INodeData) => DrawStyle['stroke']);
  strokeWidth?: number | ((node: INodeData) => number);
  strokeAlpha?: number | ((node: INodeData) => number);
  strokeCap?: DrawStyle['strokeCap'] | ((node: INodeData) => DrawStyle['strokeCap']);
  strokeJoin?: DrawStyle['strokeJoin'] | ((node: INodeData) => DrawStyle['strokeJoin']);
  strokeAlignment?: number | ((node: INodeData) => number);
  strokeMiterLimit?: number | ((node: INodeData) => number);
  opacity?: number | ((node: INodeData) => number);
  labelColor?: string | ((node: INodeData) => string);
  labelSize?: number | ((node: INodeData) => number);
}

/** Edge style overrides. */
export interface IEdgeStyle {
  stroke?: string | ((edge: IEdgeData) => string);
  strokeWidth?: number | ((edge: IEdgeData) => number);
  strokeAlpha?: number | ((edge: IEdgeData) => number);
  strokeCap?: DrawStyle['strokeCap'] | ((edge: IEdgeData) => DrawStyle['strokeCap']);
  strokeJoin?: DrawStyle['strokeJoin'] | ((edge: IEdgeData) => DrawStyle['strokeJoin']);
  strokeAlignment?: number | ((edge: IEdgeData) => number);
  strokeMiterLimit?: number | ((edge: IEdgeData) => number);
  opacity?: number | ((edge: IEdgeData) => number);
}

/**
 * Style configuration applied globally to all nodes and edges.
 * Passed to {@link GraphDataPlugin.setStyles}.
 */
export interface IGraphStyles {
  node?: INodeStyle;
  edge?: IEdgeStyle;
}

// ── Plugin options ────────────────────────────────────────────────────────────

/**
 * Construction options for {@link GraphDataPlugin}.
 */
export interface GraphDataPluginOptions {
  /**
   * Plugin id. Defaults to `'graph-data'`.
   */
  key?: string;
  /**
   * Whether to automatically fit the viewport after {@link GraphDataPlugin.setData}.
   * Defaults to `false`.
   */
  fitOnRender?: boolean;
  /**
   * Padding applied when auto-fitting. Defaults to `40`.
   */
  fitPadding?: number;
  /**
   * Initial graph dataset. If provided, {@link GraphDataPlugin.setData} is called
   * automatically during plugin registration.
   */
  data?: ICanvasData;
  /**
   * Initial style overrides. If provided, {@link GraphDataPlugin.setStyles} is called
   * automatically during plugin registration (after data).
   */
  styles?: IGraphStyles;
}
