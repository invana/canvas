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
import type { EventMap } from '@invana/canvas-store';
import type { TextureRegistry } from '../textures/TextureRegistry';

// ─── Geometry primitives ───────────────────────────────────────────────────

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Endpoint anchor a router consumes — point + optional outgoing tangent. */
export interface Endpoint {
  readonly x: number;
  readonly y: number;
  readonly tangent?: Vec2;
}

// ─── Polyline (router output, pathStyle input) ─────────────────────────────

/**
 * Flat ordered list of points. Output of a `Router`; input to a `PathStyle`.
 * Also used as the densified form of a `Path` for hit-testing
 * (`samplePath(path)`).
 */
export type Polyline = ReadonlyArray<Point>;

// ─── Path (pathStyle output, connector input) ──────────────────────────────

/**
 * One step of a `Path`. Mirrors SVG path commands one-for-one:
 * - `M` move to absolute (x, y) — must be the first command of any Path.
 * - `L` line to (x, y) from the current point.
 * - `Q` quadratic Bézier with one control point.
 * - `C` cubic Bézier with two control points.
 *
 * No relative variants, no arcs, no shorthand — pathStyles emit one of these
 * four. Connector renders by walking the path and dispatching to Pixi's
 * `moveTo` / `lineTo` / `quadraticCurveTo` / `bezierCurveTo`.
 */
export type PathCommand =
  | { readonly kind: 'M'; readonly x: number; readonly y: number }
  | { readonly kind: 'L'; readonly x: number; readonly y: number }
  | { readonly kind: 'Q'; readonly cx: number; readonly cy: number; readonly x: number; readonly y: number }
  | { readonly kind: 'C'; readonly c1x: number; readonly c1y: number; readonly c2x: number; readonly c2y: number; readonly x: number; readonly y: number };

export type Path = ReadonlyArray<PathCommand>;

/**
 * Read-only scene context handed to routers that need awareness of other
 * shapes — primarily for obstacle-avoidance routing (`manhattan` and
 * friends). Simple geometric routers (`straight`, `orth`) ignore it.
 *
 * `obstacles` are world-space `Rect`s the router should not cross. Each
 * obstacle may also expose `containsInflated` for pixel-accurate silhouette
 * testing (e.g. circles route around their tangent, not their AABB).
 * The renderer auto-collects these from `shapeInstances` (excluding the
 * source/target shapes); callers can override or opt out via
 * `routerOpts.obstacles`.
 */
export interface RouterCtx {
  readonly obstacles: ReadonlyArray<Obstacle>;
}

/**
 * Obstacle handed to obstacle-aware routers. `Obstacle extends Rect` so any
 * `Rect[]` is assignable; the optional `containsInflated` callback unlocks
 * silhouette-tight routing for non-rect shapes (circles, polygons, paths).
 */
export interface Obstacle extends Rect {
  /**
   * Optional silhouette obstacle-test in world coordinates. Returns `true`
   * when `(worldX, worldY)` lies inside the obstacle's silhouette OR within
   * `inflate` world units of it.
   *
   * Routers use this for pixel-accurate marking — when present, the grid
   * blocks only cells that pass this test (in addition to the cheap AABB
   * pre-filter). When absent, the inflated AABB is the source of truth.
   *
   * Shapes opt in by overriding `IShape.obstacleTest`.
   */
  readonly containsInflated?: (worldX: number, worldY: number, inflate: number) => boolean;
}

/**
 * Router: a pure function `(source, target, waypoints?, opts?, ctx?) → Polyline`.
 *
 * Routers decide path **topology** — where bends sit. They emit a flat
 * polyline (Point[]); the visual style of segments between bend points is
 * decided by the downstream `PathStyle`. Routers never touch pixi.
 *
 * `waypoints` are intermediate user-supplied points the router should respect.
 * Built-in `straight` passes them through verbatim; topological routers
 * (orth, manhattan, …) anchor stair / corner segments to them.
 *
 * `ctx` is optional — only obstacle-aware routers consume it. The renderer
 * always passes a `RouterCtx`; routers that ignore it lose nothing.
 */
export type IRouter = (
  source: Endpoint,
  target: Endpoint,
  waypoints?: ReadonlyArray<Point>,
  opts?: Record<string, unknown>,
  ctx?: RouterCtx,
) => Polyline;

/**
 * Anchor-resolved endpoints handed to a pathStyle alongside the polyline.
 *
 * Tangent-aware pathStyles (`bump-horizontal`, …) read `source.tangent` /
 * `target.tangent` to place their Bézier handles along each shape's outward
 * surface normal, so the curve leaves and arrives flush with the silhouette
 * instead of in a hard-coded direction. Tangent-agnostic pathStyles (`normal`,
 * `rounded`, …) simply ignore the argument — it's optional and additive.
 */
export interface PathStyleEndpoints {
  readonly source: Endpoint;
  readonly target: Endpoint;
}

