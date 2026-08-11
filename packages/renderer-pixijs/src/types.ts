/**
 * Public type surface for `primitives/`.
 *
 * Contracts for every shape, connector, decoration, marker, and router. This
 * module is the dependency root of the primitives package — implementation
 * files import from here, but this file imports nothing from sibling
 * `primitives/*` files (only from outside primitives: pixi, events,
 * `TextureRegistry`).
 *
 * Architecture: see `primitives-redesign-plan.md` (macro) and
 * `primitives-v0-plan.md` (this v0 slice) at the repo root.
 */


import type { Container, Graphics, IHitArea } from 'pixi.js';

import type { TextureRegistry } from './textures/TextureRegistry';
import type {
  BaseConnectorSpec,
  BaseShapeSpec,
  ConnectorPaintStyle,
  EffectTarget,
  Path,
  Point,
  Rect,
  ShapeLabelPlacement,
  ShapePaintStyle,
  StyleOverride,
  TransformDelta,
} from '@invana/canvas';

// ─── Spec vocabulary — re-exported for compatibility ───────────────────────
//
// The pixi-free half of this file now lives in `../specs`. It is re-exported
// here so existing importers keep working; new code should import from
// `@invana/canvas/specs` directly. See `docs/renderer-split-design.md` P0.
export type * from '@invana/canvas';

/**
 * The spec vocabulary this module both consumes and re-exports. A local
 * `import type` shadows the wildcard below, so these are named explicitly —
 * consumers importing them from here keep working after the package split.
 */
export type {
  BaseConnectorSpec,
  BaseShapeSpec,
  ConnectorPaintStyle,
  EffectTarget,
  Path,
  Point,
  Rect,
  ShapeLabelPlacement,
  ShapePaintStyle,
  StyleOverride,
  TransformDelta,
} from '@invana/canvas';


export interface ShapeHostInfo {
  readonly surface: Container;
  readonly textureRegistry: TextureRegistry;
  /**
   * Re-invoke the shape's `draw(currentSpec)`. Used by async fill loaders
   * (any `image` layer) to repaint once a texture resolves.
   */
  readonly requestRedraw: () => void;
}

/**
 * Information a `Connector` instance receives at construction. The connector
 * resolves marker shapes via the read-only shape registry, then invokes each
 * marker class's static `paintInto` to render the marker into the
 * connector's `Graphics`.
 */

export interface ConnectorHostInfo {
  readonly surface: Container;
  readonly shapeRegistry: ReadonlyMap<string, ShapeCtor>;
}

/**
 * Information a shape decoration receives in `mount` / `update`. Decorations
 * call `host.shape.paintInto(g, ...)` to repaint the host silhouette into
 * their own `Graphics` with style overrides — the entire shape ↔ decoration
 * contract.
 */

export interface ShapeDecorationHostInfo {
  readonly hostId: string;
  readonly slot: string;
  readonly slotZIndex: number;
  /** Local-space axis-aligned bounding box of the host shape. */
  readonly bounds: Rect;
  /** Surface to attach the decoration's `gfx` to. Set to the host shape's `gfx`. */
  readonly surface: Container;
  /** The host shape itself — decorations call `shape.paintInto(...)`. */
  readonly shape: IShape;
  /**
   * Max resting outer extent across every decoration attached to this host
   * (including this one — but most decorations contribute `0`, so it acts
   * like a sibling max in practice). Aggregated from each decoration's
   * `getOuterExtent()` by the renderer. The `LabelDecoration` reads this
   * to push outside-placement labels past the outermost ring / halo so
   * they don't collide.
   *
   * Animated transients (pulse-ring, ripple) contribute `0` by design —
   * labels stay anchored to the resting silhouette rather than tracking
   * the peak of an animation.
   */
  readonly outerDecorationExtent: number;
}

/**
 * Information a connector decoration receives. Decorations call
 * `host.connector.paintInto(g, spec, path, style)` for silhouette repaint,
 * or read `path` directly for parametric walking (e.g. label-along-path).
 */

