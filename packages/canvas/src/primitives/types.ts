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

import type { Container, Graphics } from 'pixi.js';
import type { EventMap } from '../events/EventEmitter';
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

// ─── Path (router output, connector input) ─────────────────────────────────

/**
 * One step of a `Path`. Mirrors SVG path commands one-for-one:
 * - `M` move to absolute (x, y) — must be the first command of any Path.
 * - `L` line to (x, y) from the current point.
 * - `Q` quadratic Bézier with one control point.
 * - `C` cubic Bézier with two control points.
 *
 * No relative variants, no arcs, no shorthand — routers emit one of these
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
 * Router: a pure function `(source, target, waypoints?, opts?) → Path`.
 * Routers never touch pixi; trivially testable.
 *
 * `waypoints` is reserved for a future phase (the macro plan's Phase 5);
 * v0 routers accept the parameter but may ignore it.
 */
export type IRouter = (
  source: Endpoint,
  target: Endpoint,
  waypoints?: ReadonlyArray<Point>,
  opts?: Record<string, unknown>,
) => Path;

// ─── Fill ──────────────────────────────────────────────────────────────────

/**
 * Anchor positions for inset content layers (`glyph`, `svg`, `image-inset`).
 * Defaults to `'center'`. Use `'top-right'` etc. for corner-badge composition.
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
 * - **Silhouette fillers** (`solid`, `image`) — paint into the silhouette via
 *   Pixi's `g.fill()`. Multiple silhouette layers stack via alpha; each is
 *   re-traced before painting.
 * - **Inset content** (`glyph`, `svg`, `image-inset`) — mounted as Container
 *   children of the shape's `gfx`. Sized by `sizeRatio` (fraction of the
 *   smaller bounds dimension) and positioned by `anchor` (default `'center'`).
 *
 * The engine has no dedicated "icon" kind — icon-library specifics (Font
 * Awesome glyphs, Lucide SVGs, Fluent icons, …) are produced by developer
 * code and dropped into a `glyph` or `svg` layer directly.
 */
export type ShapeFillLayer =
  | { readonly kind: 'solid'; readonly color: number; readonly alpha?: number }
  | {
      readonly kind: 'image';
      readonly url: string;
      readonly alpha?: number;
      readonly fit?: 'fill' | 'cover' | 'contain' | 'none' | 'tile';
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
      /** Raster image inset (small logo on a plate, photo thumb on a card). */
      readonly kind: 'image-inset';
      readonly url: string;
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
}

export interface CircleSpec extends BaseShapeSpec {
  readonly kind: 'circle';
  readonly radius: number;
}

export interface RectSpec extends BaseShapeSpec {
  readonly kind: 'rect';
  readonly width: number;
  readonly height: number;
  readonly cornerRadius?: number;
}

/**
 * A marker spec is any registered shape spec **without** `x` / `y` — the
 * connector positions and orients the marker at the polyline endpoint.
 * Reuses the shape registry: there is no separate marker registry. The
 * shape's class must expose a static `paintInto` (see `ShapeCtor`).
 */
export type MarkerShapeSpec = Omit<BaseShapeSpec, 'x' | 'y'> & { readonly kind: string };

export type ConnectorEndpointSpec =
  | { readonly kind: 'point'; readonly x: number; readonly y: number; readonly tangent?: Vec2 }
  | { readonly kind: 'shape'; readonly shapeId: string };

export interface BaseConnectorSpec {
  readonly kind: string;
  readonly source: ConnectorEndpointSpec;
  readonly target: ConnectorEndpointSpec;
  /** Intermediate user-supplied points the router must respect. Optional. */
  readonly waypoints?: ReadonlyArray<Point>;
  /** Registered router kind. Default `'straight'`. */
  readonly router?: string;
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
  /** Optional precise containment in shape-local coordinates. */
  contains?(localX: number, localY: number): boolean;
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
}

export type IShapeDecoration<TStyle = unknown> = IDecorationBase<ShapeDecorationHostInfo, TStyle>;
export type IConnectorDecoration<TStyle = unknown> = IDecorationBase<ConnectorDecorationHostInfo, TStyle>;

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
  'shape:pointerdown':     { id: string; worldX: number; worldY: number; button: number };
  'shape:pointerup':       { id: string; worldX: number; worldY: number; button: number };
  'shape:click':           { id: string; worldX: number; worldY: number; button: number };
  'connector:pointerover': { id: string; worldX: number; worldY: number };
  'connector:pointerout':  { id: string; worldX: number; worldY: number };
  'connector:pointerdown': { id: string; worldX: number; worldY: number; button: number };
  'connector:pointerup':   { id: string; worldX: number; worldY: number; button: number };
  'connector:click':       { id: string; worldX: number; worldY: number; button: number };
}

// ─── Render stats ──────────────────────────────────────────────────────────

export interface RenderStats {
  readonly shapes: number;
  readonly connectors: number;
  readonly animatedDecorations: number;
}