/**
 * PathStyle: a pure function `(polyline, opts?, endpoints?) → Path`.
 *
 * PathStyles decide visual **style** — how segments between polyline points
 * are drawn (sharp, rounded fillets, bezier-smoothed, single bezier A→B).
 * They never see the connector spec or shape context; pure geometric
 * transform.
 *
 * `endpoints` carries the anchor-resolved source/target (with `tangent`) so
 * tangent-aware styles can align Bézier handles with each shape's outward
 * normal. Optional — styles that don't need it ignore the argument and a
 * direct unit-test invocation (`bumpHorizontal(polyline)`) keeps working.
 *
 * Built-ins: `normal` (sharp), `rounded` (quadratic fillets at corners),
 * `smooth` (Catmull-Rom → cubic), `bezier` (single cubic with auto controls).
 */
export type IPathStyle = (
  polyline: Polyline,
  opts?: Record<string, unknown>,
  endpoints?: PathStyleEndpoints,
) => Path;

// ─── Fill ──────────────────────────────────────────────────────────────────

/**
 * Anchor positions for inset content layers (`glyph`, `svg`, `svg-url`).
 * Defaults to `'center'`. Use `'top-right'` etc. for corner-badge
 * composition.
 */
export type InsetAnchor =
  | 'center'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

/**
 * One layer of a shape's fill. Layers split by role:
 *
 * - **Silhouette fillers** (`solid`, `image`) — paint into the silhouette
 *   via Pixi's `g.fill()`. Multiple silhouette layers stack via alpha;
 *   each is re-traced before painting. Image fills always render the
 *   texture cover-fitted to the silhouette (uniform scale, may crop) —
 *   the engine intentionally does not expose CSS-style `background-size`
 *   / `background-repeat` knobs on raster fills.
 * - **Inset content** (`glyph`, `svg`, `svg-url`) — mounted as Container
 *   children of the shape's `gfx`. Sized by `sizeRatio` (fraction of the
 *   smaller bounds dimension) and positioned by `anchor` (default
 *   `'center'`).
 *
 * The engine has no dedicated "icon" kind — icon-library specifics (Font
 * Awesome glyphs, Lucide SVGs, Fluent icons, …) are produced by developer
 * code and dropped into a `glyph` or `svg` layer directly.
 */
export type ShapeFillLayer =
  | { readonly kind: 'solid'; readonly color: number; readonly alpha?: number }
  | {
      /**
       * Raster image painted into the host silhouette.
       *
       * Two orthogonal knobs control sizing:
       *
       * - `fit` (default `'cover'`) — how the texture's aspect maps to
       *   the silhouette's AABB. `'cover'` scales by `max(...)`, fully
       *   covers, may crop on the cross-axis. `'contain'` scales by
       *   `min(...)`, fully fits, leaves the cross-axis margin
       *   transparent (the underlying fill layer reads through; the
       *   engine pins the texture sampler to `clamp-to-edge` so the
       *   margin doesn't tile).
       *
       * - `padding` (default `0`) — pixel inset on the silhouette
       *   *before* fit math runs. The silhouette itself is re-traced at
       *   that inset for this layer only, so the gap between the
       *   full-size silhouette and the inset silhouette is painted by
       *   layers underneath (typically a `solid` `bgFill`). Use this
       *   when the host silhouette is more restrictive than its AABB
       *   (circle, polygon, star, arc) and the texture corners would
       *   otherwise clip against the curve.
       *
       * Tile patterns, repeat modes, and inset-Sprite badge placement
       * aren't on the engine surface — stack a `glyph` / `svg` /
       * `svg-url` layer for icon-shaped content.
       */
      readonly kind: 'image';
      readonly url: string;
      readonly alpha?: number;
      readonly fit?: 'cover' | 'contain';
      readonly padding?: number;
    }
  | {
      /** Font-rendered character (icon-font codepoint, Unicode symbol, emoji). */
      readonly kind: 'glyph';
      readonly char: string;
      /** Required for icon-font glyphs; optional for system-font Unicode. */
      readonly fontFamily?: string;
      /**
       * Font weight (CSS value, e.g. `400`, `900`, `'bold'`). Required for
       * icon fonts that pack different glyph sets per weight.
       */
      readonly fontWeight?: number | string;
      readonly fontStyle?: 'normal' | 'italic';
      /** Glyph color. Default `0xffffff`. */
      readonly color?: number;
      readonly alpha?: number;
      /** Size as fraction of the shape's smaller bounds dimension. Default `0.6`. */
      readonly sizeRatio?: number;
      /** Anchor relative to the shape's bounds. Default `'center'`. */
      readonly anchor?: InsetAnchor;
    }
  | {
      /** SVG path-d. Multiple subpaths (`M...M...`) are supported. */
      readonly kind: 'svg';
      readonly pathD: string;
      /** Viewport the path was authored in. Default `{ width: 24, height: 24 }`. */
      readonly viewBox?: { readonly width: number; readonly height: number };
      /** Stroke width when rendering. Default `2`. */
      readonly strokeWidth?: number;
      readonly color?: number;
      readonly alpha?: number;
      readonly sizeRatio?: number;
      readonly anchor?: InsetAnchor;
    }
  | {
      /**
       * Vector SVG icon fetched from a URL. The engine fetches the SVG,
       * extracts every drawing primitive (`path` / `ellipse` / `circle` /
       * `rect` / `line` / `polyline` / `polygon`) into a single concatenated
       * `pathD`, and renders it as a Pixi Graphics path. Fetched lazily on
       * first use; the resulting `pathD` is cached globally per URL.
       *
       * Use this when a consumer wants to point at their own remote SVG
       * (logo, custom diagram, sample artwork). For curated icon-library
       * usage, prefer an icon-font glyph via `kind: 'glyph'` — the
       * library is icon-vendor-agnostic and intentionally has no
       * vendor-specific fetch glue.
       */
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
 * A shape's fill. Either a single layer, an array of layers (painted
 * bottom-up — first array entry sits underneath), or the `number` shorthand
 * for a solid color.
 */
