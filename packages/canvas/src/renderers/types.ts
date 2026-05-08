/**
 * Public type surface for `ShapesRenderer`.
 *
 * Architecture: see `architecture-proposal.md` §2.6 (renderer / layer / behaviour
 * boundaries) and `decorations-plan.md` §2 (five primitives).
 *
 * `ShapesRenderer` is a fully generic, opinion-free drawing API. It exposes
 * four extensible primitives — `Shape`, `Connector`, `Router`, `Decoration` —
 * and knows nothing about graphs, ER, flowcharts, or any other domain. Marker
 * arrowheads/dots/diamonds are not a separate primitive: they are shapes,
 * registered through `registerShape`, that expose a static `paintInto`. The
 * connector calls that static method to render the marker geometry directly
 * into the connector's Graphics so the path + markers are a single drawing.
 * The interfaces below are what each primitive implements; concrete
 * built-ins (circle/rect/halo/...) ship in sibling files.
 */

import type { Container, Graphics, Sprite, Texture } from 'pixi.js';
import type { EventMap } from '../events/EventEmitter';
import type { TextureRegistry } from './TextureRegistry';
import type { ConnectorPaintStyle } from '../draw/types';

export type { ConnectorPaintStyle };

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
  /** Optional unit tangent at the endpoint. Routers may use it (e.g. bezier). */
  readonly tangent?: Vec2;
}

// ─── Spec types (what callers pass to add/update) ──────────────────────────

/**
 * Common shape fields. Every shape spec extends this with its own
 * shape-specific `kind` discriminant + drawing fields.
 */
export interface BaseShapeSpec {
  /** Registered kind from `registerShape(kind, ...)`. */
  readonly kind: string;
  readonly x: number;
  readonly y: number;
  /**
   * Draw order within the shape layer. Higher = on top. Default `0`.
   * Used by hit-testing to resolve overlapping candidates.
   */
  readonly zIndex?: number;
  /** Per-instance opacity multiplier. Default `1`. */
  readonly alpha?: number;
  /** Hides the shape without removing it. Default `true`. */
  readonly visible?: boolean;
}

/**
 * A marker spec is any registered shape spec **without** `x`/`y` — the
 * connector positions and orients the marker at the polyline endpoint.
 * Reuses the shape registry (`registerShape`) — there is no separate marker
 * registry. The shape's constructor must expose a static `paintInto` for
 * the connector to paint it into the connector's Graphics.
 */
export type MarkerShapeSpec = Omit<BaseShapeSpec, 'x' | 'y'> & { readonly kind: string };

/**
 * Common connector fields. Every connector spec extends this with its own
 * `kind` discriminant + drawing fields. Endpoints may resolve to either raw
 * coordinates or another shape id (the renderer resolves shape-bound endpoints
 * on every router pass).
 */
export interface BaseConnectorSpec {
  readonly kind: string;
  readonly source: ConnectorEndpointSpec;
  readonly target: ConnectorEndpointSpec;
  /** Registered router kind. Default `'straight'`. */
  readonly router?: string;
  /**
   * Source-side marker. Any registered shape spec (e.g. polygon, circle,
   * path) painted at the source endpoint, oriented along the line tangent.
   * Use the `arrowMarkerSpec` / `circleMarkerSpec` / `squareMarkerSpec` /
   * `diamondMarkerSpec` builders from the renderer barrel for the common
   * cases.
   */
  readonly sourceMarker?: MarkerShapeSpec;
  /** Target-side marker. See `sourceMarker`. */
  readonly targetMarker?: MarkerShapeSpec;
  readonly zIndex?: number;
  readonly alpha?: number;
  readonly visible?: boolean;
}

export type ConnectorEndpointSpec =
  | { readonly kind: 'point'; readonly x: number; readonly y: number; readonly tangent?: Vec2 }
  | { readonly kind: 'shape'; readonly shapeId: string };

// ─── Sprite pool interface (for pool-aware shapes) ────────────────────────

/**
 * Minimal interface for a sprite pool, used by `ShapeHostInfo` so custom
 * shape implementations can participate in sprite pooling without a hard
 * dependency on the concrete `SpritePool` class (which is internal).
 */
