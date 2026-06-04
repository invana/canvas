/**
 * `GraphLayer` public types — option shapes and per-node/per-edge render-spec
 * hints that map domain data to primitive specs.
 */
import type {
  ShapeLabelStyle,
  ConnectorLabelStyle,
  ShapeFill,
  ShapeLabelPlacement,
  ConnectorLabelPlacement,
  InsetAnchor,
} from '@invana/canvas';
import type { Point } from '@invana/canvas/primitives';
import type {
  RingDecorationStyle,
  GlowDecorationStyle,
  PulseRingDecorationStyle,
  MarchingAntsDecorationStyle,
  LiquidFillDecorationStyle,
  RingConnectorDecorationStyle,
  GlowConnectorDecorationStyle,
  MarchingAntsConnectorDecorationStyle,
  RippleConnectorDecorationStyle,
  FlyMarkerConnectorDecorationStyle,
  FlowParticlesConnectorDecorationStyle,
  RevealConnectorDecorationStyle,
  ToggleDecorationStyle,
  TogglePlacement,
  ResizeHandleDecorationStyle,
  SelectionFrameDecorationStyle,
} from '@invana/canvas/primitives';
import type { GraphEdge, GraphNode } from '../store/types';

/**
 * A field value that's either a static value or a function that derives the
 * value from the host item (node / edge / raw data).
 *
 * Used on every field of `NodeStyle` / `EdgeStyle` (via `ResolvableNodeStyle`
 * / `ResolvableEdgeStyle`) so callers can supply per-item-derived styling
 * on the layer template (`options.node.style`) or per-instance input
 * (`NodeInput.style`) without spreading hints into every node's `data`.
 *
 * Resolved per render (layer-level) or once at insert (per-input). Keep
 * resolvers cheap and pure — they may run per frame. Recursive returns
 * (a function returning another function) are not unwrapped — return the
 * final value.
 *
 * @example
 * ```ts
 * node: {
 *   style: {
 *     bgFill:    (n) => groupColors[(n.data as Group).group % groupColors.length],
 *     shape:     (n) => ({ kind: 'circle', radius: 12 + Math.sqrt((n.data as N).degree ?? 1) * 4 }),
 *     labelText: (n) => (n.data as N).name,
 *   },
 * }
 * ```
 */
export type Resolvable<T, I> = T | ((input: I) => T);

/** Convenience alias for id-resolvers; `D` is the raw data type on input. */
export type ResolvableId<D> = string | ((data: D) => string);

/**
 * Unwrap a {@link Resolvable} field for `input`. Static values pass through
 * untouched; function values are invoked once with `input` and their return
 * is used. Functions returning further functions are NOT unwrapped — return
 * the final value.
 */
export function resolveField<T, I>(
  v: Resolvable<T, I> | undefined,
  input: I,
): T | undefined {
  return typeof v === 'function' ? (v as (i: I) => T)(input) : v;
}

/** Path-style shortcut for an edge. Maps to the canvas router + pathStyle pair. */
export type EdgePathType =
  | 'straight'
  | 'bezier'
  | 'quadratic'
  | 'bump-radial'
  | 'bump-horizontal'
  | 'step-radial'
  | 'orth'
  | 'manhattan'
  | 'rounded'
  | 'smooth'
  | 'bundle'
  // Self-loop variants — use when `source === target`. Path geometry is
  // generated from `pathStyleOpts` (angle, radius/stubLength, width/gap)
  // anchored at the host node; the anchor/router pair is degenerate for a
  // self-edge so these styles ignore the polyline beyond its first point.
  | 'loop-curve'
  | 'loop-polyline';

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

/** Initial-load shape passed to `graphLayer.setData(data)`. */
export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
/**
 * Canonical interaction-state names with sensible defaults baked into the
 * GraphLayer's resolver. State styling lives on the layer-level
 * {@link NodeOption.state} / per-node {@link NodeData.state} catalogue —
 * `default` is intentionally absent (it's the absence of any active state,
 * not a state itself).
 *
 * The state-config map is open-keyed: consumers can declare additional
 * named states (e.g. `'pinned'`, `'flagged'`, `'error'`, `'focused'`)
 * directly on `options.node.state` / `node.state` with the same shape —
 * they compose via the same merge rules. The canonical set below is
 * deliberately small; reach for it only when the named driver applies.
 *
 * ### Driver → state map
 *
 * Each canonical state has a distinct *driver* (what causes the state to
 * be written) and *lifetime* (when it clears). The visual treatments
 * overlap (most are stroke rings of various colours), but the semantics
 * do not — a single node can carry several states simultaneously (e.g.
 * `selected + hover`) and a behaviour should only write the states it
 * owns.
 *
 * | State         | Driver                                    | Lifetime                          | Cardinality       |
 * | ------------- | ----------------------------------------- | --------------------------------- | ----------------- |
 * | `hovered`     | Mouse / touch pointer-over                | Transient — clears on pointer-out | ≤ 1 per layer     |
 * | `selected`    | Click / lasso / brush — user's chosen set | Sticky until explicitly cleared   | 0–N per layer     |
 * | `highlighted` | 1-hop neighbours of the hovered / selected | Transient — clears with the driver | 0–N per layer    |
 * | `dimmed`      | Complement of the focal-emphasis set      | Transient — clears with the driver | 0–N per layer    |
 * | `disabled`    | Data flag — "not interactive"             | Sticky — owned by the data feed   | 0–N per layer     |
 *
 * ### Sticky chosen set — `selected`
 *
 * `selected` is the click / lasso / brush state — what the user *chose*.
 * Persists until explicitly deselected. **Multi-select doesn't need its
 * own state**: it's just the same `selected` state applied to every
 * member of `selectedIds: Set<string>`. One node selected → one ring;
 * ten nodes selected → ten rings.
 *
 * `selected` can co-exist with `hovered` — clicking a node doesn't stop
 * it from being hovered.
 *
 * ### Focal-emphasis flow — `highlighted` + `dimmed`
 *
 * Written together by a focal-emphasis behaviour (typically driven by
 * hover or selection). When the user hovers / selects a node:
 * - its 1-hop neighbours go `highlighted` — *supporting cast*,
 * - everyone else goes `dimmed` — *pushed back so the focal set pops*.
 *
 * Both clear together when emphasis ends. Drop the pair if the product
 * never needs the "fade everyone except the focal subgraph" interaction.
 *
 * ### Data-driven — `disabled`
 *
 * Sticky and owned by the data feed (not by an interaction behaviour).
 * `disabled` is "this node isn't interactive — don't let the user pick
 * it". Visually overlaps `dimmed` but they're semantically distinct:
 * - `dimmed` says *"you're focusing elsewhere"* (transient, behaviour).
 * - `disabled` says *"you can't interact with me"* (sticky, data).
 * Conflating them would couple interaction code to data code — keep them
 * separate even if the visual treatment is similar.
 */