export type ShapeFill =
  | number
  | ShapeFillLayer
  | ReadonlyArray<ShapeFillLayer>;

// ─── Stroke (border) ───────────────────────────────────────────────────────

export interface ShapeStroke {
  readonly color: number;
  readonly alpha?: number;
  readonly width?: number;
  /** Default `'center'`. */
  readonly alignment?: 'inside' | 'center' | 'outside';
  readonly dashArray?: readonly [number, number];
  readonly dashOffset?: number;
  readonly cap?: 'butt' | 'round' | 'square';
  readonly join?: 'miter' | 'round' | 'bevel';
}

// ─── Paint styles (decoration → primitive override) ────────────────────────

/**
 * Decoration entry-point override on `IShape.paintInto`. When supplied, the
 * shape ignores `spec.fill` / `spec.stroke` and paints with these values
 * instead. Decorations like glow widen `strokeWidth` and reduce `alpha` to
 * paint a halo; decorations like marching-ants supply `dashArray` /
 * `dashOffset` to render a dashed silhouette; decorations like ring/halo
 * with non-zero `inset` ask the shape to trace a parallel-offset version of
 * its own silhouette.
 */
export interface ShapePaintStyle {
  readonly color?: number;
  readonly alpha?: number;
  readonly strokeWidth?: number;
  /**
   * Stroke alignment relative to the silhouette. Default `'outside'` —
   * decorations almost always want their geometry painted outside the
   * host body (halo, glow, ring), so the inner band doesn't eat into the
   * fill. Override per-call when a decoration genuinely wants to bleed
   * inward (e.g. an "inset border" effect).
   */
  readonly alignment?: 'inside' | 'center' | 'outside';
  /** Default `false` — decorations almost always stroke without filling. */
  readonly fill?: boolean;
  readonly dashArray?: readonly [number, number];
  readonly dashOffset?: number;
  /** Positive = inside the silhouette, negative = outside. Default `0`. */
  readonly inset?: number;
}

/** Mirror of `ShapePaintStyle` for connectors. No `inset` (connectors are 1D). */
export interface ConnectorPaintStyle {
  readonly color?: number;
  readonly alpha?: number;
  readonly strokeWidth?: number;
  readonly dashArray?: readonly [number, number];
  readonly dashOffset?: number;
  readonly cap?: 'butt' | 'round' | 'square';
  readonly join?: 'miter' | 'round' | 'bevel';
  /**
   * When `true`, markers paint with `color` / `alpha` instead of their own
   * spec colors. Glow / halo decorations use this so the decoration covers
   * path + markers as a unified silhouette; marching-ants leaves it
   * undefined so markers stay normal-colored over the dashed line.
   */
  readonly tintMarkers?: boolean;
  /**
   * When `true`, `paintInto` paints only the body (no source / target
   * markers). Useful for decorations that handle markers separately or
   * want to leave them untouched. `markerHalo` is preferred for glow /
   * halo coverage; reach for `skipMarkers` only when even outlined
   * markers would be wrong.
   */
  readonly skipMarkers?: boolean;
  /**
   * When `true`, markers paint as **outlines** at `style.strokeWidth`
   * (using `style.color` / `style.alpha`) instead of as filled silhouettes.
   * Marker geometry continues to size off the host connector's spec
   * stroke width — the halo width affects only the outline stroke, never
   * the marker's tip-to-base / wing-spread dimensions. Combined with the
   * widening-stroke / decreasing-alpha pattern of a glow decoration,
   * this produces a halo around the marker that matches the body halo.
   */
  readonly markerHalo?: boolean;
}

// ─── Spec types ────────────────────────────────────────────────────────────