export interface ISpritePool {
  acquire(url: string, texture: Texture): Sprite;
  release(url: string, sprite: Sprite): void;
}

// ─── Host info (renderer → primitive) ──────────────────────────────────────

/**
 * Information a `Shape` instance receives at construction. The renderer hands
 * shapes the surface they should attach to plus camera access for any
 * resolution-aware drawing (e.g. text rasterisation).
 *
 * `textureRegistry` and `spritePool` are optional engine internals. Shapes
 * that accept a `url` field in their spec use the registry for texture
 * resolution; shapes that create `Sprite` instances use the pool to avoid
 * GC churn at 500k+ scale. Shapes that don't need either can ignore them.
 */
export interface ShapeHostInfo {
  /** Surface to attach the shape's root `Container` to. */
  readonly surface: Container;
  /** Registry for URL-based texture lookup and lazy loading. */
  readonly textureRegistry?: TextureRegistry;
  /** Object pool for `Sprite` reuse — reduces GC pressure at scale. */
  readonly spritePool?: ISpritePool;
}

/**
 * Information a `Connector` instance receives at construction. The connector
 * gets a surface to attach to plus read-only access to the shape registry —
 * the latter is needed because connectors paint markers via the registered
 * shape constructors' static `paintInto` method (markers are shapes; there
 * is no separate marker registry).
 */
export interface ConnectorHostInfo {
  readonly surface: Container;
  /**
   * Read-only view of the renderer's shape registry. The connector looks up
   * a `ShapeCtor` by `spec.sourceMarker.kind` / `spec.targetMarker.kind` and
   * invokes its static `paintInto` to render the marker into the connector's
   * Graphics. Throws (clear error) if the marker's kind is not registered or
   * its ctor does not expose `paintInto`.
   */
  readonly shapeRegistry: ReadonlyMap<string, ShapeCtor>;
}

/**
 * Optional style override for `ShapeCtor.paintInto`. When supplied, the
 * shape's spec colour/alpha are ignored and the override is applied — used
 * by connector decorations to tint markers to match the decoration colour
 * (e.g. a glow paints the markers in the glow colour for unified silhouette
 * coverage).
 */
export interface ShapePaintStyle {
  readonly color?: number;
  readonly alpha?: number;
}

/**
 * Information a `Decoration` receives in `mount`/`update`. Carries the host's
 * current bounds plus the surfaces above and below the host's draw call,
 * used by the decoration to attach into the correct slot z-band.
 *
 * Connector decorations get the routed polyline as well; shape decorations
 * get the local-space AABB.
 */
export interface ShapeDecorationHostInfo {
  readonly hostId: string;
  /** Registered shape kind of the host (`'circle'`, `'rect'`, …). */
  readonly hostKind: string;
  /** Slot the decoration is being mounted into (e.g. `'halo'`, `'ring'`). */
  readonly slot: string;
  /** Local-space axis-aligned bounding box of the host shape. */
  readonly bounds: Rect;
  /**
   * Surface to attach the decoration's `gfx` to. Set to the host shape's
   * `gfx` Container so the decoration moves with the shape and draws in
   * shape-local coordinates. Has `sortableChildren = true` set; the
   * decoration should set its own `gfx.zIndex = slotZIndex` to land in the
   * correct z-band.
   */
  readonly surface: Container;
  /** Pre-computed z-index for the supplied slot. See SLOT_Z table in renderer. */
  readonly slotZIndex: number;
  /**
   * Closed outline polyline in shape-local coordinates. Present for `polygon`
   * and `path` hosts; absent for `circle`, `ellipse`, `rect`, `image`, `text`.
   * Decorations that trace outlines should use this instead of the AABB
   * fallback when available, so the decoration follows the actual shape geometry.
   */
  readonly outlinePolyline?: ReadonlyArray<{ readonly x: number; readonly y: number }>;
}

