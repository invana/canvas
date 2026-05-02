// ── plugins-shapes spec types ─────────────────────────────────────────────────
// These types define the data shapes for all solid shapes and connectors.
// They deliberately use the same DrawStyle / PathStyle as graphics-utils so
// shape authors can pass style objects directly to DrawContext methods.

import type { DrawStyle, PathStyle } from '@invana/canvas';

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

import type { GraphicsPathCommand as PathCommand } from '@invana/canvas';
export type { PathCommand };

// ── Node ports ────────────────────────────────────────────────────────────────

/**
 * A named anchor point on a shape's perimeter, used by connectors that target
 * a specific connection slot rather than the nearest boundary intersection.
 *
 * Ports are the foundation for ER-style entities, BPMN tasks, and any diagram
 * where edges must enter/exit the node at fixed, labelled positions.
 */
export interface NodePort {
  /** Stable identifier; referenced by connector specs as `sourcePortId` / `targetPortId`. */
  id: string;
  /** World-space anchor position (typically on the shape's perimeter). */
  position: Point;
  /**
   * Outward unit normal at the port. Used by curved connectors to orient
   * cp1 / cp2 so the curve leaves / enters the port cleanly.
   */
  normal: Point;
  /** Optional side hint for axis-aligned routers (orthogonal / rounded). */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Optional human-readable label (e.g. attribute name in an ER entity). */
  label?: string;
}

// ── Arrow marker ──────────────────────────────────────────────────────────────

/**
 * Arrowhead marker placed at a connector endpoint.
 * Use `type: 'none'` to suppress the arrowhead explicitly.
 */
export interface ArrowSpec {
  /**
   * Arrow shape. Defaults to `'triangle'` on the end, `'none'` on the start.
   */
  type:
    | 'triangle'
    | 'triangle-outline'
    | 'diamond'
    | 'diamond-outline'
    | 'circle'
    | 'circle-outline'
    | 'circle-plus'
    | 'square'
    | 'square-outline'
    | 'block'
    | 'classic'
    | 'ellipse'
    | 'cross'
    | 'async'
    | 'none';
  /** Arrow fill/stroke color. Defaults to the connector stroke color. */
  color?: string;
  /** Arrow size in world-space pixels. Defaults to 10. */
  size?: number;
  /** x-radius for `'ellipse'` markers. Defaults to `size * 0.5`. */
  rx?: number;
  /** y-radius for `'ellipse'` markers. Defaults to `size * 0.35`. */
  ry?: number;
}

// ── Router / Connector pipeline types ────────────────────────────────────────

/**
 * Context passed to router functions so they can read other shapes' bounding
 * boxes for obstacle-avoidance routing (manhattan / metro).
 */
export interface RouterContext {
  /** Get the BBox of a shape element by id. Returns `undefined` if not found. */
  getShapeBBox(id: string): BBox | undefined;
  /** Get all shape BBoxes keyed by element id. */
  getAllShapeBBoxes(): Map<string, BBox>;
}

/**
 * A router function.  Takes the raw source/target positions and user-defined
 * vertices, and returns an augmented list of waypoints (without source/target).
 * The connector class then converts these waypoints (plus source + target) into
 * `PathCommand[]` for rendering.
 *
 * @param from     - Source endpoint (world space).
 * @param to       - Target endpoint (world space).
 * @param vertices - User-supplied intermediate waypoints.
 * @param args     - Router-specific parameters.
 * @param ctx      - Read-only access to other shape bboxes (for obstacle avoidance).
 */
export type RouterFn = (
  from: Point,
  to: Point,
  vertices: Point[],
  args?: Record<string, unknown>,
  ctx?: RouterContext,
) => Point[];

/**
 * A connector function.  Takes a fully-routed list of points (source first,
 * target last) and returns `PathCommand[]` for rendering.
 *
 * @param points - Ordered point list starting at source and ending at target.
 * @param args   - Connector-specific parameters.
 */
export type ConnectorFn = (points: Point[], args?: Record<string, unknown>) => PathCommand[];

// ── Shared re-exports for shape authors ──────────────────────────────────────

export type { DrawStyle, PathStyle };

// ── Decoration specs (icons, badges, halo) ───────────────────────────────────

/**
 * An icon glyph drawn at a shape's centre (or a badge's centre).
 *
 * Three sources are supported:
 * - `'font'`    — codepoint string from an icon font (FontAwesome,
 *                 Material Symbols, etc.). Requires {@link IconSpec.fontFamily}
 *                 and the font to be loaded into the document.
 * - `'unicode'` — any string (emoji, single character).
 * - `'svg'`     — either a full `<svg>…</svg>` markup string (used as-is —
 *                 required for stroke-based libraries like Lucide) or a path
 *                 'd' attribute (wrapped in a 24×24 viewBox with fill=color).
 */