export interface ConnectorDecorationHostInfo {
  readonly hostId: string;
  readonly slot: string;
  readonly slotZIndex: number;
  readonly path: Path;
  readonly surface: Container;
  readonly connector: IConnector;
  readonly connectorSpec: BaseConnectorSpec;
}

// ─── Primitive interfaces ──────────────────────────────────────────────────

/**
 * A 2D primitive with a closed silhouette (circle, rect, polygon, path).
 * Implementations typically extend `ShapeBase` (which provides `paintInto`,
 * fill/stroke resolution, and icon-layer plumbing for free); shapes whose
 * `draw` and `paintInto` differ (text, images-as-sprites) implement this
 * interface directly.
 */

export interface IShape<TSpec extends BaseShapeSpec = BaseShapeSpec> {
  /** Root display object — renderer adds/removes this on the host surface. */
  readonly gfx: Container;
  /** (Re)paint the shape from the current spec. Called on add and on update. */
  draw(spec: TSpec): void;
  /** Local-space axis-aligned bounding box for hit-testing & decorations. */
  bounds(): Rect;
  /**
   * Decoration entry point — repaint the silhouette into someone else's
   * `Graphics` with a style override. The shape uses its own current spec;
   * decorations don't pass one. (Distinct from `ShapeCtor.paintInto` —
   * the static method markers use, which takes an explicit spec + anchor.)
   *
   * Optional for back-compat: `TextShape` (and similar non-silhouette shapes)
   * may omit it. Decorations check for presence before calling and silently
   * skip when absent (text labels just won't have glow / halo applied).
   * Every shape that extends `ShapeBase` has it for free.
   */
  paintInto?(g: Graphics, style?: ShapePaintStyle): void;
  /**
   * Hit-test region for this shape in shape-local coordinates. Used by
   * `ShapeBase` to wire `gfx.hitArea` at construct time, and by
   * `PrimitivesRenderer.hitTest` as the **fallback** narrow phase for shape
   * kinds the pure spec geometry doesn't cover — i.e. kinds a consumer added
   * via `registerShape`. Built-in kinds are picked from the spec instead
   * (`containsSpec`), so picking works with no display object at all.
   *
   * The default `ShapeBase` implementation derives the region from
   * `drawGeometry` via `bodyGfx.containsPoint`, so the hit area always
   * matches the rendered silhouette + stroke. Custom shapes that want
   * spec-driven picking should register their geometry rather than override
   * this.
   */
  getHitArea(): IHitArea;
  /**
   * Optional precise containment in shape-local coordinates. Built-ins
   * delegate to the pure per-kind function in `specs/shapeGeometry/`, so a
   * caller holding an instance and a caller holding only a spec get the same
   * answer.
   */
  contains?(localX: number, localY: number): boolean;
  /**
   * Optional **sub-part** hit test in shape-local coordinates: returns the
   * `hitId` of the topmost interactive sub-part containing the point, or
   * `undefined`. Shapes composed of many addressable regions (e.g. a
   * {@link CompositeShape} card with `hitId`-tagged parts) implement this so
   * the renderer can emit `shape:partover` / `shape:partout`. Omit for atomic
   * shapes — the renderer simply won't emit part events for them.
   */
  hitTestPart?(localX: number, localY: number): string | undefined;
  /**
   * Optional — re-rasterise any **internal text** this shape mounts (e.g. a
   * {@link CompositeShape}'s `label` parts) at the given device resolution, so
   * it stays crisp when the camera zooms in. The renderer forwards its tracked
   * label resolution here on mount and whenever the label-resolution LOD
   * behaviour pushes a new value — the shape counterpart to a `LabelDecoration`'s
   * `setResolution`. Atomic shapes with no mounted text omit it.
   */
  setLabelResolution?(resolution: number): void;
  /**
   * Optional shape-local "visual centre" — the point inset-content layers
   * with `anchor: 'center'` snap to. Defaults to the AABB midpoint when
   * omitted, which is correct for `CircleShape` and `RectShape` (their
   * silhouette fills the AABB). Non-rectangular shapes — triangle, hexagon,
   * star, free-form polygon — override to return the geometric centroid
   * (typically the shape's local origin), so a glyph drawn on a triangle
   * sits on the visual centroid instead of floating above it.
   */
  visualCenter?(): Point;
  /**
   * Optional shape-local box a `label` decoration should anchor against for
   * the given `placement`, overriding the shape's AABB. Return `undefined`
   * to keep the default (the full AABB).
   *
   * This lets a shape with internal structure direct labels at the *region*
   * that placement names, rather than at the silhouette's outer box —
   * `TabbedRectShape` sends every `inside-*` placement into its tab, since
   * its body interior belongs to the content it frames. Because the
   * inside-placement inset is proportional to the anchor box, routing the
   * label to a small fixed region also decouples its position from how
   * large the rest of the shape grows.
   *
   * Applies to both the anchor math and the `inside-*` fit cascade, so a
   * label targeted at a sub-region is also budgeted against it.
   */
  labelAnchorBox?(placement: ShapeLabelPlacement): Rect | undefined;
  /**
   * Optional analytical boundary-intersection in shape-local coordinates,
   * **relative to the shape's geometric centre** (NOT its `(0, 0)` origin).
   * Returns the point on the silhouette where the ray from the centre to
   * `localFromCenter` exits — or `null` to defer to the AABB fallback.
   *
   * The centre-relative convention decouples anchor placement from each
   * shape's local-origin choice (`CircleShape` is centred at origin;
   * `RectShape` is anchored top-left). Shapes with non-rectangular
   * silhouettes (circle, ellipse, polygon) override; rect-like shapes fall
   * back to the centred-AABB ray-exit provided by `ShapeBase`.
   */
  boundaryIntersect?(localFromCenter: Point): Point | null;
  /**
   * Optional silhouette obstacle-test factory. Returns a world-space test
   * `(worldX, worldY, inflate) → boolean` that says whether a point lies
   * inside (or within `inflate` units of) the shape's silhouette. Called
   * by the renderer once per route to populate `Obstacle.containsInflated`.
   *
   * Shapes with non-rectangular silhouettes implement this for pixel-tight
   * routing (`CircleShape`: distance from centre ≤ radius + inflate;
   * `PolygonShape`: signed-distance to outline; etc.). Rect-like shapes
   * with an exact AABB silhouette can omit it — the inflated AABB is
   * already tight.
   *
   * The returned callable captures the shape's current spec; the renderer
   * re-invokes `obstacleTest()` on every route so movement is reflected.
   */
  obstacleTest?(): (worldX: number, worldY: number, inflate: number) => boolean;
  /** Optional LOD hook. Renderer forwards via `setLODLevel(id, level)`. */
  setLODLevel?(level: number): void;
  /** Optional label-rasterization hook. Only meaningful for text-bearing shapes. */
  setLabelResolution?(resolution: number): void;
  /**
   * Optional content-visibility hooks used by zoom-visibility LOD; the renderer
   * feature-detects each.
   * - `setInsetContentVisible` — flip inset icons (`glyph` / `svg` / `svg-url`)
   *   on/off (`ShapeBase`).
   * - `setImageFillVisible` — show/hide the silhouette `image` fill, repainting
   *   the body (`ShapeBase`).
   * - `setTextVisible` — show/hide the shape's **internal** text (e.g. a
   *   `CompositeShape`'s `label` parts). Simple shapes carry no internal text —
   *   their label is a `'label'` decoration handled by the renderer — so they
   *   omit this.
   */
  setInsetContentVisible?(visible: boolean): void;
  setImageFillVisible?(visible: boolean): void;
  setTextVisible?(visible: boolean): void;
  destroy(): void;
}