export type CanonicalStateName =
  /** Mouse / touch pointer is over the node. Transient; one node at a time. */
  | 'hovered'
  /** User's chosen set (click / lasso / brush). Sticky; many at a time. Multi-select is just this state applied to each member of the selection. */
  | 'selected'
  /** 1-hop neighbour of the hovered / selected focal — "supporting cast". Transient; cleared with the focal. */
  | 'highlighted'
  /** Complement of the focal-emphasis set — pushed back so `selected` + `highlighted` pop. Transient. NOT `disabled` — that's a data flag. */
  | 'dimmed'
  /** Data flag: "not interactive". Sticky; owned by the data feed. Visually similar to `dimmed` but semantically distinct (data, not interaction). */
  | 'disabled';

// ───────────────────────────────────────────────────────────────────────────
// v3 — G6-aligned types (NodeData / NodeInput / NodeOption + edge mirror)
// See `data-types-instances.md` + `data-types-implementation-plan.md`.
// ───────────────────────────────────────────────────────────────────────────

// ─── NodeShapeOptions (structural geometry, per-shape options) ─────────────

/** Rect-shape option. `cornerRadius` is optional; everything else required. */
export interface RectShapeOption {
  readonly kind: 'rect';
  readonly width: number;
  readonly height: number;
  readonly cornerRadius?: number;
}

/** Circle-shape option. */
export interface CircleShapeOption {
  readonly kind: 'circle';
  readonly radius: number;
}

/** Arc (annular sector) shape option. All four geometry params required. */
export interface ArcShapeOption {
  readonly kind: 'arc';
  readonly innerR: number;
  readonly outerR: number;
  readonly startAngle: number;
  readonly endAngle: number;
}

/**
 * Regular n-gon. With `rotation = 0` the first vertex points straight up, so
 * a triangle / pentagon / hexagon points up by default. Pass
 * `rotation: Math.PI / sides` for flat-top.
 */
export interface RegularPolygonShapeOption {
  readonly kind: 'regular-polygon';
  readonly sides: number;
  readonly radius: number;
  readonly rotation?: number;
}

/**
 * N-pointed star. Classic 5-point star uses
 * `{ points: 5, outerRadius: r, innerRadius: r * 0.4 }`.
 */
export interface StarShapeOption {
  readonly kind: 'star';
  readonly points: number;
  readonly innerRadius: number;
  readonly outerRadius: number;
  readonly rotation?: number;
}

/**
 * Free-form polygon. `vertices` are centre-relative — closed implicitly
 * (last vertex connects to first).
 */
export interface PolygonShapeOption {
  readonly kind: 'polygon';
  readonly vertices: ReadonlyArray<Point>;
}

/**
 * Escape-hatch variant for shape kinds registered at runtime via
 * `canvas.primitives.registerShape(name, ctor)`. The widened `kind` accepts
 * any string the type-checker can't match against a built-in variant;
 * additional spec params are erased at the type level but pass through to
 * the renderer untouched at runtime (the adapter spreads the whole shape
 * record into the spec).
 *
 * Authors of custom shapes typically declare a local interface
 * (`interface ChevronShapeOption { kind: 'chevron'; size: number }`) and
 * cast at the boundary (`style: { shape: chevron as NodeShapeOptions }`).
 * The index signature was deliberately omitted here so that discriminant
 * narrowing on the typed built-in variants (`shape.kind === 'rect'` →
 * `RectShapeOption`) keeps working everywhere else in the codebase.
 *
 * Built-in kinds (`'rect'`, `'circle'`, `'arc'`, `'regular-polygon'`,
 * `'star'`, `'polygon'`) are matched by the typed variants above before
 * this fallback applies.
 */
export interface CustomShapeOption {
  readonly kind: string & {};
}

/**
 * Closed union of the six shape kinds that `@invana/canvas` registers out
 * of the box. Exported so internal switch-narrowing sites can target it
 * directly via the {@link isBuiltInNodeShape} type guard.
 */
export type BuiltInNodeShapeOptions =
  | RectShapeOption
  | CircleShapeOption
  | ArcShapeOption
  | RegularPolygonShapeOption
  | StarShapeOption
  | PolygonShapeOption;

/**
 * Discriminated union of node shape options. The `kind` field enforces
 * per-variant required fields at compile time for the six built-in kinds
 * registered by `@invana/canvas`. {@link CustomShapeOption} provides an
 * open-keyed fallback for shapes registered at runtime by the consumer.
 *
 * Internal call sites that need to read variant-specific fields should
 * narrow via the {@link isBuiltInNodeShape} type guard first — the
 * open-keyed `CustomShapeOption.kind` prevents `switch (shape.kind)` over
 * literals from excluding the custom variant on its own.
 */
export type NodeShapeOptions = BuiltInNodeShapeOptions | CustomShapeOption;

/**
 * Type guard separating the typed built-in variants from
 * {@link CustomShapeOption}. Use this before reading variant-specific
 * fields so TypeScript narrows cleanly inside each `case`.
 */
export function isBuiltInNodeShape(
  shape: NodeShapeOptions,
): shape is BuiltInNodeShapeOptions {
  switch (shape.kind) {
    case 'rect':
    case 'circle':
    case 'arc':
    case 'regular-polygon':
    case 'star':
    case 'polygon':
      return true;
    default:
      return false;
  }
}

// ─── NodeIcon / NodeImage / NodeBadge / BadgePlacement ────────────────────

/**
 * Vector inset rendered inside a node's body — glyph (font codepoint), SVG
 * path, or SVG by URL. Kept structured (discriminated union) because each
 * kind carries different required params.
 */
export type NodeIcon =
  | {
      readonly kind: 'glyph';
      readonly char: string;
      readonly fontFamily?: string;
      readonly fontWeight?: number | string;
      readonly fontStyle?: 'normal' | 'italic';
      readonly color?: number;
      readonly alpha?: number;
      readonly sizeRatio?: number;
      readonly anchor?: InsetAnchor;
    }
  | {
      readonly kind: 'svg';
      readonly pathD: string;
      readonly viewBox?: { readonly width: number; readonly height: number };
      readonly strokeWidth?: number;
      readonly color?: number;
      readonly alpha?: number;
      readonly sizeRatio?: number;
      readonly anchor?: InsetAnchor;
    }
  | {
      readonly kind: 'svg-url';
      readonly url: string;
      readonly viewBox?: { readonly width: number; readonly height: number };
      readonly strokeWidth?: number;
      readonly color?: number;
      readonly alpha?: number;
      readonly sizeRatio?: number;
      readonly anchor?: InsetAnchor;
    };