export interface IconSpec {
  type: 'font' | 'unicode' | 'svg';
  /** Codepoint, character, or SVG path data depending on {@link type}. */
  value: string;
  /** Render size in world-space pixels. Default depends on call site. */
  size?: number;
  /** Glyph or path color. Default: inherits from caller. */
  color?: string;
  /** Required when {@link type} is `'font'`. e.g. `'Font Awesome 6 Free'`. */
  fontFamily?: string;
  /** Optional font weight when {@link type} is `'font'`. */
  fontWeight?: string;
}

/**
 * One of the eight badge anchor positions on a shape's bounding box:
 * cardinal sides (`T`, `B`, `L`, `R`) and corners (`TL`, `TR`, `BL`, `BR`).
 */
export type BadgePosition =
  | 'T' | 'B' | 'L' | 'R'
  | 'TL' | 'TR' | 'BL' | 'BR';

/**
 * A small chip (text and/or icon) anchored to one of eight positions on a
 * shape's bounding box. Inspired by G6's badge system.
 */
export interface BadgeSpec {
  /** Anchor on the shape's bounding box. */
  position: BadgePosition;
  /** Badge text (e.g. `'A'`, `'Important'`, count). Mutually combinable with `icon`. */
  text?: string;
  /** Optional icon drawn inside the badge. */
  icon?: IconSpec;
  /** Background shape. Default `'pill'`. */
  shape?: 'pill' | 'circle' | 'rect';
  /** Background fill. Default `'#1f2937'`. */
  fill?: string;
  /** Background stroke. Default: no stroke. */
  stroke?: string;
  /** Background stroke width. Default 0. */
  strokeWidth?: number;
  /** Text/icon color. Default `'#ffffff'`. */
  textColor?: string;
  /** Font size for the text. Default 10. */
  fontSize?: number;
  /** Horizontal text padding. Default 6. */
  paddingX?: number;
  /** Vertical text padding. Default 3. */
  paddingY?: number;
  /** Outward gap (world px) from the bounding box edge. Default 4. */
  offset?: number;
}

/**
 * A halo is a soft outer ring drawn around a shape (or alongside an edge)
 * when one of {@link visibleStates} is active. Halos are drawn into a
 * separate `Graphics` underneath the body so they never affect hit-testing
 * or cause body-redraws.
 */
export interface HaloSpec {
  /** Halo color. Default `'#7c3aed'`. */
  color?: string;
  /** Ring thickness in world-space pixels. Default 6. */
  width?: number;
  /** Gap (world px) between the body edge and the inner halo edge. Default 2. */
  offset?: number;
  /** Halo alpha. Default 0.35. */
  alpha?: number;
  /**
   * State names that, when active, make the halo visible.
   * Default `['selected']`. Set to `[]` to disable.
   */
  visibleStates?: string[];
}

// ── Base specs ────────────────────────────────────────────────────────────────

/**
 * Base spec shared by all solid (closed/filled) shape elements.
 *
 * @remarks
 * `style` maps directly to {@link DrawStyle} from `graphics-utils`.
 * Per-state style overrides (`states`) are applied on top of the base style
 * whenever the corresponding state is active (e.g. `'hovered'`, `'selected'`).
 */
export interface BaseShapeSpec {
  /** Unique element id. */
  id: string;
  /** World-space x coordinate of the element's anchor (typically centre). */
  x: number;
  /** World-space y coordinate of the element's anchor. */
  y: number;
  /** Optional label shown at {@link LOD.DETAIL} zoom level. */
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
  /**
   * Optional icon drawn at the shape's centre (typically over the body fill).
   * Rendered at `LOD.SIMPLE` and above.
   */
  icon?: IconSpec;
  /**
   * Optional decorative chips anchored to the shape's bounding box.
   * Rendered at `LOD.DETAIL`.
   */
  badges?: BadgeSpec[];
  /**
   * Optional state-driven outer halo. When any state in
   * `halo.visibleStates` (default `['selected']`) is active, the halo is
   * drawn underneath the shape body.
   */
  halo?: HaloSpec;
}

/**
 * Base spec shared by all connector (path/routing) elements.
 *
 * @remarks
 * `style` maps directly to {@link PathStyle} from `graphics-utils`.
 * `from` / `to` are world-space endpoint positions. When used by `ShapesPlugin`
 * these will be the `getConnectionPoint()` results from the source/target shapes.
 *
 * The optional `router` and `connector` fields select named pipeline stages
 * registered on `ShapesPlugin`.  If omitted, the connector class's built-in
 * `route()` method is used as a combined router+connector.
 */