/**
 * A line-like primitive joining two endpoints, optionally passing through
 * waypoints. v0 has a single concrete `Connector` class; visual variation
 * comes from the router (which produces the `Path`).
 */

export interface IConnector<TSpec extends BaseConnectorSpec = BaseConnectorSpec> {
  readonly gfx: Container;
  /** (Re)paint the connector with a router-resolved `Path`. */
  draw(spec: TSpec, path: Path): void;
  /**
   * Repaint the connector's full silhouette (path + markers) into a
   * caller-supplied `Graphics` with style overrides. Connector decorations
   * use this to draw with pixel-identical silhouette coverage.
   */
  paintInto(g: Graphics, spec: TSpec, path: Path, style?: ConnectorPaintStyle): void;
  /**
   * Path trimmed by the source / target marker insets — i.e. the *visible*
   * body of the connector, with the segments that the markers cover removed.
   * Decorations that parameterise along arc length (ripple, fly-marker,
   * flow-particles, label-along-path, …) call this so `t = 1` lands at the
   * marker base rather than the marker tip (which sits inside the target
   * shape and hides the ripple's inner rings under the silhouette).
   * Returns the input path unchanged when no markers are configured.
   */
  getVisiblePath(spec: TSpec, path: Path): Path;
  /**
   * Toggle the body stroke without affecting markers or decoration children.
   * Body, source marker, and target marker live in three sibling Graphics
   * under `gfx`, so each can be hidden independently — used by a reveal
   * animation that owns the visible line and pops the ending marker in
   * when the reveal reaches it. The next `draw()` re-strokes the body but
   * preserves the hidden state.
   */
  setBodyVisible(visible: boolean): void;
  /** Toggle just the source-endpoint marker. See `setBodyVisible`. */
  setSourceMarkerVisible(visible: boolean): void;
  /** Toggle just the target-endpoint marker. See `setBodyVisible`. */
  setTargetMarkerVisible(visible: boolean): void;
  destroy(): void;
}