export interface BaseShapeSpec {
  readonly kind: string;
  readonly x: number;
  readonly y: number;
  readonly fill?: ShapeFill;
  readonly stroke?: ShapeStroke;
  /** Default `0`. Higher = on top. Used for hit-test resolution. */
  readonly zIndex?: number;
  readonly alpha?: number;
  readonly visible?: boolean;
  /**
   * Container-level rotation in radians, applied around the shape's
   * top-left local origin. Composes with effect-driven transform deltas
   * — the effect aggregator writes `(spec.rotation ?? 0) + dRot` per frame
   * so connector-hosted badges with `autoRotate: true` keep rotating
   * smoothly even while a `shake` / `breathing` effect runs on top.
   *
   * For per-shape geometric rotation (the visible rotation of a regular
   * polygon's vertices, a star's points, etc.), use the kind-specific
   * `rotation` field on those shape specs — that one rotates the *geometry*
   * before it's drawn; this one rotates the *container* after.
   */
  readonly rotation?: number;
}

export interface CircleSpec extends BaseShapeSpec {
  readonly kind: 'circle';
  readonly radius: number;
}

/**
 * Filled / stroked ellipse, centred at `(x, y)` with independent horizontal /
 * vertical radii. A circle is the `radiusX === radiusY` special case; prefer
 * {@link CircleSpec} there (cheaper, uniform).
 */
export interface EllipseSpec extends BaseShapeSpec {
  readonly kind: 'ellipse';
  readonly radiusX: number;
  readonly radiusY: number;
}

export interface RectSpec extends BaseShapeSpec {
  readonly kind: 'rect';
  readonly width: number;
  readonly height: number;
  readonly cornerRadius?: number;
}

/**
 * Free-form polygon. `vertices` are centre-relative — the silhouette is
 * traced around the origin, then translated to `(x, y)`. Closed implicitly:
 * the last vertex connects back to the first. Use this for arbitrary
 * outlines (arrows, blobs, callouts). For regular n-gons or stars prefer
 * `RegularPolygonSpec` / `StarSpec` — they're cheaper to author.
 */
export interface PolygonSpec extends BaseShapeSpec {
  readonly kind: 'polygon';
  readonly vertices: ReadonlyArray<Point>;
}

/**
 * Regular n-gon centred at `(x, y)` with circum-radius `radius`. Covers
 * triangle (`sides: 3`), pentagon, hexagon (pointy-top by default — pass
 * `rotation: Math.PI / 6` for flat-top), octagon, etc. `rotation` is in
 * radians; positive rotates counter-clockwise in screen space.
 */
export interface RegularPolygonSpec extends BaseShapeSpec {
  readonly kind: 'regular-polygon';
  readonly sides: number;
  readonly radius: number;
  readonly rotation?: number;
}

/**
 * Annular sector centred at `(x, y)` between radii `innerR`/`outerR` and
 * angles `startAngle`/`endAngle` (radians). Angle convention: `0` is along
 * `+x` (3 o'clock); increasing values sweep clockwise on screen.
 *
 * Special cases:
 * - `innerR === 0` → pie slice.
 * - `endAngle - startAngle >= 2π` and `innerR > 0` → full annulus (ring).
 * - `endAngle - startAngle >= 2π` and `innerR === 0` → full disc (prefer
 *   `CircleSpec` for that case).
 *
 * The natural fit for sunburst / partition layouts where each node is an
 * arc-shaped region rather than a positioned dot. Pair with
 * `D3HierarchyLayout({ mode: 'sunburst' })`, which writes the four arc
 * parameters per node.
 */
export interface ArcSpec extends BaseShapeSpec {
  readonly kind: 'arc';
  readonly innerR: number;
  readonly outerR: number;
  readonly startAngle: number;
  readonly endAngle: number;
}

/**
 * Star centred at `(x, y)`, with `points` outer points alternating between
 * `outerRadius` and `innerRadius`. Classic 5-point star uses
 * `points: 5, outerRadius: r, innerRadius: r * 0.4`. `rotation` is in
 * radians; positive rotates counter-clockwise.
 */
export interface StarSpec extends BaseShapeSpec {
  readonly kind: 'star';
  readonly points: number;
  readonly innerRadius: number;
  readonly outerRadius: number;
  readonly rotation?: number;
}

/**
 * A marker spec is any registered shape spec **without** `x` / `y` — the
 * connector positions and orients the marker at the polyline endpoint.
 * Reuses the shape registry: there is no separate marker registry. The
 * shape's class must expose a static `paintInto` (see `ShapeCtor`).
 */
export type MarkerShapeSpec = Omit<BaseShapeSpec, 'x' | 'y'> & { readonly kind: string };

/**
 * Anchor selection for a `kind: 'shape'` connector endpoint. Resolves the
 * shape id to a concrete world-space `(x, y)` point on the shape — center of
 * the bounding box (`'center'`, default), perimeter intersection toward the
 * other endpoint (`'boundary'`), or any registered custom anchor.
 *
 * String shorthand picks an anchor by name with default opts; the object
 * form passes opts to the anchor function.
 */
export type AnchorSpec =
  | string
  | { readonly name: string; readonly opts?: Readonly<Record<string, unknown>> };