/**
 * Raster image attached to a node. Mirrors the canvas-level `kind: 'image'`
 * `ShapeFillLayer` field-for-field. Two orthogonal sizing knobs:
 *
 * - `fit` (default `'cover'`) — `'cover'` scales by `max(...)` and fully
 *   covers the silhouette's AABB (may crop on the cross-axis);
 *   `'contain'` scales by `min(...)` and fully fits, leaving the
 *   cross-axis margin transparent (the underlying `bgFill` reads
 *   through; the texture sampler is pinned to `clamp-to-edge` so the
 *   margin doesn't tile).
 * - `padding` (default `0`) — pixel inset on the silhouette before fit
 *   math runs. The silhouette is re-traced at that inset for the image
 *   layer only, so the gap between full and inset silhouette paints
 *   from layers underneath (typically a `solid` `bgFill`). Useful when
 *   the host silhouette is more restrictive than its AABB (circle,
 *   polygon, star, arc) and texture corners would otherwise clip
 *   against the curve.
 */
export interface NodeImage {
  readonly url: string;
  readonly alpha?: number;
  readonly fit?: 'cover' | 'contain';
  readonly padding?: number;
}

/**
 * Anchor point on the host node where a badge attaches. The eight cardinal
 * names address the midpoints / corners of the host's axis-aligned bounding
 * box; the `{ x, y }` variant pins to an explicit world point and is rarely
 * needed (use {@link NodeBadge.offsetX} / `offsetY` to nudge an enum anchor
 * before reaching for raw coordinates).
 */
export type BadgePlacement =
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-left'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | { readonly x: number; readonly y: number };

/**
 * Point on the badge's own AABB that lands at the host anchor.
 *
 * - The eight cardinal names mirror {@link BadgePlacement} (without the
 *   custom `{x, y}` variant — origin is always a named point on the badge).
 * - `'center'` centres the badge on the host anchor — yields the classic
 *   "half-overhanging" notification-bubble look.
 *
 * When omitted, the projection defaults to the **mirror** of `placement`
 * (e.g. `placement: 'top-right'` → origin `'bottom-left'`) so the badge
 * sits fully outside the host edge.
 */
export type BadgeOrigin =
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-left'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'center';

/**
 * Host-modulation effects on a badge. Re-exports the {@link NodeEffects}
 * surface because a badge is rendered as a shape under the hood — the same
 * `shake` / `breathing` / future shape-effect kinds apply field-for-field.
 */
export type BadgeEffects = NodeEffects;

/**
 * Small overlay attached to a node — e.g. notification dot, count chip,
 * status indicator. A badge is rendered as a real shape, so it inherits the
 * full shape surface: any registered {@link NodeShapeOptions} kind as the
 * plate, optional {@link NodeIcon} as content, optional label text, plus
 * nested {@link decorations} / {@link effects} that compose exactly the way
 * they do on a node body.
 *
 * Position resolves from the host's AABB + the `placement` anchor + an
 * `origin` (which point of the badge sits at the anchor — defaults to the
 * mirror of `placement` so the badge nests fully outside the host edge).
 * Use `'center'` for the half-overhanging notification-bubble look.
 */
export interface NodeBadge {
  /**
   * Stable id within the node, for keyed updates / state-overlay diffing.
   * When omitted, identity falls back to the badge's position in the
   * containing `badges[]` array.
   */
  readonly id?: string;

  /** Anchor point on the host node's AABB, or an explicit world point. */
  readonly placement: BadgePlacement;

  /**
   * Which point of the badge's own AABB lands at the host anchor.
   * Default: mirror of `placement` (badge sits fully outside the host edge).
   * Use `'center'` for the half-overhanging look.
   */
  readonly origin?: BadgeOrigin;

  /**
   * Pure geometry — any registered {@link NodeShapeOptions} kind. Fill /
   * stroke / alpha come from the flat sugar fields below, mirroring the
   * `NodeStyle.shape` + `bgFill` split used for node bodies.
   */
  readonly shape: NodeShapeOptions;

  /** Solid plate colour — projects to the badge shape's first fill layer. */
  readonly fill?: number;
  readonly alpha?: number;
  readonly strokeColor?: number;
  readonly strokeWidth?: number;

  /**
   * Vector inset rendered inside the badge plate (glyph / svg / svg-url).
   * Projects to an extra fill layer stacked on top of the solid plate.
   */
  readonly icon?: NodeIcon;

  /**
   * Optional short text rendered centred on the badge (count "3", "!").
   * Projects to a `'label'` decoration on the badge.
   */
  readonly labelText?: string;
  readonly labelColor?: number;
  readonly labelFontSize?: number;

  /** Pixel offset applied after placement resolution. */
  readonly offsetX?: number;
  readonly offsetY?: number;

  readonly zIndex?: number;

  /**
   * Decorations attached to the badge plate. Each entry is a regular
   * {@link NodeDecorationSpec} — glow, ring, marching-ants, pulse-ring, etc.
   * Identity / merge rules match {@link NodeStyle.decorations} (id-keyed,
   * `remove: true` drops earlier same-id entries from base under a state
   * overlay).
   */
  readonly decorations?: readonly NodeDecorationSpec[];

  /**
   * Effects modulating the badge plate's transform / style each frame
   * (`shake`, `breathing`, …). Same surface as {@link NodeStyle.effects}.
   */
  readonly effects?: BadgeEffects;
}

/**
 * Anchor point along an edge's routed path.
 *
 * - `'start'` / `'end'` — anchored *near* the source / target endpoint with
 *   automatic clearance: the badge is shifted tangentially by its own
 *   half-extent so it kisses the endpoint node's silhouette from outside
 *   rather than half-overlapping it. The natural choice for endpoint
 *   chips, status icons, etc.
 * - `'middle'` — exact arc-length midpoint (`t = 0.5`).
 * - A `number` in `[0, 1]` — raw arc-length `t`, no clearance applied.
 *   Use `placement: 1` when you explicitly want a badge centred on the
 *   silhouette point. Values outside `[0, 1]` are clamped.
 *
 * `'middle'` (not `'center'`) avoids term-clashing with `BadgeOrigin`
 * where `'center'` means "centre the badge on its own AABB".
 */
export type EdgeBadgePlacement = 'start' | 'middle' | 'end' | number;

/**
 * Small overlay attached to an edge — e.g. flow-rate chip on the midpoint,
 * count badge at the source endpoint, arrow-tag at the target. A badge is
 * rendered as a real shape (any registered {@link NodeShapeOptions} kind);
 * placement is parametric along the routed path.
 *
 * Position resolves via `samplePathAt(path, t)` so the badge re-anchors
 * automatically when the path changes (source / target shape moves, anchor
 * / router / waypoints change). For loop edges, `'middle'` naturally lands
 * on the loop apex because the path passes through it at `t ≈ 0.5`.
 *
 * Decorations and effects compose exactly the way they do on
 * {@link NodeBadge}; the badge being shape-rendered means shape decorations
 * (`glow`, `ring`, `marching-ants`, `pulse-ring`, …) apply uniformly.
 */