/**
 * Common base for shape and connector decorations. Presence of `tick` makes
 * the decoration animated — the renderer registers it into the per-frame
 * animation set; `tick` returns `true` to keep ticking, `false` to retire.
 * Static decorations omit `tick` and cost zero per frame after `mount`.
 */

export interface IDecorationBase<THostInfo, TStyle = unknown> {
  readonly style: TStyle;
  mount(host: THostInfo): void;
  update?(host: THostInfo): void;
  tick?(deltaMs: number): boolean;
  destroy?(): void;
  /**
   * Connector-only: declare how many pixels of extra "outer extent" this
   * decoration needs past each endpoint of the routed path. The renderer
   * aggregates the max across all attached decorations and trims the path
   * by that amount before drawing — so the body + markers sit back from
   * the anchor, and the decoration's outer edge (halo radius, ripple peak)
   * lands at the anchor instead of overshooting into the host shape.
   * Omit (or return 0) when the decoration doesn't extend past endpoints
   * (e.g. marching-ants strokes the line at the host's width).
   */
  getEndPadding?(): { readonly source: number; readonly target: number };
  /**
   * Shape-only: declare how many pixels past the host silhouette this
   * decoration paints **at rest**. The renderer aggregates the max across
   * sibling decorations and threads it through `ShapeDecorationHostInfo`
   * so the `LabelDecoration` can push outside-placement labels past the
   * outermost ring / halo instead of overlapping them.
   *
   * Return the resting (non-animated) outer edge — a `pulse-ring` whose
   * radius oscillates 0 → 24 → 0 should still report `0`, otherwise the
   * label would yo-yo with the pulse. Static decorations that overlay
   * the host silhouette directly (`marching-ants`, the label itself)
   * also return `0`. Omit entirely when irrelevant.
   */
  getOuterExtent?(): number;
}

export type IShapeDecoration<TStyle = unknown> = IDecorationBase<ShapeDecorationHostInfo, TStyle>;

export type IConnectorDecoration<TStyle = unknown> = IDecorationBase<ConnectorDecorationHostInfo, TStyle>;

// ─── Effects ───────────────────────────────────────────────────────────────

/**
 * What an effect modulates. Distinguishes effects that wiggle the host's
 * transform (shake, breathing, jiggle) from effects that override the host's
 * style channels (shimmer, fade-pulse, color-flash).
 *
 * Effects are NOT decorations. A decoration adds geometry alongside the host;
 * an effect modulates the host itself. Spec is untouched in either case — the
 * renderer applies the effect's contribution to the host's gfx each frame.
 */

export interface ShapeEffectHostInfo {
  readonly hostId: string;
  readonly slot: string;
  /** Local-space axis-aligned bounding box of the host shape. */
  readonly bounds: Rect;
  /** The host shape itself — effects may read shape state but never paint. */
  readonly shape: IShape;
}

