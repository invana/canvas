// ── GraphDataPlugin types ──────────────────────────────────────────────────────

import type { BaseEdgeSpec, DrawStyle } from './spec/index.js';

// ── Node / Edge data ──────────────────────────────────────────────────────────

/** Supported built-in node shape types. */
export type NodeShape = 'circle' | 'rect' | 'ellipse' | 'polygon' | 'diamond' | 'star' | 'hexagon';

/** Supported built-in edge path types. */
export type EdgePathType = 'straight' | 'bezier' | 'orthogonal' | 'quadratic' | 'rounded' | 'smooth';

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
  /** Node shape type (default: `'circle'`). */
  shape?: NodeShape;
  /** Uniform size in world-space units (default: 40). */
  size?: number;
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
  /** Offset from source node center to connector endpoint. */
  sourceRadius?: number;
  /** Offset from target node center to connector endpoint. */
  targetRadius?: number;
  sourceOffset?: BaseEdgeSpec['sourceOffset'];
  targetOffset?: BaseEdgeSpec['targetOffset'];
  startMarker?: BaseEdgeSpec['startMarker'];
  endMarker?: BaseEdgeSpec['endMarker'];
  states?: string[];
  opacity?: number;
  cursor?: string;
  zIndex?: number;
  draggable?: boolean;
  interactive?: boolean;
  /** Arbitrary extra data. */
  data?: Record<string, unknown>;
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
  opacity?: number | ((node: INodeData) => number);
  labelColor?: string | ((node: INodeData) => string);
  labelSize?: number | ((node: INodeData) => number);
}

/** Edge style overrides. */
export interface IEdgeStyle {
  stroke?: string | ((edge: IEdgeData) => string);
  strokeWidth?: number | ((edge: IEdgeData) => number);
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
}
