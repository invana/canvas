/**
 * Public type surface for `ShapesRenderer`.
 *
 * Architecture: see `architecture-proposal.md` §2.6 (renderer / layer / behaviour
 * boundaries) and `decorations-plan.md` §2 (five primitives).
 *
 * `ShapesRenderer` is a fully generic, opinion-free drawing API. It exposes
 * five extensible primitives — `Shape`, `Connector`, `Marker`, `Router`,
 * `Decoration` — and knows nothing about graphs, ER, flowcharts, or any other
 * domain. The interfaces below are what each primitive implements; concrete
 * built-ins (circle/rect/halo/...) ship in sibling files.
 */

import type { Container } from 'pixi.js';
import type { EventMap } from '../events/EventEmitter';

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
  /** Source-side marker (registered marker kind). Optional. */
  readonly sourceMarker?: string;
  /** Target-side marker (registered marker kind). Optional. */
  readonly targetMarker?: string;
  /** Style overrides applied to the source-side marker. */
  readonly sourceMarkerOptions?: MarkerOptions;
  /** Style overrides applied to the target-side marker. */
  readonly targetMarkerOptions?: MarkerOptions;
  readonly zIndex?: number;
  readonly alpha?: number;
  readonly visible?: boolean;
}

export type ConnectorEndpointSpec =
  | { readonly kind: 'point'; readonly x: number; readonly y: number; readonly tangent?: Vec2 }
  | { readonly kind: 'shape'; readonly shapeId: string };

// ─── Host info (renderer → primitive) ──────────────────────────────────────

/**
 * Information a `Shape` instance receives at construction. The renderer hands
 * shapes the surface they should attach to plus camera access for any
 * resolution-aware drawing (e.g. text rasterisation).
 */
export interface ShapeHostInfo {
  /** Surface to attach the shape's root `Container` to. */
  readonly surface: Container;
}

/**
 * Information a `Connector` instance receives at construction. Same shape
 * as `ShapeHostInfo` but kept distinct so the type system records intent.
 */
export interface ConnectorHostInfo {
  readonly surface: Container;
}

/**
 * Host info for `IMarker` constructors. Markers attach as siblings of the
 * connector's gfx (rather than children) so a single marker style can be
 * reused across many connectors without nested transform inheritance — the
 * renderer drives marker position via `draw(anchor, tangent)` on each
 * connector update.
 */
export interface MarkerHostInfo {
  readonly surface: Container;
}

/** Common style fields markers consume. Markers may ignore unknown fields. */
export interface MarkerOptions {
  readonly color?: number;
  readonly size?: number;
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
  /** Slot the decoration is being mounted into (e.g. `'halo'`, `'border'`). */
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

export interface IConnector<TSpec extends BaseConnectorSpec = BaseConnectorSpec> {
  readonly gfx: Container;
  /** (Re)paint the connector with a router-resolved polyline. */
  draw(spec: TSpec, points: ReadonlyArray<Point>): void;
  destroy(): void;
}

export interface IMarker {
  readonly gfx: Container;
  /** Position the marker at `anchor`, oriented along `tangent` (unit vector). */
  draw(anchor: Point, tangent: Vec2): void;
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

export type ShapeCtor<TSpec extends BaseShapeSpec = BaseShapeSpec> = new (
  spec: TSpec,
  host: ShapeHostInfo,
) => IShape<TSpec>;

export type ConnectorCtor<TSpec extends BaseConnectorSpec = BaseConnectorSpec> = new (
  spec: TSpec,
  host: ConnectorHostInfo,
) => IConnector<TSpec>;

export type MarkerCtor = new (opts: MarkerOptions, host: MarkerHostInfo) => IMarker;

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