export interface EdgeBadge {
  /**
   * Stable id within the edge, for keyed updates / state-overlay diffing.
   * When omitted, identity falls back to the badge's position in the
   * containing `badges[]` array.
   */
  readonly id?: string;

  /** Where along the routed path the badge attaches. */
  readonly placement: EdgeBadgePlacement;

  /**
   * Which point of the badge's own AABB lands at the path anchor.
   * Default for edge badges is `'center'` — the badge centres on the path
   * point. Use other origins to lift the badge off the line (e.g.
   * `origin: 'bottom'` puts the badge above the line with its bottom edge
   * touching the path).
   */
  readonly origin?: BadgeOrigin;

  /**
   * Pure geometry — any registered {@link NodeShapeOptions} kind. Fill /
   * stroke / alpha come from the flat sugar fields below, mirroring the
   * `NodeStyle.shape` + `bgFill` split used for node bodies.
   */
  readonly shape: NodeShapeOptions;

  /** Solid plate colour — projects to the badge shape's first fill layer. */
  readonly fill?: number;
  readonly alpha?: number;
  readonly strokeColor?: number;
  readonly strokeWidth?: number;

  /**
   * Vector inset rendered inside the badge plate (glyph / svg / svg-url).
   * Projects to an extra fill layer stacked on top of the solid plate.
   */
  readonly icon?: NodeIcon;

  /**
   * Optional short text rendered centred on the badge (count "3", "!").
   * Projects to a `'label'` decoration on the badge.
   */
  readonly labelText?: string;
  readonly labelColor?: number;
  readonly labelFontSize?: number;

  /**
   * Shift the path-anchor along the local tangent (positive = forward
   * toward `'end'`, negative = backward toward `'start'`). Useful for
   * nudging a `'middle'`-anchored badge sideways without changing `t`.
   */
  readonly pathOffset?: number;

  /** Pixel offset applied after placement resolution. */
  readonly offsetX?: number;
  readonly offsetY?: number;

  /**
   * When `true`, the badge rotates to follow the path tangent at the
   * anchor point. Default `false` (badges stay axis-aligned). Useful for
   * arrow-shaped or directional badges on curved edges.
   */
  readonly autoRotate?: boolean;

  /**
   * When {@link autoRotate} is `true`, flip the badge by 180° on the
   * "downward" half of the path so text decorations stay readable on
   * every edge orientation. Default `true`. Ignored when `autoRotate` is
   * `false`.
   */
  readonly keepUpright?: boolean;

  readonly zIndex?: number;

  /**
   * Decorations attached to the badge plate. Same surface as
   * {@link NodeBadge.decorations} — shape decorations (`glow`, `ring`,
   * `marching-ants`, `pulse-ring`) apply because the badge is itself a
   * shape, regardless of being hosted on a connector.
   */
  readonly decorations?: readonly NodeDecorationSpec[];

  /**
   * Effects modulating the badge plate's transform / style each frame
   * (`shake`, `breathing`, …). Same surface as
   * {@link NodeBadge.effects}.
   */
  readonly effects?: BadgeEffects;
}

// ─── NodeDecorationSpec / EdgeDecorationSpec / NodeEffects ────────────────

/**
 * Common fields on every entry in a `decorations[]` array. The `id` gives
 * stable diff identity (state overlays can re-declare the same id to
 * override, or set `remove: true` to drop a base-level decoration while a
 * state is active). When `id` is absent, identity falls back to `kind + array index`.
 */
export interface DecorationSpecCommon {
  /** Stable id for diffing. Optional — falls back to `kind#<index>` when absent. */
  readonly id?: string;
  /**
   * When `true`, this entry instructs the resolver to drop any earlier-
   * precedence decoration with the same `id`. Use it in a state overlay to
   * temporarily remove a base-level decoration while the state is active.
   */
  readonly remove?: boolean;
}

/**
 * Discriminated union of decoration specs attachable to a node via
 * {@link NodeStyle.decorations}. Each variant pairs `kind` (the registered
 * canvas decoration name) with the matching style payload from
 * `@invana/canvas/primitives`.
 *
 * Multiples are allowed — the same kind can appear several times (e.g. an
 * inner + outer ring on a single node), as long as their `id`s differ.
 * `label` is intentionally absent — labels are managed by the flat
 * `labelText` / `label*` fields on `NodeStyle`, not by the decorations
 * array.
 */
export type NodeDecorationSpec =
  | (DecorationSpecCommon & { readonly kind: 'ring' } & RingDecorationStyle)
  | (DecorationSpecCommon & { readonly kind: 'glow' } & GlowDecorationStyle)
  | (DecorationSpecCommon & { readonly kind: 'pulse-ring' } & PulseRingDecorationStyle)
  | (DecorationSpecCommon & { readonly kind: 'marching-ants' } & MarchingAntsDecorationStyle)
  | (DecorationSpecCommon & { readonly kind: 'liquid-fill' } & LiquidFillDecorationStyle)
  | (DecorationSpecCommon & { readonly kind: 'toggle' } & ToggleDecorationStyle)
  | (DecorationSpecCommon & { readonly kind: 'resize-handle' } & ResizeHandleDecorationStyle)
  | (DecorationSpecCommon & { readonly kind: 'selection-frame' } & SelectionFrameDecorationStyle);

/**
 * Discriminated union of decoration specs attachable to an edge via
 * {@link EdgeStyle.decorations}. Mirrors {@link NodeDecorationSpec} for
 * the connector-target decoration registry. `label-connector` is excluded
 * for the same reason `label` is — labels live on the flat label fields.
 */
export type EdgeDecorationSpec =
  | (DecorationSpecCommon & { readonly kind: 'ring-connector' } & RingConnectorDecorationStyle)
  | (DecorationSpecCommon & { readonly kind: 'glow-connector' } & GlowConnectorDecorationStyle)
  | (DecorationSpecCommon & { readonly kind: 'marching-ants-connector' } & MarchingAntsConnectorDecorationStyle)
  | (DecorationSpecCommon & { readonly kind: 'ripple-connector' } & RippleConnectorDecorationStyle)
  | (DecorationSpecCommon & { readonly kind: 'fly-marker-connector' } & FlyMarkerConnectorDecorationStyle)
  | (DecorationSpecCommon & { readonly kind: 'flow-particles-connector' } & FlowParticlesConnectorDecorationStyle)
  | (DecorationSpecCommon & { readonly kind: 'reveal-connector' } & RevealConnectorDecorationStyle);

/**
 * Host-modulation effects (sibling of decorations). Effects don't add
 * geometry — they modulate the host's transform (`shake`, `breathing`) or
 * style channels (tint/alpha). One spec per kind.
 */
export interface NodeEffects {
  readonly shake?: unknown | null;
  readonly breathing?: unknown | null;
  readonly [kind: string]: unknown | null | undefined;
}

// ─── GroupOptions ──────────────────────────────────────────────────────────