export type ConnectorEndpointSpec =
  | { readonly kind: 'point'; readonly x: number; readonly y: number; readonly tangent?: Vec2 }
  | {
      readonly kind: 'shape';
      readonly shapeId: string;
      readonly anchor?: AnchorSpec;
      /**
       * Outward offset applied AFTER the anchor resolves. The anchor's
       * returned `tangent` is treated as the outward direction; the endpoint
       * moves by `tangent * padding` world units before reaching the router.
       *
       * Use cases:
       * - Halo / glow decoration extends beyond the silhouette → set
       *   `padding` to the halo's outer radius so the connector visibly
       *   starts at the halo's edge, not at the shape's tight boundary.
       * - Visual breathing room around tightly packed shapes.
       *
       * No-op when the chosen anchor returns no tangent (e.g. `center`).
       * Negative values pull the endpoint INWARD; default `0`.
       */
      readonly padding?: number;
    };

/**
 * Read-only view of a shape that an anchor function consumes. The renderer
 * builds one of these for the referenced shape id and hands it to the
 * registered anchor. Anchors operate against this — they never see the live
 * `ShapeInstance` or `Pixi` objects.
 *
 * **Origin vs centre.** `origin` is the shape's spec position `(spec.x,
 * spec.y)` — this is the top-left for `RectShape`, the centre for
 * `CircleShape`, and shape-dependent for others. `center` is the geometric
 * centre of the bounding box in world space, computed by the renderer from
 * `origin` + `bounds`. Anchors should reference `center` (not `origin`) so
 * their behaviour is uniform across shape kinds.
 */
export interface AnchorShapeRef {
  /** World-space origin of the shape (`(spec.x, spec.y)`). */
  readonly origin: Point;
  /** Local-space axis-aligned bounding box (relative to `origin`). */
  readonly bounds: Rect;
  /** World-space geometric centre of the shape's bounding box. */
  readonly center: Point;
  /**
   * Optional analytical boundary-intersection in shape-local coordinates,
   * relative to the shape's geometric **centre** (not its `origin`).
   * Anchors fall back to a default centred-AABB ray-exit when this is
   * absent. `localFromCenter` is the other endpoint's offset from the
   * shape's centre.
   */
  boundaryIntersect?(localFromCenter: Point): Point | null;
}

export interface AnchorCtx {
  getShape(id: string): AnchorShapeRef | undefined;
}

/**
 * Anchor: a pure function that resolves a `kind: 'shape'` endpoint to a
 * concrete world-space point on the referenced shape.
 *
 * - `endpoint` carries the shape id and any per-call opts.
 * - `fromPoint` is the OTHER endpoint's first-pass world point — used by
 *   `boundary` to project a ray toward it. Anchors that don't need it
 *   (`center`) ignore it.
 * - The returned `Endpoint` may include an outward `tangent` hint; routers
 *   that respect it (`orthogonal`, `er`, …) prefer it over heuristics.
 */
export type IAnchor = (
  endpoint: { readonly shapeId: string; readonly opts?: Readonly<Record<string, unknown>> },
  fromPoint: Point,
  ctx: AnchorCtx,
) => Endpoint;

export interface BaseConnectorSpec {
  readonly kind: string;
  readonly source: ConnectorEndpointSpec;
  readonly target: ConnectorEndpointSpec;
  /** Intermediate user-supplied points the router must respect. Optional. */
  readonly waypoints?: ReadonlyArray<Point>;
  /** Registered router kind. Default `'straight'`. */
  readonly router?: string;
  /** Per-router options forwarded to the router fn's `opts` parameter. */
  readonly routerOpts?: Readonly<Record<string, unknown>>;
  /** Registered pathStyle kind. Default `'normal'`. */
  readonly pathStyle?: string;
  /** Per-pathStyle options forwarded to the pathStyle fn's `opts` parameter. */
  readonly pathStyleOpts?: Readonly<Record<string, unknown>>;
  /** Optional shape spec painted at the source endpoint, oriented along the path tangent. */
  readonly sourceMarker?: MarkerShapeSpec;
  /** Optional shape spec painted at the target endpoint, oriented along the path tangent. */
  readonly targetMarker?: MarkerShapeSpec;
  readonly stroke?: ShapeStroke;
  readonly zIndex?: number;
  readonly alpha?: number;
  readonly visible?: boolean;
}

// ─── Host info (renderer → primitive) ──────────────────────────────────────

/**
 * Information a `Shape` instance receives at construction. The renderer hands
 * shapes the surface to attach to plus the registries that fill resolution
 * needs (`textureRegistry` for image fills).
 */
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
   * `ShapeBase` to wire `gfx.hitArea` at construct time and by
   * `PrimitivesRenderer.hitTest` for the rbush-backed manual hit-test path.
   *
   * The default `ShapeBase` implementation derives the region from
   * `drawGeometry` via `bodyGfx.containsPoint`, so the hit area always
   * matches the rendered silhouette + stroke. Subclasses may override with
   * a cheaper analytical test (e.g. `CircleShape`: `x² + y² ≤ r²`).
   */
  getHitArea(): IHitArea;
  /** Optional precise containment in shape-local coordinates. */
  contains?(localX: number, localY: number): boolean;
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
export type EffectTarget = 'transform' | 'style';