export interface BaseConnectorSpec {
  /** Unique element id. */
  id: string;
  /** Source endpoint in world space. */
  from: Point;
  /** Target endpoint in world space. */
  to: Point;
  /**
   * Intermediate waypoints.  Fed to the router before path generation.
   * `vertices` and `waypoints` are interchangeable; `vertices` takes precedence.
   */
  vertices?: Point[];
  /** @deprecated Use `vertices`. */
  waypoints?: Point[];
  /** Optional midpoint label shown at {@link LOD.DETAIL} zoom level. */
  label?: string;
  /** Stroke style. */
  style?: PathStyle;
  /**
   * Named router to run before the connector.
   * Short form: `router: 'orth'`.
   * Long form: `router: { name: 'orth', args: { padding: 20 } }`.
   * When omitted, the connector's own `route()` handles geometry.
   */
  router?: string | { name: string; args?: Record<string, unknown> };
  /**
   * Named connector fn to use instead of this class's built-in `route()`.
   * Rarely needed — most callers use different connector *classes* instead.
   */
  connector?: string | { name: string; args?: Record<string, unknown> };
  /**
   * Arrowhead at the source end.
   * `undefined` = no arrow.  Shorthand: `startMarker: 'circle'`.
   */
  startMarker?: string | ArrowSpec;
  /** @deprecated Use `startMarker`. */
  startArrow?: ArrowSpec;
  /**
   * Arrowhead at the target end.
   * Defaults to a small triangle when unset.  Shorthand: `endMarker: 'none'`.
   */
  endMarker?: string | ArrowSpec;
  /** @deprecated Use `endMarker`. */
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
  /**
   * Visible gap (world pixels) between the source perimeter and the start
   * arrow tip. Default `0` → tip sits exactly on the perimeter. Positive
   * pushes the arrow outward (toward the target).
   *
   * The line is automatically trimmed by the marker size on top of this, so
   * users only need to think about the *visible gap*, not the marker
   * geometry.
   */
  sourceOffset?: number;
  /**
   * Visible gap (world pixels) between the target perimeter and the end
   * arrow tip. Default `0` → tip sits exactly on the perimeter. Positive
   * pushes the arrow outward (toward the source).
   *
   * The line is automatically trimmed by the marker size on top of this.
   */
  targetOffset?: number;
  /**
   * Id of the source shape element.
   * When set, `from` is automatically computed via `getConnectionPoint()` at
   * add-time and kept in sync when the source element is dragged.
   */
  sourceId?: string;
  /**
   * Id of the target shape element.
   * When set, `to` is automatically computed via `getConnectionPoint()` at
   * add-time and kept in sync when the target element is dragged.
   */
  targetId?: string;
  /**
   * Outward-normal angle (radians) at the source attachment point.
   * Set automatically by ShapesPlugin when sourceId is resolved.
   * Used by curved connectors to align their initial control point with the
   * natural exit direction from the source node.
   */
  fromAngle?: number;
  /**
   * Outward-normal angle (radians) at the target attachment point.
   * Set automatically by ShapesPlugin when targetId is resolved.
   * Used by curved connectors to align their final control point with the
   * natural entry direction into the target node.
   */
  toAngle?: number;
  /**
   * Optional id of a named port on the source shape. When set, the
   * connector attaches at the port's anchor and the curve is oriented along
   * the port's outward normal. Falls through to ray-cast boundary attachment
   * when the source shape doesn't declare a port with this id.
   */
  sourcePortId?: string;
  /**
   * Optional id of a named port on the target shape. See {@link sourcePortId}.
   */
  targetPortId?: string;
  /**
   * Optional state-driven halo drawn underneath the connector path. When any
   * state in `halo.visibleStates` (default `['selected']`) is active, the
   * routed path is stroked once with `(strokeWidth + 2*(offset + width))` at
   * `halo.alpha` underneath the main stroke.
   */
  halo?: HaloSpec;
}

// ── Backward-compatibility aliases ───────────────────────────────────────────
// These allow existing code that uses BaseNodeSpec / BaseEdgeSpec to continue
// working when importing from @invana/plugins-shapes.

/** @deprecated Use {@link BaseShapeSpec} instead. */
export type BaseNodeSpec = BaseShapeSpec;

/** @deprecated Use {@link BaseConnectorSpec} instead. */
export type BaseEdgeSpec = BaseConnectorSpec;