/**
 * Marks a node as a **compound group** — a visual frame drawn behind its
 * descendants (children point to it via `parentId`). The presence of this
 * field on a node's resolved {@link NodeStyle} is the only signal the layer
 * uses to decide whether to apply group semantics; the structural shape
 * (`style.shape`) stays a regular `rect` / `circle` / etc.
 *
 * Group semantics, in summary:
 *
 * - **Expanded state** (`collapsed !== true`):
 *   - The node renders behind its children (z-index pushed underneath when
 *     `behindChildren !== false`) and is **non-hittable** — pointer events
 *     pass through the frame to the canvas background. The frame is a pure
 *     drawing, not an interactive node.
 *   - With `autoFit: true`, the layer recomputes `width` / `height` (rect)
 *     or `radius` (circle) every flush from the children's bounding box,
 *     plus `padding` and optional `headerHeight`. The declared `width` /
 *     `height` / `radius` fields act as a **lower bound** in this mode.
 *   - With `autoFit: false`, the layer uses the declared `width` / `height`
 *     / `radius` literally; children may visually leak outside.
 *
 * - **Collapsed state** (`collapsed === true`):
 *   - The node renders as a normal interactive node (`hittable: true`,
 *     default z-order). All descendants are hidden from the renderer; edges
 *     pointing at a hidden descendant are re-routed to the nearest visible
 *     collapsed-group ancestor at render time (no mutation to the edge data).
 *   - The layer synthesises a count badge showing the number of hidden
 *     descendants. The `+`/`−` toggle is rendered via the
 *     {@link ToggleDecorationStyle} decoration on the group — wire up
 *     `CollapseExpandBehaviour` to make the toggle clickable.
 *
 * Nested groups fall out of the `parentId` chain for free: a group node
 * whose own `parentId` points at another group becomes a sub-group; the
 * recompute walks deepest-first.
 *
 * Membership uses the existing `GraphNode.parentId` (single hierarchy field
 * shared with tree structures) — no separate group-membership concept.
 */
export interface GroupOptions {
  /**
   * When `true`, the frame's size tracks the bounding box of its direct
   * children (computed every flush). When `false`, the declared `width` /
   * `height` / `radius` are used verbatim. Default `false`.
   */
  readonly autoFit?: boolean;
  /**
   * When `true`, `GroupResizeBehaviour` mounts corner / radial handle
   * decorations on this group and lets the user drag to resize. Composes
   * with `autoFit` per the floor rule on `width` / `height` / `radius`.
   * Default `false`.
   */
  readonly userResizable?: boolean;
  /** Inset around the children bbox before the frame outline. Default `16`. */
  readonly padding?: number;
  /**
   * True = render the group as a collapsed super-node (children hidden,
   * +/- toggle shows `+`, count badge shows the hidden descendant count).
   * Toggle through `CollapseExpandBehaviour` or by updating this field
   * directly via `store.updateNode`. Default `false`.
   */
  readonly collapsed?: boolean;
  /**
   * Frame renders at `style.zIndex − 1` so descendants paint on top. Set to
   * `false` to keep the frame at its declared z-index (and let descendants
   * paint underneath when their z-index is lower). Default `true`.
   */
  readonly behindChildren?: boolean;
  /**
   * Optional header band height (px) added above the children bbox. The
   * frame still draws as a single rect / circle — `headerHeight` only
   * shifts the auto-fit recompute so the label area at the top stays clear
   * of children. Default `0`.
   */
  readonly headerHeight?: number;
  /**
   * Floor (with `autoFit`) or fixed (without) width. Rect frames only.
   * Ignored for circle frames.
   */
  readonly width?: number;
  /** Sibling of {@link width} for `kind: 'rect'`. */
  readonly height?: number;
  /**
   * Floor (with `autoFit`) or fixed (without) radius. Circle frames only.
   * Ignored for rect frames.
   */
  readonly radius?: number;
  /**
   * Where the auto-attached `+` / `−` toggle sits relative to the group's
   * frame. Two forms:
   *
   * - **Keyword** — one of the {@link TogglePlacement} aliases
   *   (`'bottom'`, `'inside-bottom'`, `'top-right'`, `'bottom-left'`, …).
   *   Resolved against the host's AABB by the toggle decoration.
   * - **Shape-local coords** — `{ x, y }`, an absolute point inside the
   *   host shape's local frame (centre-relative for `circle`, top-left-
   *   relative for `rect`). Use this when none of the keywords place the
   *   toggle where you want it (diagonal offsets, mock-specific spots).
   *
   * Default `'bottom'` — centred just below the silhouette, matching the
   * "small bubble attached to the rim" pattern in the reference UI.
   * Clicks are dispatched at the canvas level by `CollapseExpandBehaviour`,
   * so the toggle remains clickable regardless of whether the resolved
   * position falls inside or outside the host's hit area.
   */
  readonly togglePlacement?: TogglePlacement | { readonly x: number; readonly y: number };
}

// ─── NodeStyle ─────────────────────────────────────────────────────────────

/**
 * Visual + structural style for a node. Flat-prefixed scalars for orthogonal
 * properties (`bgFill`, `bgStrokeWidth`, `labelColor`); polymorphic values
 * kept structured (`shape`, `icon`, `image`, `decorations`, `effects`,
 * `badges`).
 *
 * Per-instance state overlays for a node live at {@link NodeData.state}
 * (a sibling of `style`), NOT inside `NodeStyle`.
 */
export interface NodeStyle {
  // ===== Structural geometry =====
  readonly shape?: NodeShapeOptions;

  /**
   * Unified normalized size. When set, overrides the resolved `shape`'s
   * intrinsic size fields at style-resolution time (before the spec reaches
   * the renderer, `boundsOfNode`, or any layout's bounds query). Per-kind
   * mapping:
   *
   * - `circle` / `regular-polygon` — `shape.radius = size`
   * - `rect` — `shape.width = shape.height = 2 * size`
   * - `arc` — `shape.outerR = size` (and `shape.innerR` scaled so its ratio
   *   to `outerR` is preserved)
   * - `star` — `shape.outerRadius = size` (and `shape.innerRadius` scaled to
   *   preserve its ratio)
   * - `polygon` / custom — no canonical size axis; `size` is ignored
   *
   * Honoured uniformly by `boundsOfNode`, `D3ForceLayout` (collide.radius
   * receives the `GraphNode` and reads the normalized `shape.radius` via
   * `resolveNodeStyle`), and `ElkLayout` (reads bounds via `boundsOfNode`).
   * Use this when a single number should drive a node's footprint regardless
   * of which shape kind it renders as — e.g. degree-based sizing,
   * data-driven scaling.
   */
  readonly size?: number;

  /**
   * Marks this node as a compound group (visual frame drawn behind its
   * descendants). See {@link GroupOptions} for the full contract — autoFit
   * vs userResizable, expanded vs collapsed semantics, header band, edge
   * re-routing.
   *
   * Presence of this field is the only discriminator. The structural shape
   * (`shape: { kind: 'rect' | 'circle' }`) is unchanged; groups reuse the
   * same primitives as regular nodes.
   */
  readonly group?: GroupOptions;

