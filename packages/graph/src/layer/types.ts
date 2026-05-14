/**
 * `GraphLayer` public types — option shapes and per-node/per-edge render-spec
 * hints that map domain data to primitive specs.
 */
import type { ShapeLabelStyle, ConnectorLabelStyle } from '@invana/canvas';
import type { GraphEdge, GraphNode } from '../store/types';

/**
 * Node-label hint — either a bare string (shorthand for plain text with
 * defaults) or a full `ShapeLabelStyle` payload (background pill, wrap,
 * placement, etc.). The graph layer translates this to a `'label'`
 * decoration on the node's shape via `setDecoration`.
 *
 * @see `@invana/canvas#ShapeLabelStyle` for the full option surface.
 */
export type NodeLabelHint = string | ShapeLabelStyle;

/**
 * Edge-label hint — string shorthand or a full `ConnectorLabelStyle`. The
 * graph layer translates this to a `'label-connector'` decoration on the
 * edge's connector via `setDecoration`.
 *
 * @see `@invana/canvas#ConnectorLabelStyle` for the full option surface.
 */
export type EdgeLabelHint = string | ConnectorLabelStyle;

/** Shape kinds the layer can render for a node. */
export type NodeShapeKind = 'circle' | 'rect';

/** Path-style shortcut for an edge. Maps to the canvas router + pathStyle pair. */
export type EdgePathType =
  | 'straight'
  | 'bezier'
  | 'bump-radial'
  | 'step-radial'
  | 'orth'
  | 'manhattan'
  | 'rounded'
  | 'smooth';

/**
 * Endpoint anchor.
 *
 * - `'boundary'` (default) — trim the endpoint at the node's outline along
 *   the line from the other endpoint. Visually the edge stops at the node
 *   boundary; works with arrows and connector decorations cleanly.
 * - `'center'` — leave the endpoint at the node's centre. The edge passes
 *   through the node visually; rely on z-order (nodes drawn on top) to make
 *   it look like the edge terminates at the boundary. Pick this for radial
 *   layouts so polar pathStyles (e.g. `bump-radial`) compute their tangent
 *   from the true node-centre angle rather than the trimmed cut point.
 * - `'perpendicular'` — exit / enter perpendicular to the host edge of a
 *   rect-like node. Reserved for box-shaped nodes.
 */
export type EdgeAnchor = 'boundary' | 'center' | 'perpendicular';

/**
 * Render-spec hints a caller may put under `node.data` to control how the
 * layer renders this node. All fields are optional; defaults below.
 */
export interface NodeRenderHints {
  /** Shape kind. Default `'circle'`. */
  shape?: NodeShapeKind;
  /** Diameter (circle) or width (rect). Default 32. */
  size?: number;
  /** Height (rect only). Defaults to `size` for square rects. */
  height?: number;
  /** Rect corner radius. Default 4. */
  cornerRadius?: number;
  /** Fill color (0xRRGGBB) or `false` for no fill. Default `0x3b82f6`. */
  fill?: number | false;
  /** Stroke color (0xRRGGBB) or `false` for no stroke. Default `0x1d4ed8`. */
  stroke?: number | false;
  /** Stroke width. Default 1. */
  strokeWidth?: number;
  /** Alpha 0–1. Default 1. */
  alpha?: number;
  /**
   * Optional text label attached to the node. Pass a string for the simple
   * case (defaults to plain text below the node) or a `ShapeLabelStyle`
   * payload for full control (placement, wrap, background pill, html-text).
   *
   * Resolves to a canvas `'label'` decoration on the rendered shape.
   * @see {@link NodeLabelHint}
   */
  label?: NodeLabelHint;
}

/** Render-spec hints for an edge. Optional, all defaulted. */
export interface EdgeRenderHints {
  /** Path-style shortcut. Default `'straight'`. */
  pathType?: EdgePathType;
  /** Endpoint anchor for both ends. Default `'boundary'`. See {@link EdgeAnchor}. */
  anchor?: EdgeAnchor;
  /**
   * Path-style-specific options forwarded to the underlying canvas pathStyle
   * function. Shape depends on the active `pathType`:
   *
   * - `'bezier'` accepts `{ axis?: 'h' | 'v' | 'auto', tension?: number }`.
   * - `'bump-radial'` accepts `{ origin?: { x, y } }`.
   * - `'step-radial'` accepts `{ origin?: { x, y } }`.
   * - `'smooth'` accepts `{ tension?: number }`.
   *
   * Set this when the per-edge `axis: 'auto'` heuristic picks the wrong axis
   * for your layout (e.g. a horizontal cluster where some sibling pairs have
   * `dy > dx` and would otherwise flip to vertical curves).
   */
  pathStyleOpts?: Readonly<Record<string, unknown>>;
  /** Stroke color. Default `0x94a3b8`. */
  stroke?: number;
  /** Stroke width. Default 1.5. */
  strokeWidth?: number;
  /** Alpha 0–1. Default 1. */
  alpha?: number;
  /** Whether to draw an arrowhead at target. Default `true`. */
  arrow?: boolean;
  /**
   * Optional text label attached to the edge. Pass a string for the simple
   * case (defaults to centred autoRotate-on text) or a `ConnectorLabelStyle`
   * payload for full control (placement, pathOffset, wrap, background pill,
   * html-text, etc.).
   *
   * Resolves to a canvas `'label-connector'` decoration on the rendered
   * connector.
   * @see {@link EdgeLabelHint}
   */
  label?: EdgeLabelHint;
}

/** Initial-load shape passed to `graphLayer.setData(data)`. */
export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * Visual-state override applied on top of a node's / edge's base render hints
 * when that state is active. Multiple active states stack — later-set state
 * wins per field. Removing the state restores the base hints.
 */
export type NodeStateConfig = NodeRenderHints;
export type EdgeStateConfig = EdgeRenderHints;

/** Constructor options for `GraphLayer`. */
export interface GraphLayerOptions {
  /**
   * Optional pre-built store. If omitted, the layer creates its own with
   * default options (`flushMode: 'sync'`, `unknownEndpoint: 'throw'`). Pass
   * a store you own to share data with other layers / sync code.
   */
  store?: import('../store/GraphStore').GraphStore;

  /**
   * Default node render hints applied when a node has no per-node override
   * under `node.data`. Defaults shown in {@link NodeRenderHints}.
   */
  nodeDefaults?: NodeRenderHints;

  /** Default edge render hints. */
  edgeDefaults?: EdgeRenderHints;
}

/**
 * Layer-level event payloads (separate from store events). Pointer/drag/etc.
 * arrive in later phases; today this is just the aggregated lifecycle.
 */
export interface GraphLayerEvents {
  'data:changed': {
    addedNodes: number;
    removedNodes: number;
    updatedNodes: number;
    addedEdges: number;
    removedEdges: number;
    updatedEdges: number;
  };
  'positions:updated': { count: number };
  [event: string]: unknown;
}