/**
 * Common interface for shape and connector effects. Mirrors `IDecorationBase`
 * but reads modulations instead of drawing geometry. Animated effects expose
 * `tick(deltaMs)` (renderer advances them each frame); static effects omit it
 * and only contribute via `readTransform` / `readStyle`.
 *
 * An effect declares exactly one of:
 *  - `readTransform()` when `target === 'transform'`.
 *  - `readStyle()` when `target === 'style'`.
 * The renderer ignores whichever isn't relevant for the declared target.
 */

export interface IEffectBase<THostInfo, TStyle = unknown> {
  readonly target: EffectTarget;
  readonly style: TStyle;
  mount(host: THostInfo): void;
  update?(host: THostInfo): void;
  tick?(deltaMs: number): boolean;
  readTransform?(): TransformDelta;
  readStyle?(): StyleOverride;
  destroy?(): void;
}

export type IShapeEffect<TStyle = unknown> = IEffectBase<ShapeEffectHostInfo, TStyle>;

export type ShapeEffectCtor<TStyle = unknown> = new (style: TStyle) => IShapeEffect<TStyle>;

/**
 * Information a connector effect receives. Mirrors `ShapeEffectHostInfo` —
 * effects don't draw, so no `surface` field. The renderer reads the
 * effect's contribution every frame and applies the aggregate to the
 * connector's `gfx`. Connector effects only modulate style channels
 * (tint + alpha) — transform deltas on a 1D path-resolved primitive don't
 * have a coherent meaning, so they're ignored for connector hosts.
 */

export interface ConnectorEffectHostInfo {
  readonly hostId: string;
  readonly slot: string;
  /** The host connector itself — effects may read state but never paint. */
  readonly connector: IConnector;
}

export type IConnectorEffect<TStyle = unknown> = IEffectBase<ConnectorEffectHostInfo, TStyle>;

export type ConnectorEffectCtor<TStyle = unknown> =
  new (style: TStyle) => IConnectorEffect<TStyle>;

/** Same target taxonomy as decorations — effects may be shape-only, connector-only, or both. */