export interface ConnectorDecorationHostInfo {
  readonly hostId: string;
  readonly hostKind: string;
  readonly slot: string;
  /** Routed polyline — same points the connector draws between. */
  readonly polyline: ReadonlyArray<Point>;
  /** Connector-local surface (the connector's `gfx` Container). */
  readonly surface: Container;
  readonly slotZIndex: number;
  /**
   * The host connector instance. Decorations call `connector.paintInto(...)`
   * with style overrides to repaint the connector's full silhouette into
   * their own Graphics — see `ConnectorPaintStyle`. Decorations that need
   * polyline-only access can ignore this field.
   */
  readonly connector: IConnector;
  /** Current spec of the host connector — passed into `connector.paintInto`. */
  readonly connectorSpec: BaseConnectorSpec;
}

// ─── Primitive interfaces ──────────────────────────────────────────────────

export interface IShape<TSpec extends BaseShapeSpec = BaseShapeSpec> {
  /** Root display object — renderer adds/removes this on the host surface. */
  readonly gfx: Container;
  /** (Re)paint the shape from the current spec. Called on add and on update. */
  draw(spec: TSpec): void;
  /** Local-space axis-aligned bounding box used for hit-testing & decorations. */
  bounds(): Rect;
  /**
   * Optional precise containment test in local coordinates (i.e. coords
   * relative to `spec.x` / `spec.y`). The renderer first filters candidates
   * via the spatial index (bbox) and then calls `contains` for exact hit
   * resolution. If absent, the shape is considered hit anywhere inside its
   * bbox — a sensible default for rect / image / text. Round and polygon
   * primitives override.
   */
  contains?(localX: number, localY: number): boolean;
  /**
   * Optional LOD hook. The host Layer drives LOD policy (e.g. "hide labels
   * when zoomed out beyond 0.4×") and tells the renderer which level each
   * shape should occupy via `ShapesRenderer.setLODLevel(id, level)`. The
   * shape interprets the level any way it wants — hide / use a low-detail
   * geometry / drop the icon, etc.
   *
   * Convention used by the renderer's default fallback: `level === 0` means
   * "hide", `level >= 1` means "show at quality `level`". Shapes that
   * implement `setLODLevel` themselves override this default fully.
   */
  setLODLevel?(level: number): void;
  /**
   * Optional label-rasterisation hook. Only meaningful for text-bearing
   * shapes. The host Layer calls
   * `ShapesRenderer.rasteriseLabel(id, resolution)` when label sharpness
   * should change (e.g. on a meaningful zoom delta). Shapes without text
   * ignore this.
   */
  setLabelResolution?(resolution: number): void;
  destroy(): void;
}

// `ConnectorPaintStyle` lives in draw/types.ts (source of truth — connector
// decorations live in draw/). Re-exported at the top of this file alongside
// the other renderer-side imports so callers can pull it from this barrel.

export interface IConnector<TSpec extends BaseConnectorSpec = BaseConnectorSpec> {
  readonly gfx: Container;
  /** (Re)paint the connector with a router-resolved polyline. */
  draw(spec: TSpec, points: ReadonlyArray<Point>): void;
  /**
   * Repaint the connector's full silhouette (path + markers) into a
   * caller-supplied `Graphics` with style overrides. The caller has
   * `g.clear()`ed the Graphics before calling. Connector decorations use
   * this to draw with pixel-identical silhouette coverage — they never
   * re-derive geometry from the polyline.
   *
   * Optional for back-compat: third-party `IConnector` implementations
   * keep compiling without it; decorations check for presence and otherwise
   * fall back. Both built-ins (`line`, `curve`) implement it.
   */
  paintInto?(
    g: Graphics,
    spec: TSpec,
    points: ReadonlyArray<Point>,
    style: ConnectorPaintStyle,
  ): void;
  destroy(): void;
}

/**
 * A router is a pure function: endpoints in, polyline out. Implementations
 * never touch pixi — they're trivially testable and re-runnable per frame
 * (cheap enough for thousands of edges).
 */
export type IRouter = (
  source: Endpoint,
  target: Endpoint,
  opts?: Record<string, unknown>,
) => ReadonlyArray<Point>;

/**
 * Base for both shape and connector decorations. Presence of `tick` makes
 * the decoration animated and registers it into the renderer's per-frame
 * animation set; otherwise the decoration costs zero per frame after its
 * initial draw.
 *
 * `tick` returns `true` to keep ticking, `false` to retire (renderer drops
 * it from the animation set).
 */