  /**
   * When `true`, `NodeResizeBehaviour` mounts corner-handle decorations on
   * this node (rect / circle only) and lets the user drag to resize. The
   * drag writes back to `style.shape.width` / `height` / `radius` directly
   * (and `position` for non-corner-anchored rect drags). Independent from
   * `style.group?.userResizable`, which targets group frames specifically
   * — but both are honoured by the same behaviour, so a single registered
   * `NodeResizeBehaviour` handles every resizable node in the layer.
   */
  readonly resizable?: boolean;

  // ===== Background paint =====
  /**
   * Accepts every `ShapeFillLayer` kind — `solid` / `image` / `glyph` /
   * `svg` / `svg-url` — and arrays for stacked layers. The `image` kind
   * doubles as silhouette filler and inset content via its `fit` field
   * (`'inset'` vs the silhouette modes).
   */
  readonly bgFill?: ShapeFill;
  readonly bgAlpha?: number;
  readonly bgStrokeColor?: number;
  readonly bgStrokeAlpha?: number;
  readonly bgStrokeWidth?: number;
  readonly bgStrokeAlignment?: 'inside' | 'center' | 'outside';
  readonly bgStrokeDashArray?: readonly [number, number];
  readonly bgStrokeDashOffset?: number;
  readonly bgStrokeCap?: 'butt' | 'round' | 'square';
  readonly bgStrokeJoin?: 'miter' | 'round' | 'bevel';

  // ===== Icon / image insets =====
  readonly icon?: NodeIcon;
  readonly image?: NodeImage;

  // ===== Label =====
  readonly labelText?: string;
  readonly labelColor?: number;
  readonly labelFontSize?: number;
  readonly labelFontFamily?: string;
  readonly labelFontWeight?: number | string;
  readonly labelFontStyle?: 'normal' | 'italic';
  readonly labelAlign?: 'left' | 'center' | 'right';
  readonly labelLineHeight?: number;
  readonly labelLetterSpacing?: number;
  readonly labelPlacement?: ShapeLabelPlacement;
  readonly labelOffsetX?: number;
  readonly labelOffsetY?: number;
  readonly labelAlpha?: number;
  readonly labelMinFontSize?: number;
  /** Radians. */
  readonly labelRotation?: number;

  // ===== Label resolution / LOD / collision =====
  /** Hide the label below this camera zoom level. */
  readonly labelMinZoom?: number;
  /** Hide the label above this camera zoom level. */
  readonly labelMaxZoom?: number;
  /** Collision priority — higher wins when two labels overlap. */
  readonly labelPriority?: number;
  /** Collision partition — labels in different groups never compete. */
  readonly labelCollisionGroup?: string;
  /** Bypass collision entirely — label always renders. */
  readonly labelForceShow?: boolean;

  // Label background (flattened from ShapeLabelStyle.background)
  readonly labelBackgroundFill?: number;
  readonly labelBackgroundAlpha?: number;
  readonly labelBackgroundStrokeColor?: number;
  readonly labelBackgroundStrokeWidth?: number;
  readonly labelBackgroundPadding?: number;
  readonly labelBackgroundCornerRadius?: number;

  /**
   * Escape hatch — full `ShapeLabelStyle` payload from `@invana/canvas`.
   * Use this when the flat `label*` fields don't cover the case (wrap,
   * html-text content, custom collision settings, etc.). When set, the
   * adapter uses this payload verbatim instead of building one from the
   * flat fields. Flat label fields are ignored on the same node.
   */
  readonly labelStyle?: ShapeLabelStyle;

  // ===== Badges (multiple) =====
  readonly badges?: readonly NodeBadge[];

  // ===== Decorations (array of discriminated specs) =====
  /**
   * Ordered list of decorations attached to the node. Each entry's `kind`
   * names a registered canvas decoration; the rest of the entry is that
   * decoration's style payload. See {@link NodeDecorationSpec}.
   *
   * The resolver concatenates this array across base style + every active
   * state's overlay, then dedupes by `id` (later precedence wins). Use
   * `remove: true` in a higher-precedence overlay to drop an earlier entry
   * with the same id while a state is active.
   */
  readonly decorations?: readonly NodeDecorationSpec[];

  // ===== Effects (slot dict) — see NodeEffects =====
  readonly effects?: NodeEffects;
}

/**
 * Resolver-aware mirror of {@link NodeStyle}. Each field is either a static
 * value or `(D) => T`. Two scopes use this generic at different `D`:
 *
 *   - `NodeInput<D>.style` — resolvers fire at insert (`D` = raw node data).
 *   - `NodeOption.style` — resolvers fire at render (`D` = stored `GraphNode`).
 */
export type ResolvableNodeStyle<D = unknown> = {
  readonly [K in keyof NodeStyle]?: Resolvable<NonNullable<NodeStyle[K]>, D>;
};

// ─── NodeData / NodeInput / NodeOption ─────────────────────────────────────

/**
 * Per-instance node descriptor as stored by `GraphStore`. All values
 * concrete (no functions). Flat field layout matching G6's `NodeData`
 * convention.
 *
 * - `state` (singular) = per-instance overlay catalogue.
 * - `states` (plural) = currently-active state names.
 */
export interface NodeData<D = unknown> {
  readonly id: string;
  /** Type tag (free-form). Matches a `NodeOption` template if any. */
  readonly type?: string;
  readonly data?: D;
  readonly style?: NodeStyle;
  /** Per-instance overlay catalogue (singular `state`). */
  readonly state?: Readonly<Record<string, NodeStyle>>;
  /** Currently-active state names (plural `states`). */
  readonly states?: readonly string[] | null;
  // store-side concerns:
  readonly position?: { readonly x: number; readonly y: number };
  readonly pinned?: boolean;
  /**
   * Logical parent id — the only hierarchy field. Use this for both tree
   * structures AND group/combo membership (the parent is just a regular
   * node that visually represents the group). The store auto-maintains an
   * inverse index, queryable via `store.childrenOf(id)` /
   * `store.descendantsOf(id)`.
   */
  readonly parentId?: string;
}

/**
 * What the consumer passes to `GraphLayer.setData`. Same shape as
 * {@link NodeData} but with Resolvable fields — `id` and per-field styles
 * may be functions over `data`. Resolvers fire once at insert; the store
 * holds `NodeData`.
 */
export interface NodeInput<D = unknown> {
  readonly id?: ResolvableId<D>;
  readonly type?: string;
  readonly data?: D;
  readonly style?: ResolvableNodeStyle<D>;
  readonly state?: Readonly<Record<string, ResolvableNodeStyle<D>>>;
  readonly states?: readonly string[];
  readonly position?: { readonly x: number; readonly y: number };
  readonly pinned?: boolean;
  readonly parentId?: string;
}