export interface ShapeCtor<TSpec extends BaseShapeSpec = BaseShapeSpec> {
  new (spec: TSpec, host: ShapeHostInfo): IShape<TSpec>;
  /**
   * Optional static paint surface for marker rendering. Connectors call
   * this to paint a marker at a polyline endpoint without instantiating
   * the shape. The spec's `x` / `y` are ignored — the caller supplies
   * position via `anchor`. When `style` is supplied, the shape's spec
   * colors are overridden (used by glow/halo to tint markers).
   *
   * `strokeWidth` is the host connector's resolved stroke width in pixels.
   * Marker shapes that scale with the line (e.g. `ArrowMarker` derives its
   * length and base width from multipliers × strokeWidth) read this. When
   * the shape is rendered standalone (not as a connector marker), pass `1`
   * or omit; the marker shape should fall back to a sensible default.
   */
  readonly paintInto?: (
    g: Graphics,
    spec: Omit<TSpec, 'x' | 'y'>,
    anchor: Point,
    angleRad: number,
    style?: ShapePaintStyle,
    strokeWidth?: number,
  ) => void;
  /**
   * Optional marker-inset reporter. When this shape is used as a connector
   * marker, returns how far back from the anchor (along the negative tangent)
   * the marker's "back edge" sits — i.e. how much the connector body must
   * be trimmed so it stops where the marker visually begins.
   *
   * For an arrow this is the tip-to-base length; for a circle / diamond /
   * square it would be the half-extent along the tangent. Shapes without a
   * meaningful back edge (or that should not affect line trimming) omit this
   * and the connector treats the inset as `0`.
   *
   * `strokeWidth` mirrors `paintInto` — markers that derive size from the
   * connector's stroke width (e.g. arrows with `lengthScale`) read it here
   * so the trim and the painted marker agree on geometry.
   */
  readonly markerInset?: (spec: Omit<TSpec, 'x' | 'y'>, strokeWidth?: number) => number;
  /**
   * Optional static AABB reporter. Returns the shape's bounding box in
   * *local* (centre-relative) coordinates — `spec.x` / `spec.y` are
   * ignored, so the same value can be reused for any positioned instance.
   *
   * Lets consumers (minimap footprint estimation, layouts that need node
   * sizes, label-collision pre-pass) query a registered shape's size from
   * the spec alone without instantiating the shape or its Pixi `Graphics`.
   * Shapes that don't implement this expose `undefined` from
   * {@link PrimitivesRenderer.boundsOfSpec}; consumers fall back to a
   * default size.
   *
   * Built-in shapes' instance `bounds()` delegates to this static so the
   * geometry isn't duplicated.
   */
  readonly boundsOf?: (spec: Omit<TSpec, 'x' | 'y'>) => Rect;
  /**
   * Optional uniform-scale operator. Returns a partial spec that resizes
   * the shape's geometry by `factor` while preserving its aspect ratio,
   * angular range, and any other shape-specific invariants. Paint
   * channels (`fill` / `stroke` / `alpha`) and position (`x` / `y`) are
   * not the shape's concern — callers compose them onto the result.
   *
   * The contract: `boundsOf(scaleSpec(spec, k)).width ==
   * boundsOf(spec).width * k` (likewise for height). I.e. uniform
   * scaling is exact for the AABB. Internal layout (a star's
   * inner/outer ratio, an arc's angular sweep, a polygon's vertex
   * topology) is preserved.
   *
   * Used by `NodeScaleLODBehaviour` to rewrite shape size as the camera
   * zooms, without switching over a closed kind enum. Shapes that don't
   * implement this expose `undefined` from
   * {@link PrimitivesRenderer.scaleShapeSpec}; the LOD behaviour skips
   * those nodes.
   */
  readonly scaleSpec?: (spec: Omit<TSpec, 'x' | 'y'>, factor: number) => Partial<TSpec>;
  /**
   * Optional **minimal form** operator — the smallest version of this
   * silhouette that still identifies it, as a partial spec to merge over the
   * original. `TabbedRectShape` returns a bodyless folder (its tab alone);
   * a shape with no meaningful reduced form omits this and callers keep the
   * spec as-is.
   *
   * Purely geometric, like {@link scaleSpec} — the shape decides what "as
   * small as this still reads" means for its own geometry, and knows nothing
   * about *why* a caller wants it. Container frames (`@invana/graph`'s group
   * nodes) use it to render a collapsed frame without switching over a closed
   * kind enum, so a shape registered at runtime via `registerShape` defines
   * its own collapsed look for free.
   *
   * Exposed to callers as {@link PrimitivesRenderer.collapsedShapeSpec}.
   */
  readonly collapsedOf?: (spec: Omit<TSpec, 'x' | 'y'>) => Partial<TSpec>;
  /**
   * Optional **fit-to-content** operator. Given the size of the content the
   * shape is carrying (a measured label, an image, …), returns the geometry
   * partial that accommodates it — `TabbedRectShape` widens its tab to the
   * title it holds.
   *
   * The split is deliberate: the **caller measures** (it owns the label and
   * the font resolution), the **shape decides** what that measurement does to
   * its geometry. So no caller needs to know that a folder has a tab, or how
   * padding and taper factor into its width.
   *
   * Exposed to callers as {@link PrimitivesRenderer.fitShapeSpecToContent}.
   */
  readonly fitToContent?: (
    spec: Omit<TSpec, 'x' | 'y'>,
    content: { readonly width: number; readonly height: number },
  ) => Partial<TSpec>;
}

export type ShapeDecorationCtor<TStyle = unknown> = new (style: TStyle) => IShapeDecoration<TStyle>;

export type ConnectorDecorationCtor<TStyle = unknown> = new (style: TStyle) => IConnectorDecoration<TStyle>;

export type { ElementEventMap as PrimitivesRendererEventMap } from '@invana/canvas';

// ─── Label primitives ──────────────────────────────────────────────────────

/**
 * One tag's worth of HTML-text style overrides. Mirrors a subset of Pixi
 * `HTMLTextStyle`. Used in `LabelHtmlContent.tagStyles` to restyle specific
 * tags (`<b>`, `<i>`, custom `<role>`, etc.) without affecting the base style.
 */