/**
 * Per-frame transform contribution from a `target: 'transform'` effect. Each
 * field is optional and contributes additively (translations + rotation) or
 * multiplicatively (scale) when the renderer aggregates across all transform
 * effects attached to the same host. Omitted fields contribute the identity
 * (0 for additive, 1 for multiplicative).
 *
 * Coordinates are in the host shape's parent space (the renderer's world
 * container) so deltas read like "wiggle the shape 3px right" regardless of
 * the host's internal local origin.
 */
export interface TransformDelta {
  readonly dx?: number;
  readonly dy?: number;
  /** Rotation delta in radians. */
  readonly dRot?: number;
  /** Horizontal scale multiplier. Identity = 1. */
  readonly sx?: number;
  /** Vertical scale multiplier. Identity = 1. */
  readonly sy?: number;
}

/**
 * Per-frame style override from a `target: 'style'` effect. Channels are
 * merged across effects with last-writer-wins per channel (insertion order in
 * the host's effect map). Pixi's tint multiplies the underlying fill, so a
 * `tint` of `0xffffff` is the identity.
 */
export interface StyleOverride {
  /** Pixi tint (multiplicative). Identity = `0xffffff`. */
  readonly tint?: number;
  /** Multiplier on the host's current alpha. Identity = 1. */
  readonly alpha?: number;
}

/**
 * Information a shape effect receives in `mount` / `update`. No `surface`
 * field — effects don't draw, they modulate. The renderer applies the
 * effect's `readTransform` / `readStyle` output onto the host gfx each frame.
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
export type EffectTargetKind = 'shape' | 'connector' | 'both';

export interface RegisterEffectOptions {
  readonly target: EffectTargetKind;
}

/** Caller-side payload for `setEffect(id, slot, ...)`. */
export interface EffectSpec<TStyle = unknown> {
  readonly kind: string;
  readonly style: TStyle;
}

// ─── Constructor types ─────────────────────────────────────────────────────

/**
 * Constructor type for shapes registered via `registerShape`. Optionally
 * exposes a `static paintInto` so the shape can also serve as a connector
 * marker. Shapes without `paintInto` cannot be used as markers.
 */
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
   * Used by `NodeSizeLODBehaviour` to rewrite shape size as the camera
   * zooms, without switching over a closed kind enum. Shapes that don't
   * implement this expose `undefined` from
   * {@link PrimitivesRenderer.scaleShapeSpec}; the LOD behaviour skips
   * those nodes.
   */
  readonly scaleSpec?: (spec: Omit<TSpec, 'x' | 'y'>, factor: number) => Partial<TSpec>;
}

export type ShapeDecorationCtor<TStyle = unknown> = new (style: TStyle) => IShapeDecoration<TStyle>;
export type ConnectorDecorationCtor<TStyle = unknown> = new (style: TStyle) => IConnectorDecoration<TStyle>;

export type DecorationTarget = 'shape' | 'connector' | 'both';

export interface RegisterDecorationOptions {
  readonly target: DecorationTarget;
}

/** Caller-side payload for `setDecoration(id, slot, ...)`. */
export interface DecorationSpec<TStyle = unknown> {
  readonly kind: string;
  readonly style: TStyle;
}

// ─── Hit-test ──────────────────────────────────────────────────────────────

export interface HitResult {
  readonly kind: 'shape' | 'connector';
  readonly id: string;
  /** Optional sub-region (e.g. a connector handle, a shape sub-part). */
  readonly subId?: string;
}

// ─── Events emitted by the renderer ────────────────────────────────────────

/**
 * Raw, DOM-level events the `PrimitivesRenderer` surfaces. No semantic
 * interpretation — they describe pointer hits on shapes / connectors and
 * nothing more. Layers translate them into domain events.
 */
export interface PrimitivesRendererEventMap extends EventMap {
  'shape:pointerover':     { id: string; worldX: number; worldY: number };
  'shape:pointerout':      { id: string; worldX: number; worldY: number };
  'shape:pointerdown':     { id: string; worldX: number; worldY: number; button: number; pointerId: number };
  'shape:pointerup':       { id: string; worldX: number; worldY: number; button: number; pointerId: number };
  /** Left-button click. Right-button → `shape:contextmenu`. */
  'shape:click':           { id: string; worldX: number; worldY: number; button: number };
  'shape:doubleclick':     { id: string; worldX: number; worldY: number; button: number };
  'shape:contextmenu':     { id: string; worldX: number; worldY: number };
  'connector:pointerover': { id: string; worldX: number; worldY: number };
  'connector:pointerout':  { id: string; worldX: number; worldY: number };
  'connector:pointerdown': { id: string; worldX: number; worldY: number; button: number; pointerId: number };
  'connector:pointerup':   { id: string; worldX: number; worldY: number; button: number; pointerId: number };
  /** Left-button click. Right-button → `connector:contextmenu`. */
  'connector:click':       { id: string; worldX: number; worldY: number; button: number };
  'connector:doubleclick': { id: string; worldX: number; worldY: number; button: number };
  'connector:contextmenu': { id: string; worldX: number; worldY: number };
  /** Right-button release on empty canvas — no shape/connector was hit. */
  'background:contextmenu': { worldX: number; worldY: number };
}