/**
 * Layer-level node template — G6's `node` field on GraphOptions. Resolvers
 * fire every frame against the stored `GraphNode`.
 *
 * No `animation` field — per [[feedback_decoration_vs_animation]], animation
 * is the per-frame engine, not a node-level config. Decoration / effect
 * attachments live on `NodeStyle.decorations` / `NodeStyle.effects`.
 */
export interface NodeOption {
  /** Type tag this template defines (e.g. 'person', 'doc'). Optional. */
  readonly type?: string;
  readonly style?: ResolvableNodeStyle<GraphNode>;
  readonly state?: Readonly<Record<string, ResolvableNodeStyle<GraphNode>>>;
  /** Reserved for palette-driven theming. Deferred wiring. */
  readonly palette?: unknown;
}

// ─── Edge mirror ───────────────────────────────────────────────────────────

/** Arrowhead shape catalogue. */
export type ArrowShape = 'triangle' | 'diamond' | 'circle' | 'none';

/**
 * Structural variant of an edge — the three-stage connector pipeline
 * (anchor → router → pathStyle). Variant-specific params live inside
 * `pathStyleOpts`, so this stays non-discriminated.
 */
export interface EdgeShapeOptions {
  readonly pathType?: EdgePathType;
  readonly sourceAnchor?: EdgeAnchor;
  readonly targetAnchor?: EdgeAnchor;
  readonly sourceAnchorOpts?: Readonly<Record<string, unknown>>;
  readonly targetAnchorOpts?: Readonly<Record<string, unknown>>;
  readonly pathStyleOpts?: Readonly<Record<string, unknown>>;
  readonly waypoints?: ReadonlyArray<{ readonly x: number; readonly y: number }>;
}

/**
 * Flat-prefixed style bag for an edge. Edges have one stroke (the path), so
 * stroke fields are unprefixed. Arrow ends and label keep their distinct
 * prefixes.
 */
export interface EdgeStyle {
  // ===== Structural =====
  readonly shape?: EdgeShapeOptions;

  // ===== Path stroke =====
  readonly strokeColor?: number;
  readonly strokeAlpha?: number;
  readonly strokeWidth?: number;
  readonly strokeAlignment?: 'inside' | 'center' | 'outside';
  readonly strokeDashArray?: readonly [number, number];
  readonly strokeDashOffset?: number;
  readonly strokeCap?: 'butt' | 'round' | 'square';
  readonly strokeJoin?: 'miter' | 'round' | 'bevel';

  // ===== Arrows (two ends — flat prefix per end) =====
  readonly arrowSourceShape?: ArrowShape;
  readonly arrowSourceSize?: number;
  readonly arrowSourceColor?: number;
  readonly arrowSourceAlpha?: number;
  readonly arrowTargetShape?: ArrowShape;
  readonly arrowTargetSize?: number;
  readonly arrowTargetColor?: number;
  readonly arrowTargetAlpha?: number;

  // ===== Label =====
  readonly labelText?: string;
  readonly labelColor?: number;
  readonly labelFontSize?: number;
  readonly labelFontFamily?: string;
  readonly labelFontWeight?: number | string;
  readonly labelFontStyle?: 'normal' | 'italic';
  readonly labelAlign?: 'left' | 'center' | 'right';
  readonly labelLineHeight?: number;
  readonly labelLetterSpacing?: number;
  readonly labelPlacement?: ConnectorLabelPlacement;
  readonly labelPathOffset?: number;
  readonly labelAutoRotate?: boolean;
  readonly labelKeepUpright?: boolean;
  readonly labelOffsetX?: number;
  readonly labelOffsetY?: number;
  readonly labelAlpha?: number;
  readonly labelMinFontSize?: number;

  // ===== Label resolution / LOD / collision =====
  /** Hide the label below this camera zoom level. */
  readonly labelMinZoom?: number;
  /** Hide the label above this camera zoom level. */
  readonly labelMaxZoom?: number;
  /** Collision priority — higher wins when two labels overlap. */
  readonly labelPriority?: number;
  /** Collision partition — labels in different groups never compete. */
  readonly labelCollisionGroup?: string;
  /** Bypass collision entirely — label always renders. */
  readonly labelForceShow?: boolean;
  readonly labelBackgroundFill?: number;
  readonly labelBackgroundAlpha?: number;
  readonly labelBackgroundStrokeColor?: number;
  readonly labelBackgroundStrokeWidth?: number;
  readonly labelBackgroundPadding?: number;
  readonly labelBackgroundCornerRadius?: number;

  /**
   * Escape hatch — full `ConnectorLabelStyle` payload from `@invana/canvas`.
   * Use this when the flat `label*` fields don't cover the case (wrap,
   * html-text content, etc.). When set, the adapter uses this payload
   * verbatim instead of building one from the flat fields.
   */
  readonly labelStyle?: ConnectorLabelStyle;

  // ===== Decorations (array of discriminated specs) =====
  /**
   * Ordered list of decorations attached to the edge. Each entry's `kind`
   * names a registered canvas connector-decoration; the rest is that
   * decoration's style payload. See {@link EdgeDecorationSpec}.
   *
   * Resolver semantics match {@link NodeStyle.decorations}: concatenate
   * across base + active state overlays, dedupe by `id`, later precedence
   * wins.
   */
  readonly decorations?: readonly EdgeDecorationSpec[];

  // ===== Badges (multiple, along the routed path) =====
  /**
   * Ordered list of badges attached to the edge. Each entry is a real
   * {@link EdgeBadge} — any registered shape kind as the plate, optional
   * icon / labelText sugar, optional nested decorations and effects.
   * Placement is parametric along the routed path (`'start' | 'middle' |
   * 'end' | number`) and re-anchors automatically when the path changes
   * (source / target shape moves, anchor / router / waypoints change).
   *
   * Resolver semantics match {@link decorations}: concatenate across base
   * + active state overlays, dedupe by `id`, later precedence wins.
   */
  readonly badges?: readonly EdgeBadge[];
}

/** Resolver-aware mirror of {@link EdgeStyle}; generic over the resolver argument. */
export type ResolvableEdgeStyle<D = unknown> = {
  readonly [K in keyof EdgeStyle]?: Resolvable<NonNullable<EdgeStyle[K]>, D>;
};

/** Per-instance edge descriptor — stored by GraphStore, concrete values. */
export interface EdgeData<D = unknown> {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  /** Predicate / FK label. Free-form. G6 calls this `type`. */
  readonly type?: string;
  readonly data?: D;
  readonly style?: EdgeStyle;
  readonly state?: Readonly<Record<string, EdgeStyle>>;
  readonly states?: readonly string[] | null;
}

