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
 * Discriminated union of node shape options. The `kind` field enforces
 * per-variant required fields at compile time (e.g., `kind: 'arc'`
 * requires `innerR`/`outerR`/`startAngle`/`endAngle`).
 */
export type NodeShapeOptions = RectShapeOption | CircleShapeOption | ArcShapeOption;

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

/** Raster image inset rendered inside a node's body. */
export interface NodeImage {
  readonly url: string;
  readonly alpha?: number;
  readonly sizeRatio?: number;
  readonly anchor?: InsetAnchor;
  readonly fit?: 'fill' | 'cover' | 'contain' | 'none' | 'tile';
}

/** Placement of a badge relative to its host node. */
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

/** Small overlay attached to a node — e.g. notification dot, count chip, status indicator. */
export interface NodeBadge {
  /** Stable id within the node, for keyed updates / animation. Optional. */
  readonly id?: string;
  readonly placement: BadgePlacement;
  /** Default `'circle'`. */
  readonly shape?: 'circle' | 'rect' | 'pill';
  /** Pixels — fixed visual size regardless of node scale. Default 12. */
  readonly size?: number;
  readonly fill?: number;
  readonly alpha?: number;
  readonly strokeColor?: number;
  readonly strokeWidth?: number;
  /** Optional vector inset rendered inside the badge. */
  readonly icon?: NodeIcon;
  /** Optional short text (e.g. count "3" or "!"). */
  readonly labelText?: string;
  readonly labelColor?: number;
  readonly labelFontSize?: number;
  readonly offsetX?: number;
  readonly offsetY?: number;
  readonly zIndex?: number;
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
  | (DecorationSpecCommon & { readonly kind: 'liquid-fill' } & LiquidFillDecorationStyle);

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

  // ===== Background paint =====
  /**
   * Accepts all six `ShapeFillLayer` kinds — `solid` / `image` / `glyph` /
   * `svg` / `svg-url` / `image-inset` — and arrays for stacked layers.
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
      { kind: 'glow', id: 'canonical-select-halo', color: 0xfacc15, radius: 30, innerAlpha: 0.4, layers: 4 },
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