export interface IDecorationBase<THostInfo, TStyle = unknown> {
  readonly style: TStyle;
  mount(host: THostInfo): void;
  update?(host: THostInfo): void;
  tick?(deltaMs: number): boolean;
  destroy?(): void;
}

export type IShapeDecoration<TStyle = unknown> = IDecorationBase<
  ShapeDecorationHostInfo,
  TStyle
>;

export type IConnectorDecoration<TStyle = unknown> = IDecorationBase<
  ConnectorDecorationHostInfo,
  TStyle
>;

// ─── Constructor / registry types ──────────────────────────────────────────

/**
 * Constructor type for shapes registered via `registerShape`. Optionally
 * exposes a static `paintInto` so the shape can also serve as a connector
 * marker — the connector calls `Ctor.paintInto(g, spec, anchor, angle)` to
 * paint the marker geometry into the connector's Graphics, oriented along
 * the polyline tangent. Shapes without `paintInto` are still valid for
 * `addShape` usage but cannot be used as markers.
 */
export interface ShapeCtor<TSpec extends BaseShapeSpec = BaseShapeSpec> {
  new (spec: TSpec, host: ShapeHostInfo): IShape<TSpec>;
  /**
   * Optional static paint function. Paints the spec's drawing fields into a
   * caller-supplied `Graphics`, anchored at `anchor` and rotated by
   * `angleRad` (radians) around it. The spec's `x` / `y` are ignored — the
   * caller (a connector) supplies position via `anchor`. When `style` is
   * supplied, the shape's spec colour/alpha are overridden.
   */
  readonly paintInto?: (
    g: Graphics,
    spec: Omit<TSpec, 'x' | 'y'>,
    anchor: Point,
    angleRad: number,
    style?: ShapePaintStyle,
  ) => void;
}

export type ConnectorCtor<TSpec extends BaseConnectorSpec = BaseConnectorSpec> = new (
  spec: TSpec,
  host: ConnectorHostInfo,
) => IConnector<TSpec>;

export type ShapeDecorationCtor<TStyle = unknown> = new (
  style: TStyle,
) => IShapeDecoration<TStyle>;

export type ConnectorDecorationCtor<TStyle = unknown> = new (
  style: TStyle,
) => IConnectorDecoration<TStyle>;

export type DecorationTarget = 'shape' | 'connector' | 'both';

export interface RegisterDecorationOptions {
  readonly target: DecorationTarget;
}

/** Caller-side payload for `setDecoration(id, slot, ...)`. */
export interface DecorationSpec<TStyle = unknown> {
  readonly kind: string;
  readonly style: TStyle;
}

// ─── Hit-test result ───────────────────────────────────────────────────────

export interface HitResult {
  readonly kind: 'shape' | 'connector';
  readonly id: string;
  /** Optional sub-region id (e.g. a connector handle, a shape sub-part). */
  readonly subId?: string;
}

// ─── Events emitted by the renderer ────────────────────────────────────────

/**
 * Raw, DOM-level events the renderer surfaces. No semantic interpretation —
 * they describe pointer hits on shapes / connectors and nothing more. Layers
 * translate them into domain events.
 */
export interface ShapesRendererEventMap extends EventMap {
  'shape:pointerover': { id: string; worldX: number; worldY: number };
  'shape:pointerout': { id: string; worldX: number; worldY: number };
  'shape:pointerdown': { id: string; worldX: number; worldY: number; button: number };
  'shape:pointerup': { id: string; worldX: number; worldY: number; button: number };
  'shape:click': { id: string; worldX: number; worldY: number; button: number };
  'connector:pointerover': { id: string; worldX: number; worldY: number };
  'connector:pointerout': { id: string; worldX: number; worldY: number };
  'connector:pointerdown': { id: string; worldX: number; worldY: number; button: number };
  'connector:pointerup': { id: string; worldX: number; worldY: number; button: number };
  'connector:click': { id: string; worldX: number; worldY: number; button: number };
}

// ─── Render stats (for devinfo + tests) ────────────────────────────────────

export interface RenderStats {
  readonly shapes: number;
  readonly connectors: number;
  readonly animatedDecorations: number;
}