/** Resolver-aware input shape for an edge. */
export interface EdgeInput<D = unknown> {
  readonly id?: ResolvableId<D>;
  readonly source: string;
  readonly target: string;
  readonly type?: string;
  readonly data?: D;
  readonly style?: ResolvableEdgeStyle<D>;
  readonly state?: Readonly<Record<string, ResolvableEdgeStyle<D>>>;
  readonly states?: readonly string[];
}

/** Layer-level edge template — G6's `edge` field. */
export interface EdgeOption {
  readonly type?: string;
  readonly style?: ResolvableEdgeStyle<GraphEdge>;
  readonly state?: Readonly<Record<string, ResolvableEdgeStyle<GraphEdge>>>;
  readonly palette?: unknown;
}

// ─── Canonical state defaults ─────────────────────────────────────────────

/**
 * Canonical node-state overlays auto-merged into every `GraphLayer`'s
 * `options.node.state` catalogue on construction (unless
 * `GraphLayerOptions.useDefaultStates: false`). Consumer-supplied
 * `options.node.state[name]` entries override individual fields per the
 * normal merge precedence; this map provides the resting visual identity
 * of each canonical state so a layer that touches no state code still
 * gets a sensible hover / select / error ring out of the box.
 *
 * All values are flat NodeStyle fields — extending or overriding is the
 * same shape as any other layer-template state overlay. Decorations are
 * intentionally not declared here so consumers compose them additively
 * (e.g. a ring decoration on hover) without colliding with the canonical
 * stroke treatment below.
 */
export const DEFAULT_NODE_STATES: Readonly<Record<CanonicalStateName, NodeStyle>> = {
  // Hovered — detached white ring sitting 2px outside the body. Real
  // decoration (not a stroke) so it composes cleanly with `selected`'s
  // own ring + halo when both states are active simultaneously.
  hovered: {
    decorations: [
      { kind: 'ring', id: 'canonical-hover-ring', color: 0xffffff, width: 3, gap: 5, alpha: 1 },
    ],
  },
  // Click-selected — sharp ring outside the body plus a soft halo for
  // extra prominence. Ring sits at `gap: 7` with `width: 3`; halo extends
  // a further ~10px outward with quadratic alpha falloff (built into
  // `glow`). `id`s scope the slots so per-layer overlays can swap or
  // remove either independently.
  selected: {
    decorations: [
      { kind: 'ring', id: 'canonical-select-ring', color: 0xfacc15, width: 3, gap: 7, alpha: 1 },
      { kind: 'glow', id: 'canonical-select-halo', color: 0xfacc15, strokeWidth: 30, innerAlpha: 0.4, layers: 4 },
    ],
  },
  highlighted: {
        decorations: [
      { kind: 'ring', id: 'canonical-hover-ring', color: 0xfde68a, width: 3, gap: 5, alpha: 1 },
    ],
},
  dimmed:      { bgAlpha: 0.25 },
  disabled:    { bgFill: 0x9ca3af, bgAlpha: 0.6 },
};

/**
 * Canonical edge-state overlays — sibling of {@link DEFAULT_NODE_STATES}.
 * Auto-merged into every `GraphLayer`'s `options.edge.state` catalogue
 * unless `GraphLayerOptions.useDefaultStates: false`.
 */
export const DEFAULT_EDGE_STATES: Readonly<Record<CanonicalStateName, EdgeStyle>> = {
  hovered:     { strokeColor: 0x111827, strokeWidth: 3 },
  selected:    { strokeColor: 0xfacc15, strokeWidth: 3 },
  highlighted: { strokeColor: 0xfde68a, strokeWidth: 2 },
  dimmed:      { strokeAlpha: 0.2 },
  disabled:    { strokeColor: 0x9ca3af, strokeAlpha: 0.6, arrowTargetShape: 'none' },
};

// ─── GraphDataOptions ──────────────────────────────────────────────────────

/**
 * Top-level data input shape for `GraphLayer.setData(opts)`. Carries node /
 * edge inputs plus optional layer-wide id resolvers.
 */
export interface GraphDataOptions<DN = unknown, DE = unknown> {
  readonly nodes: readonly NodeInput<DN>[];
  readonly edges: readonly EdgeInput<DE>[];
  /** Optional layer-wide id resolver applied to nodes that lack an explicit `id`. */
  readonly nodeIdResolver?: (data: DN) => string;
  readonly edgeIdResolver?: (data: DE) => string;
}

/** Constructor options for `GraphLayer`. */
export interface GraphLayerOptions {
  /**
   * Optional pre-built store. If omitted, the layer creates its own with
   * default options (`flushMode: 'sync'`, `unknownEndpoint: 'throw'`). Pass
   * a store you own to share data with other layers / sync code.
   */
  store?: import('../store/GraphStore').GraphStore;

  /**
   * Layer-level node template (G6's `node` field). Carries `style` (base
   * appearance) and `state` (catalogue of named overlays applied while a
   * state in `node.states[]` is active). Resolver-aware: every field on
   * `style` / each `state[name]` may be a static value or a function
   * `(node: GraphNode) => value` that fires every render.
   */
  node?: NodeOption;

  /** Sibling of {@link node} for edges. */
  edge?: EdgeOption;

  /**
   * Auto-merge {@link DEFAULT_NODE_STATES} / {@link DEFAULT_EDGE_STATES}
   * into `options.node.state` / `options.edge.state` on construction so
   * every canonical state has a sensible default appearance even when the
   * consumer supplied no state overlays. Consumer entries win on a
   * per-name basis (no per-field deep merge here — declare a full
   * `NodeStyle` if you want to replace a default entry). Default `true`.
   */
  useDefaultStates?: boolean;

  /**
   * Minimum hover/click target in screen pixels, forwarded to the
   * internal `PrimitivesRenderer`. Default `6`.
   *
   * Behaves as a *fallback*: exact geometric hits always win; only
   * when no shape contains the cursor does the dispatcher pick the
   * closest candidate within `hitFloorPx` screen pixels. See
   * `PrimitivesRendererOptions.hitFloorPx` for details.
   */
  hitFloorPx?: number;
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
  /**
   * A user-driven node drag began. Behaviours emitting this signal the
   * intent to hold a node's position against any physics / layout that
   * would otherwise move it. Layouts (e.g. `D3ForceLayout`) subscribe and
   * apply a *transient* lock — they MUST NOT mutate the store's
   * `GraphNode.pinned` flag in response, since that is reserved for
   * user-data semantics (permanent pin). The matching `node:drag-end`
   * releases the transient lock.
   *
   * `nodeId` is the *grabbed* node (the gesture's primary). `nodeIds` is the
   * full set of primary nodes being dragged together — `[nodeId]` for a plain
   * single-node drag, or every selected node for a multi-selection drag. Group
   * descendants are NOT listed here; consumers that care about them expand via
   * `store.descendantsOf(id)`.
   */
  'node:drag-start': { nodeId: string; nodeIds: readonly string[] };
  'node:drag-end': { nodeId: string; nodeIds: readonly string[] };
  [event: string]: unknown;
}