// ─── Label primitives ──────────────────────────────────────────────────────

/**
 * One tag's worth of HTML-text style overrides. Mirrors a subset of Pixi
 * `HTMLTextStyle`. Used in `LabelHtmlContent.tagStyles` to restyle specific
 * tags (`<b>`, `<i>`, custom `<role>`, etc.) without affecting the base style.
 */
export interface HtmlTagStyle {
  readonly fontFamily?: string;
  readonly fontSize?: number | string;
  readonly fontWeight?: number | string;
  readonly fontStyle?: 'normal' | 'italic' | 'oblique';
  readonly fill?: number | string;
  readonly letterSpacing?: number;
  readonly textDecoration?: string;
}

/**
 * The visible content of a `LabelDecoration`. Two variants:
 *
 * - `'text'` — plain Pixi `Text`. Single style, fast, comfortable up to a few
 *   thousand visible labels. Supports wrap / maxLines / ellipsis via Pixi's
 *   built-in word-wrap plus a truncation pass.
 * - `'html-text'` — Pixi `HTMLText`. Inline tags (`<b>`, `<i>`, custom tags
 *   via `tagStyles`) and CSS overrides. Each instance rasterises HTML to a
 *   canvas, so this kind is suitable for tens to a couple hundred visible
 *   labels — not for graph-wide use.
 *
 * `bitmap-text` (Pixi `BitmapText`) is planned as a third kind for very-high-
 * density graphs; not in v0.
 */
export type LabelContent =
  | {
      readonly kind: 'text';
      readonly text: string;
      readonly fontFamily?: string;            // default 'sans-serif'
      readonly fontSize?: number;              // default 12 (px)
      readonly fontWeight?: number | string;   // default 400
      readonly fontStyle?: 'normal' | 'italic';
      readonly fontVariant?: 'normal' | 'small-caps';
      readonly letterSpacing?: number;
      readonly lineHeight?: number;
      /** Fill colour as hex. Default `0x111827` (near-black). */
      readonly fill?: number;
      readonly stroke?: { color: number; width: number };
      /** Drop shadow on text glyphs (distinct from background pill shadow). */
      readonly shadow?: {
        color: number;
        blur?: number;
        offsetX?: number;
        offsetY?: number;
        alpha?: number;
      };
      readonly alpha?: number;
      /** Horizontal alignment when wrap produces multiple lines. */
      readonly align?: 'left' | 'center' | 'right';
    }
  | {
      readonly kind: 'html-text';
      readonly html: string;
      /** Base style applied when no tag override matches. */
      readonly defaultFontFamily?: string;
      readonly defaultFontSize?: number;
      readonly defaultFill?: number | string;
      readonly defaultFontWeight?: number | string;
      /**
       * Fixed render width for `HTMLText`. Required for word-wrap; Pixi
       * `HTMLText` needs an explicit width to know when to break lines.
       */
      readonly width?: number;
      /**
       * Per-tag style overrides (e.g. `{ b: { fontWeight: 700 }, hl: { fill: '#facc15' } }`).
       * Custom tags are supported — Pixi forwards them to its tag stylesheet.
       */
      readonly tagStyles?: Readonly<Record<string, HtmlTagStyle>>;
      /**
       * Raw CSS rules injected as a `<style>` block before the HTML body —
       * useful for loading icon fonts or `@font-face` declarations referenced
       * by the inline HTML.
       */
      readonly cssOverrides?: ReadonlyArray<string>;
      readonly alpha?: number;
    };

/** Background pill drawn behind a label's text. Optional. */
export interface LabelBackground {
  readonly fill?: number;
  readonly fillAlpha?: number;             // default 1
  readonly stroke?: number;
  readonly strokeAlpha?: number;
  readonly strokeWidth?: number;           // default 1
  /** Uniform radius or per-corner [tl, tr, br, bl]. */
  readonly radius?: number | readonly [number, number, number, number];
  /** Uniform padding, [v,h], or [t,r,b,l]. */
  readonly padding?: number | readonly [number, number] | readonly [number, number, number, number];
  readonly shadow?: {
    color: number;
    blur?: number;
    offsetX?: number;
    offsetY?: number;
    alpha?: number;
  };
}

/** Wrap / overflow controls. Applies to both plain text and HTML text. */
export interface LabelWrap {
  /** Pixel cap on render width. Triggers word-wrap when set. */
  readonly maxWidth?: number;
  /**
   * Pixel cap on render height. Combined with the text's `lineHeight` (read
   * from `LabelContent.lineHeight` or derived from `fontSize`) to derive an
   * effective `maxLines = floor(maxHeight / lineHeight)`. If both `maxHeight`
   * and `maxLines` are set, the smaller (more restrictive) wins.
   */
  readonly maxHeight?: number;
  /** Cap on rendered lines; lines past this are dropped (after `overflow`). */
  readonly maxLines?: number;
  /** Enable wrap explicitly; auto-true when `maxWidth` is set. */
  readonly wordWrap?: boolean;
  /** Truncation policy for content past `maxLines`. Default `'ellipsis'`. */
  readonly overflow?: 'clip' | 'ellipsis';
}

