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
export type NodeShapeKind = 'circle' | 'rect' | 'arc';

/** Path-style shortcut for an edge. Maps to the canvas router + pathStyle pair. */
export type EdgePathType =
  | 'straight'
  | 'bezier'
  | 'bump-radial'
  | 'bump-horizontal'
  | 'step-radial'
  | 'orth'
  | 'manhattan'
  | 'rounded'
  | 'smooth'
  | 'bundle';

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
 * - `'edge-port'` — attach to a specific point on one face of the node's
 *   bounding box, picked by `{ side, offset }` on the per-endpoint
 *   `sourceAnchorOpts` / `targetAnchorOpts`. Used by the Sankey layout to
 *   stack ribbons along the right face of source and left face of target.
 *
 * Widened to `string` so anchors registered at runtime (e.g. domain-specific
 * port anchors) can be referenced by name.
 */
export type EdgeAnchor = 'boundary' | 'center' | 'perpendicular' | 'edge-port' | (string & {});

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
  /**
   * Arc-only — inner radius of the annular sector. Required when
   * `shape === 'arc'`; ignored for other shapes. Pair with `outerR`,
   * `startAngle`, `endAngle`. The node's `position` is the arc's centre.
   */
  innerR?: number;
  /** Arc-only — outer radius. Required when `shape === 'arc'`. */
  outerR?: number;
  /**
   * Arc-only — start angle in radians (`0` = 3 o'clock, increasing sweeps
   * clockwise on screen). Required when `shape === 'arc'`.
   */
  startAngle?: number;
  /** Arc-only — end angle in radians. Required when `shape === 'arc'`. */
  endAngle?: number;
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
   * Per-endpoint anchor override. Falls back to `anchor` when omitted. Lets
   * each end of an edge attach via a different anchor — needed e.g. by
   * Sankey, where the source uses `{ side: 'right' }` on the source's right
   * face and the target uses `{ side: 'left' }` on the target's left face.
   */
  sourceAnchor?: EdgeAnchor;
  /** Per-endpoint anchor override; see {@link sourceAnchor}. */
  targetAnchor?: EdgeAnchor;
  /**
   * Opts forwarded to the source / target anchor's `endpoint.opts`. The
   * shape is anchor-specific:
   *
   * - `'edge-port'` expects `{ side: 'left' | 'right' | 'top' | 'bottom'; offset?: number }`.
   *
   * Built-in `'boundary'` / `'center'` / `'perpendicular'` ignore opts.
   */
  sourceAnchorOpts?: Readonly<Record<string, unknown>>;
  /** Opts for the target anchor; see {@link sourceAnchorOpts}. */
  targetAnchorOpts?: Readonly<Record<string, unknown>>;
  /**
   * Path-style-specific options forwarded to the underlying canvas pathStyle
   * function. Shape depends on the active `pathType`:
   *
   * - `'bezier'` accepts `{ axis?: 'h' | 'v' | 'auto', tension?: number }`.
   * - `'bump-radial'` accepts `{ origin?: { x, y } }`.
   * - `'step-radial'` accepts `{ origin?: { x, y } }`.
   * - `'smooth'` accepts `{ tension?: number }`.
   * - `'bundle'` accepts `{ beta?: number }` (β ∈ [0, 1], default 0.85).
   *
   * Set this when the per-edge `axis: 'auto'` heuristic picks the wrong axis
   * for your layout (e.g. a horizontal cluster where some sibling pairs have
   * `dy > dx` and would otherwise flip to vertical curves).
   */
  pathStyleOpts?: Readonly<Record<string, unknown>>;
  /**
   * Intermediate control points the connector should respect. Passed through
   * to the underlying canvas router as `waypoints`; the `straight` router
   * concatenates them as `[source, ...waypoints, target]` so a multi-point
   * pathStyle (`'bundle'`, `'smooth'`) can curve through the hierarchy or
   * routed corridor the caller computed.
   *
   * Used today by hierarchical edge bundling: a layout walks each leaf-to-leaf
   * import path through its common ancestors and writes the projected
   * ancestor `(x, y)` sequence here, then sets `pathType: 'bundle'`.
   */
  waypoints?: ReadonlyArray<{ readonly x: number; readonly y: number }>;
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