/** Per-label LOD — hides the label outside the zoom range. */
export interface LabelVisibility {
  readonly minZoom?: number;
  readonly maxZoom?: number;
}

/**
 * Common style block shared by shape- and connector-anchored labels.
 * Placement / offset / rotation specifics live on the host-specific spec.
 */
export interface LabelStyleCommon {
  readonly content: LabelContent;
  readonly background?: LabelBackground;
  readonly wrap?: LabelWrap;
  /** Screen-space offset in pixels applied *after* any auto-rotation. */
  readonly offset?: { readonly x?: number; readonly y?: number };
  readonly alpha?: number;
  /** Per-label zoom-band LOD; the decoration mounts/unmounts on threshold. */
  readonly visibility?: LabelVisibility;
  /** Cursor on hover when the label container has hit-testing enabled. */
  readonly cursor?: string;
  /** Pointer events enabled on the label container. Default `false`. */
  readonly interactive?: boolean;
  /**
   * Read by `LabelCollisionBehaviour` only — the primitive ignores these.
   * `priority` higher wins ties when collision hides overlap. `collisionGroup`
   * partitions the collision graph (labels in different groups never compete).
   * `forceShow: true` bypasses collision entirely.
   */
  readonly priority?: number;
  readonly collisionGroup?: string;
  readonly forceShow?: boolean;
  /**
   * Floor used by the shrink → truncate → hide fit cascade when an
   * `inside-*` placement requires the label to stay inside the host shape.
   * Below this size, the cascade moves on to truncation (ellipsis) and
   * finally hide. Default `9` (px). Ignored for non-`inside-*` placements.
   */
  readonly minFontSize?: number;
}

/**
 * Placement options for a shape-anchored label.
 *
 * Two semantic groups distinguished by the `inside-` prefix:
 *
 * - **Anchor-only placements** — `'center'` plus the 8 outside sides /
 *   corners (`'top'`, `'top-right'`, ..., `'top-left'`). The label is
 *   positioned at the anchor and sized freely per `LabelWrap`; it may
 *   extend past the host shape's bounds.
 * - **Inside placements** (`'inside-*'`) — carry a *containment contract*:
 *   the label must stay inside the host shape's inner box. The decoration
 *   runs a shrink → truncate → hide fit cascade against the per-placement
 *   inner box to enforce this. Use these for sunburst wedges, treemap
 *   cells, pack circles — anywhere the label must not overflow.
 *
 * `'center'` and `'inside-center'` share the geometric anchor (shape
 * centre) but differ in containment: `'center'` may overflow, `'inside-center'`
 * may not. They are distinct values, not aliases.
 */
export type ShapeLabelPlacement =
  | 'center'
  | 'top' | 'top-right' | 'right' | 'bottom-right'
  | 'bottom' | 'bottom-left' | 'left' | 'top-left'
  | 'inside-top' | 'inside-top-right' | 'inside-right' | 'inside-bottom-right'
  | 'inside-bottom' | 'inside-bottom-left' | 'inside-left' | 'inside-top-left'
  | 'inside-center';

/** Style payload passed to `setDecoration(id, 'label', { kind: 'label', style })`. */
export interface ShapeLabelStyle extends LabelStyleCommon {
  /** Default `'bottom'`. */
  readonly placement?: ShapeLabelPlacement;
  /** Manual rotation in radians (rare — outside-side labels read upright). */
  readonly rotation?: number;
}

/**
 * Placement along a connector path. `'start' | 'center' | 'end'` map to t=0,
 * t=0.5, t=1; numeric `t` is treated literally and clamped to [0, 1].
 */
export type ConnectorLabelPlacement = 'start' | 'center' | 'end' | number;

/** Style payload for connector labels. */
export interface ConnectorLabelStyle extends LabelStyleCommon {
  /** Default `'center'`. */
  readonly placement?: ConnectorLabelPlacement;
  /**
   * Distance to shift along the path tangent, in pixels. Positive = toward
   * target; negative = toward source. Use this for "pad 24px from source".
   */
  readonly pathOffset?: number;
  /** Rotate the label so its baseline follows the path tangent. Default `true`. */
  readonly autoRotate?: boolean;
  /**
   * When `autoRotate` is on, flip the label by π if the tangent angle lies in
   * (π/2, 3π/2) — keeps reading direction upright. Default `true`.
   */
  readonly keepUpright?: boolean;
}

// ─── Render stats ──────────────────────────────────────────────────────────

export interface RenderStats {
  readonly shapes: number;
  readonly connectors: number;
  readonly animatedDecorations: number;
}
