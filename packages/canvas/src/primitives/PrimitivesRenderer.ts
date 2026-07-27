/**
 * `PrimitivesRenderer` — domain-free drawing API for shapes, connectors,
 * markers, routers, and decorations.
 *
 * A Layer composes a `PrimitivesRenderer` internally and projects its state
 * into `addShape` / `addConnector` / `setDecoration` / ... calls. The
 * renderer is not a Layer and is never registered on `canvas.layers`. It
 * knows about pixels, hit-testing, and a camera; it knows nothing about
 * data, semantics, interactions, LOD policy, or label policy.
 *
 * **Five extensible registries**
 * - shapes      — `ShapeCtor`             (built-ins: circle, rect, arrow)
 * - routers     — `IRouter`               (built-ins: straight, orth, orthogonal,
 *                                          manhattan, metro, er, oneSide)
 * - pathStyles  — `IPathStyle`            (built-ins: normal, rounded, bezier, bump-radial, bump-horizontal, step-radial, smooth, bundle, loop-curve, loop-polyline)
 * - anchors     — `IAnchor`               (built-ins: center, boundary, perpendicular)
 * - decorations — shape / connector       (built-ins: glow)
 *
 * **No connector registry** — there is one concrete `Connector` class.
 * Visual variation comes from the (anchor → router → pathStyle) pipeline:
 * anchors resolve shape-id endpoints to concrete points (center / boundary),
 * routers produce a `Polyline` (topology — where bends sit), pathStyles
 * produce the final `Path` (visual style — how segments between bends are
 * drawn).
 *
 * **Lifecycle**
 *
 * Constructed by the host Layer in `onMount(ctx)`. The Layer passes
 * `this.container` (its own root pixi Container) and the canvas `Camera`.
 * On Layer unmount call `destroy()` first to clear internal bookkeeping
 * before the Layer's container is destroyed.
 */

import { Container, type FederatedPointerEvent } from 'pixi.js';
import type { Camera } from '../camera/Camera';
import { EventEmitter } from '@invana/canvas-store';
import { TextureRegistry } from '../textures/TextureRegistry';
import { HitIndex } from '../hit/HitIndex';
import { ShapeInstance } from '../instancing/ShapeInstance';
import { ConnectorInstance } from '../instancing/ConnectorInstance';
import { shapeSpecToSvg, connectorToSvg } from '../export/svgExport';
import { CircleShape } from './shapes/CircleShape';
import { EllipseShape } from './shapes/EllipseShape';
import { RectShape } from './shapes/RectShape';
import { TabbedRectShape } from './shapes/TabbedRectShape';
import { PolygonShape } from './shapes/PolygonShape';
import { RegularPolygonShape } from './shapes/RegularPolygonShape';
import { StarShape } from './shapes/StarShape';
import { ArcShape } from './shapes/ArcShape';
import { CompositeShape } from './shapes/CompositeShape';
import { measureLabelContent } from './paint/labelContent';
import { Connector } from './connectors/Connector';
import { straightRouter } from './connectors/routers/straight';
import { orthRouter } from './connectors/routers/orth';
import { manhattanRouter } from './connectors/routers/manhattan';
import { metroRouter } from './connectors/routers/metro';
import { erRouter } from './connectors/routers/er';
import { oneSideRouter } from './connectors/routers/oneSide';
import { normalPathStyle } from './connectors/pathStyles/normal';
import { roundedPathStyle } from './connectors/pathStyles/rounded';
import { bezierPathStyle } from './connectors/pathStyles/bezier';
import { bumpRadialPathStyle } from './connectors/pathStyles/bumpRadial';
import { bumpHorizontalPathStyle } from './connectors/pathStyles/bumpHorizontal';
import { bundlePathStyle } from './connectors/pathStyles/bundle';
import { stepRadialPathStyle } from './connectors/pathStyles/stepRadial';
import { smoothPathStyle } from './connectors/pathStyles/smooth';
import { quadraticPathStyle } from './connectors/pathStyles/quadratic';
import { loopCurvePathStyle } from './connectors/pathStyles/loopCurve';
import { loopPolylinePathStyle } from './connectors/pathStyles/loopPolyline';
import { centerAnchor } from './connectors/anchors/center';
import { boundaryAnchor } from './connectors/anchors/boundary';
import { perpendicularAnchor } from './connectors/anchors/perpendicular';
import { edgePortAnchor } from './connectors/anchors/edgePort';
import { silhouettePortAnchor } from './connectors/anchors/silhouettePort';
import { distanceToPolylineSq, pathBounds, samplePath, trimPathEnds } from './connectors/pathSampling';
import { ArrowMarker } from './markers/ArrowMarker';
import { GlowDecoration } from './decorations/shape/GlowDecoration';
import { PulseRingDecoration } from './decorations/shape/PulseRingDecoration';
import { LiquidFillDecoration } from './decorations/shape/LiquidFillDecoration';
import { MarchingAntsDecoration } from './decorations/shape/MarchingAntsDecoration';
import { RingDecoration } from './decorations/shape/RingDecoration';
import { MarchingAntsConnectorDecoration } from './decorations/connector/MarchingAntsConnectorDecoration';
import { FlyMarkerConnectorDecoration } from './decorations/connector/FlyMarkerConnectorDecoration';
import { FlowParticlesConnectorDecoration } from './decorations/connector/FlowParticlesConnectorDecoration';
import { GlowConnectorDecoration } from './decorations/connector/GlowConnectorDecoration';
import { RippleConnectorDecoration } from './decorations/connector/RippleConnectorDecoration';
import { RevealConnectorDecoration } from './decorations/connector/RevealConnectorDecoration';
import { RingConnectorDecoration } from './decorations/connector/RingConnectorDecoration';
import { LabelDecoration } from './decorations/shape/LabelDecoration';
import { ToggleDecoration } from './decorations/shape/ToggleDecoration';
import { ResizeHandleDecoration } from './decorations/shape/ResizeHandleDecoration';
import { SelectionFrameDecoration } from './decorations/shape/SelectionFrameDecoration';
import { LabelConnectorDecoration } from './decorations/connector/LabelConnectorDecoration';
import { ShakeEffect } from './effects/shape/ShakeEffect';
import { BreathingEffect } from './effects/shape/BreathingEffect';
import { BreathingConnectorEffect } from './effects/connector/BreathingConnectorEffect';
import { FadeInConnectorEffect } from './effects/connector/FadeInConnectorEffect';
import { resolveBadgePosition } from './badges/placement';
import {
  DEFAULT_ENDPOINT_BADGE_GAP_PX,
  resolveConnectorBadgePosition,
} from './badges/connectorPlacement';
import type { BadgeOptions } from './badges/types';
import { markerInsetFor } from './base/ConnectorBase';
import type {
  AnchorCtx,
  AnchorShapeRef,
  AnchorSpec,
  BaseConnectorSpec,
  BaseShapeSpec,
  ConnectorDecorationCtor,
  ConnectorDecorationHostInfo,
  ConnectorEndpointSpec,
  ConnectorHostInfo,
  DecorationSpec,
  DecorationTarget,
  EffectSpec,
  EffectTargetKind,
  Endpoint,
  HitResult,
  IAnchor,
  IConnector,
  IConnectorDecoration,
  IDecorationBase,
  IPathStyle,
  IRouter,
  IShape,
  IShapeDecoration,
  IShapeEffect,
  IConnectorEffect,
  LabelContent,
  LabelWrap,
  ConnectorEffectCtor,
  ConnectorEffectHostInfo,
  Obstacle,
  Path,
  Point,
  Polyline,
  PrimitivesRendererEventMap,
  Rect,
  RegisterDecorationOptions,
  RegisterEffectOptions,
  RenderStats,
  RouterCtx,
  ShapeCtor,
  ShapeDecorationCtor,
  ShapeDecorationHostInfo,
  ShapeEffectCtor,
  ShapeEffectHostInfo,
  ShapeHostInfo,
} from './types';

interface RegisteredDecoration {
  readonly ctor: ShapeDecorationCtor | ConnectorDecorationCtor;
  readonly target: DecorationTarget;
}

interface RegisteredEffect {
  readonly ctor: ShapeEffectCtor | ConnectorEffectCtor;
  readonly target: EffectTargetKind;
}

type AnimatedDecoration = { tick(deltaMs: number): boolean };
type AnimatedEffect = (IShapeEffect | IConnectorEffect) & { tick(deltaMs: number): boolean };

export interface PrimitivesRendererOptions {
  readonly container: Container;
  readonly camera: Camera;
  /**
   * Optional shared texture registry. When omitted, the renderer creates an
   * internal one — image fills still work (lazy-loaded), but textures are
   * not shared across renderer instances.
   */
  readonly textureRegistry?: TextureRegistry;
  /**
   * Optional DOM `<canvas>` element. Used by `hitMode: 'indexed'` to
   * apply `cursor: pointer` on shape/connector hover (Pixi's native
   * `gfx.cursor` auto-application is bypassed in indexed mode because
   * `eventMode = 'none'` skips the federated hit-test walk).
   *
   * When omitted in indexed mode, hover-cursor styling is a no-op —
   * shape/connector hits still emit `pointerover` / `pointerout` events
   * to behaviours, just without the cursor feedback. Most consumers
   * should pass this; `GraphLayer` forwards `CanvasContext.canvasElement`
   * automatically.
   */
  readonly canvasElement?: HTMLCanvasElement;
  /**
   * Minimum hover/click target in screen pixels — used as a *fallback*
   * by {@link hitTest}: exact geometric hits always win; only when no
   * shape contains the cursor does the dispatcher pick the closest
   * candidate within this many screen pixels of its origin. Exact
   * hits are never widened, so dense graphs don't suffer false
   * positives.
   *
   * Default `6` (cursor-friendly). Raise (`8`–`12`) for touch-friendly
   * stories; drop to `0` to forbid the fallback entirely.
   */
  readonly hitFloorPx?: number;
  /**
   * Hover **hysteresis** margin in screen pixels (edge-pick correctness I).
   * On the hover path only, the currently-hovered element of the same kind
   * is kept until a new candidate is closer by *more* than this many pixels
   * — so a sub-pixel jitter between two near-equidistant edges doesn't
   * flicker the highlight. Click / drag picking ignores this entirely.
   * Default `5`; `0` disables the stickiness.
   */
  readonly hoverHysteresisPx?: number;
  /**
   * Hover **node-incidence** radius in screen pixels (edge-pick correctness
   * J). When the hover winner is a connector and the cursor also sits within
   * this many pixels of a shape's centre, an edge *incident to that shape*
   * (an endpoint at the node) is preferred over an unrelated edge merely
   * passing through — incident edges separate near their shared endpoint,
   * where you aim. Purely geometric (endpoint-at-node), so the renderer stays
   * domain-free. Default `20`; `0` disables the bias.
   */
  readonly hoverNodeIncidencePx?: number;
}

/**
 * Default for {@link PrimitivesRendererOptions.hitFloorPx} — overridable
 * per-renderer. See the option's TSDoc for the rationale on raising /
 * lowering it.
 */
const DEFAULT_HIT_FLOOR_PX = 6;

/** Default for {@link PrimitivesRendererOptions.hoverHysteresisPx}. */
const DEFAULT_HOVER_HYSTERESIS_PX = 5;

/** Default for {@link PrimitivesRendererOptions.hoverNodeIncidencePx}. */
const DEFAULT_HOVER_NODE_INCIDENCE_PX = 20;

/**
 * Max number of segment boxes a single connector is split into for the hit
 * index (edge-pick correctness H). Caps the rbush entry-count multiplier: an
 * edge indexes as at most this many boxes, so a 5k-edge graph stays bounded.
 */
const CONNECTOR_HIT_MAX_BOXES = 8;

/**
 * Target arc length (world units) per connector hit box. An edge shorter than
 * this indexes as a single loose AABB (no change); longer edges split into
 * `ceil(len / this)` boxes, capped at {@link CONNECTOR_HIT_MAX_BOXES}. Tuned
 * for the pixel-ish coordinate ranges these datasets use; graphs in tiny
 * normalized ranges simply fall back to one box per edge.
 */
const CONNECTOR_HIT_SPLIT_LEN = 80;

export class PrimitivesRenderer {
  private readonly shapeRegistry = new Map<string, ShapeCtor>();
  private readonly routerRegistry = new Map<string, IRouter>();
  private readonly pathStyleRegistry = new Map<string, IPathStyle>();
  private readonly anchorRegistry = new Map<string, IAnchor>();
  private readonly decorationRegistry = new Map<string, RegisteredDecoration>();
  private readonly effectRegistry = new Map<string, RegisteredEffect>();

  private readonly shapeInstances = new Map<string, ShapeInstance>();
  private readonly connectorInstances = new Map<string, ConnectorInstance>();
  private readonly animated = new Set<AnimatedDecoration>();
  private readonly animatedEffects = new Set<AnimatedEffect>();
  /**
   * Shape instances that currently have at least one effect attached. The
   * per-frame aggregation walks this set rather than every shape instance.
   */
  private readonly hostsWithEffects = new Set<ShapeInstance>();
  /**
   * Connector instances that currently have at least one effect attached.
   * Walked per frame to aggregate style modulations (tint + alpha) onto
   * `connector.gfx`. Transform deltas are ignored for connector hosts.
   */
  private readonly connectorHostsWithEffects = new Set<ConnectorInstance>();

  /**
   * Host → (slot → BadgeOptions). Each entry corresponds to a shape registered
   * under id `${hostId}:${slot}` and re-anchored on host updates.
   */
  private readonly badges = new Map<string, Map<string, BadgeOptions>>();

  private readonly hit = new HitIndex();

  /**
   * Shape ids whose `gfx` was translated via {@link moveShape} since the last
   * hit-index reflush. `moveShape` skips the per-call rbush update (an O(N)
   * remove+insert that becomes O(N²) across a full position sweep — same
   * reasoning as {@link scaleShape}); the stale hit-bboxes are bulk-reindexed
   * lazily on the next {@link hitTest}, so a layout settle / drag that's never
   * queried mid-flight pays nothing for hit accuracy.
   */
  private readonly movedShapeHits = new Set<string>();

  /**
   * Connector ids whose path was recomputed (re-routed) since the last
   * hit-index reflush. The edge analog of {@link movedShapeHits}: during a
   * layout settle EVERY incident edge re-routes each tick, and a per-edge
   * `hit.insert` (an O(N) rbush remove+insert) would be O(N²) per frame —
   * the dominant cost on large graphs. Existing edges defer here and are
   * bulk-reindexed lazily in {@link flushMovedHits}; only brand-new edges
   * insert immediately (a deferred bbox-update can't add a missing entry).
   */
  private readonly movedConnectorHits = new Set<string>();

  /**
   * Most recently-pushed label rasterisation resolution. `null` until a
   * zoom-LOD behaviour (or the host app) calls `setLabelsResolution`. When
   * non-null, every newly-mounted label decoration inherits this value so
   * the user never sees a freshly-drawn label start at base fidelity and
   * snap up on the next zoom event.
   */
  private trackedLabelResolution: number | null = null;

  /**
   * Every decoration exposing the `setResolution` / `getResolution` hooks
   * (i.e. `LabelDecoration` / `LabelConnectorDecoration`). Maintained on
   * `setDecoration` / `disposeDecoration` so `tickAnimations` can sweep it
   * cheaply without re-scanning every shape and connector instance.
   *
   * The sweep applies the tracked resolution only to labels currently
   * inside the camera viewport — re-rastering an off-screen label burns a
   * GPU texture upload with no visible benefit. Off-screen labels catch
   * up the moment they pan in, since the sweep re-checks every frame.
   */
  private readonly labelBearingDecorations = new Set<IDecorationBase<unknown>>();
  /**
   * Per-frame budget on how many on-screen labels get re-rastered. Each
   * `setResolution(r)` write triggers one glyph-texture regen in Pixi's
   * next render pass. 64 keeps the regen cost inside frame budget for a
   * typical few-hundred-visible-label scene while finishing the transition
   * in under 5 frames; widen if your scenes have larger visible label
   * sets and tolerate a longer transition.
   */
  private static readonly LABEL_RASTER_PER_TICK = 64;

  readonly events = new EventEmitter<PrimitivesRendererEventMap>();

  private readonly _container: Container;
  /**
   * Connector sub-layer — added to `_container` first so it renders *below*
   * the shape layer. Connector decorations live inside `connector.gfx`
   * (children of this layer), so any decoration geometry that extends past
   * the path endpoints (e.g. a glow halo's radius, a ripple wave's
   * `maxRadius`) is naturally hidden by overlapping shapes on top —
   * matching the standard graph-viz "nodes above edges" convention.
   */
  private readonly connectorLayer: Container;
  /** Shape sub-layer — rendered above `connectorLayer`. */
  private readonly shapeLayer: Container;
  /**
   * Overlay sub-layer — rendered **above both** the connector and shape layers.
   * A raised element (hovered / selected) is reparented here by
   * {@link raiseShape} / {@link raiseConnector} so the highlighted set floats
   * over *all* unrelated content — crucially, a highlighted **edge** paints over
   * non-highlighted nodes (impossible while it stays in `connectorLayer`, which
   * is always under `shapeLayer`). Within the overlay, raised shapes still sort
   * above raised connectors (see `OVERLAY_SHAPE_Z` / `OVERLAY_CONNECTOR_Z`), so
   * a hovered node stays on top of its own incident edges.
   */
  private readonly overlayLayer: Container;
  /** zIndex band for a raised connector inside {@link overlayLayer}. */
  private static readonly OVERLAY_CONNECTOR_Z = 0;
  /**
   * zIndex band for a raised shape inside {@link overlayLayer} — far above the
   * connector band so any raised node sorts over any raised edge (a hovered node
   * stays on top of its own incident edges within the floated set).
   */
  private static readonly OVERLAY_SHAPE_Z = 1_000_000;
  readonly camera: Camera;
  private readonly textureRegistry: TextureRegistry;
  private readonly hitFloorPx: number;
  /** Hover hysteresis margin in screen px (edge-pick I). See the option's TSDoc. */
  private readonly hoverHysteresisPx: number;
  /** Hover node-incidence radius in screen px (edge-pick J). See the option's TSDoc. */
  private readonly hoverNodeIncidencePx: number;
  /** DOM canvas element used by the router for cursor styling. */
  private readonly canvasElement: HTMLCanvasElement | null;

  /** Currently-hovered target. Tracks pointerover/out diffs. */
  private currentHover: { kind: 'shape' | 'connector'; id: string } | null = null;
  /** Currently-hovered sub-part (shape id + `hitId`). Tracks partover/partout diffs. */
  private currentPart: { id: string; partId: string } | null = null;
  /** Target captured by a pointerdown — used to gate click emission. */
  private downHit: { kind: 'shape' | 'connector'; id: string; button: number } | null = null;
  /**
   * True while any pointer button is held down (regardless of where
   * the pointerdown landed). Used to suppress hover state-changes
   * during a drag — without this, dragging a node over neighbouring
   * shapes fires `pointerover` on each one and triggers
   * `HoverActivateBehaviour` mid-drag.
   */
  private pointerDown = false;
  /**
   * When `false`, {@link hitTest} short-circuits to `null` so nothing this
   * renderer holds is interactive — used to suppress a whole hidden layer's
   * elements from picking (the owning layer toggles it in `onVisibleChange`).
   */
  private hitEnabled = true;
  /** Last left-click time + target — drives double-click detection. */
  private lastLeftClick: { kind: 'shape' | 'connector'; id: string; t: number } | null = null;
  /** Pointer-router subscriptions to clean up on `destroy`. */
  private pointerRouterUnsubs: Array<() => void> = [];
  /**
   * RAF handle + latest pointer-move event for the move-coalescing
   * throttle. Raw `globalpointermove` fires hundreds of times per
   * second on a fast mouse sweep; we only need to resolve the hit
   * once per animation frame.
   */
  private pendingPointerMove: FederatedPointerEvent | null = null;
  private pointerMoveRaf: number | null = null;

  constructor(opts: PrimitivesRendererOptions) {
    this._container = opts.container;
    this.camera = opts.camera;
    this.textureRegistry = opts.textureRegistry ?? new TextureRegistry();
    this.hitFloorPx = opts.hitFloorPx ?? DEFAULT_HIT_FLOOR_PX;
    this.hoverHysteresisPx = opts.hoverHysteresisPx ?? DEFAULT_HOVER_HYSTERESIS_PX;
    this.hoverNodeIncidencePx = opts.hoverNodeIncidencePx ?? DEFAULT_HOVER_NODE_INCIDENCE_PX;
    this.canvasElement = opts.canvasElement ?? null;
    // Insertion order = render order in Pixi. Adding the connector layer
    // first then the shape layer puts shapes on top — so any connector
    // decoration that extends past a path endpoint (glow halo, ripple
    // wave) is clipped visually by the overlapping shape.
    this.connectorLayer = new Container();
    this.shapeLayer = new Container();
    // Sort each sub-layer's children by `gfx.zIndex` so a primitive can be
    // lifted above its peers within its own layer (see `raiseShape` /
    // `raiseConnector`). Default `zIndex` is 0, and JS `Array.sort` is stable,
    // so untouched primitives keep their natural insertion order. Sorting is
    // confined to each sub-layer — `_container` itself is NOT sortable, so the
    // connector-below-shape ordering of the two layers is preserved (a raised
    // edge still sits under every node).
    this.connectorLayer.sortableChildren = true;
    this.shapeLayer.sortableChildren = true;
    this.overlayLayer = new Container();
    this.overlayLayer.sortableChildren = true;
    this._container.addChild(this.connectorLayer);
    this._container.addChild(this.shapeLayer);
    // Added last → renders on top of both sub-layers. Holds the raised
    // (hovered / selected) set so highlighted edges paint over unrelated nodes.
    this._container.addChild(this.overlayLayer);
    this.registerBuiltins();
    this.installPointerRouter();
  }

  private registerBuiltins(): void {
    this.registerShape('circle', CircleShape);
    this.registerShape('ellipse', EllipseShape);
    this.registerShape('rect', RectShape);
    this.registerShape('tabbed-rect', TabbedRectShape);
    this.registerShape('polygon', PolygonShape);
    this.registerShape('regular-polygon', RegularPolygonShape);
    this.registerShape('star', StarShape);
    this.registerShape('arc', ArcShape);
    this.registerShape('composite', CompositeShape);
    // Markers are shapes — registered through the same shape registry so
    // they can also be added directly via `addShape` and so connectors can
    // resolve them by `kind` from the read-only registry.
    this.registerShape('arrow', ArrowMarker);

    this.registerRouter('straight', straightRouter);
    // `orth` is the simple H/V router (matches X6 / JointJS naming).
    // `orthogonal` is an alias kept for compatibility.
    this.registerRouter('orth', orthRouter);
    this.registerRouter('orthogonal', orthRouter);
    // `manhattan` is the obstacle-aware variant — routes around `RouterCtx.obstacles`
    // via A* on a coarse grid; falls back to `orth` when obstacles are empty
    // or A* fails. See `connectors/routers/manhattan.ts`.
    this.registerRouter('manhattan', manhattanRouter);
    this.registerRouter('metro', metroRouter);
    this.registerRouter('er', erRouter);
    this.registerRouter('oneSide', oneSideRouter);

    this.registerPathStyle('normal', normalPathStyle);
    this.registerPathStyle('rounded', roundedPathStyle);
    this.registerPathStyle('bezier', bezierPathStyle);
    this.registerPathStyle('quadratic', quadraticPathStyle);
    this.registerPathStyle('bump-radial', bumpRadialPathStyle);
    this.registerPathStyle('bump-horizontal', bumpHorizontalPathStyle);
    this.registerPathStyle('bundle', bundlePathStyle);
    this.registerPathStyle('step-radial', stepRadialPathStyle);
    this.registerPathStyle('smooth', smoothPathStyle);
    // Self-loop pathStyles — draw a petal / U-stub anchored at the first
    // polyline point. Pair with `router: 'straight'` and a connector whose
    // source and target reference the same shape.
    this.registerPathStyle('loop-curve', loopCurvePathStyle);
    this.registerPathStyle('loop-polyline', loopPolylinePathStyle);

    this.registerAnchor('center', centerAnchor);
    this.registerAnchor('boundary', boundaryAnchor);
    this.registerAnchor('perpendicular', perpendicularAnchor);
    this.registerAnchor('edge-port', edgePortAnchor);
    this.registerAnchor('silhouette-port', silhouettePortAnchor);

    this.registerDecoration('glow', GlowDecoration, { target: 'shape' });
    this.registerDecoration('pulse-ring', PulseRingDecoration, { target: 'shape' });
    this.registerDecoration('liquid-fill', LiquidFillDecoration, { target: 'shape' });
    this.registerDecoration('marching-ants', MarchingAntsDecoration, { target: 'shape' });
    this.registerDecoration('ring', RingDecoration, { target: 'shape' });
    this.registerDecoration('marching-ants-connector', MarchingAntsConnectorDecoration, { target: 'connector' });
    this.registerDecoration('fly-marker-connector', FlyMarkerConnectorDecoration, { target: 'connector' });
    this.registerDecoration('flow-particles-connector', FlowParticlesConnectorDecoration, { target: 'connector' });
    this.registerDecoration('glow-connector', GlowConnectorDecoration, { target: 'connector' });
    this.registerDecoration('ripple-connector', RippleConnectorDecoration, { target: 'connector' });
    this.registerDecoration('reveal-connector', RevealConnectorDecoration, { target: 'connector' });
    this.registerDecoration('ring-connector', RingConnectorDecoration, { target: 'connector' });
    this.registerDecoration('label', LabelDecoration, { target: 'shape' });
    this.registerDecoration('label-connector', LabelConnectorDecoration, { target: 'connector' });
    this.registerDecoration('toggle', ToggleDecoration, { target: 'shape' });
    this.registerDecoration('resize-handle', ResizeHandleDecoration, { target: 'shape' });
    this.registerDecoration('selection-frame', SelectionFrameDecoration, { target: 'shape' });

    this.registerEffect('shake', ShakeEffect, { target: 'shape' });
    this.registerEffect('breathing', BreathingEffect, { target: 'shape' });
    this.registerEffect('breathing-connector', BreathingConnectorEffect, { target: 'connector' });
    this.registerEffect('fade-in-connector', FadeInConnectorEffect, { target: 'connector' });
  }

  // ─── Registries ─────────────────────────────────────────────────────────

  registerShape<TSpec extends BaseShapeSpec>(kind: string, ctor: ShapeCtor<TSpec>): void {
    this.shapeRegistry.set(kind, ctor as ShapeCtor);
  }

  registerRouter(kind: string, fn: IRouter): void {
    this.routerRegistry.set(kind, fn);
  }

  registerPathStyle(kind: string, fn: IPathStyle): void {
    this.pathStyleRegistry.set(kind, fn);
  }

  registerAnchor(kind: string, fn: IAnchor): void {
    this.anchorRegistry.set(kind, fn);
  }

  registerDecoration<TStyle>(
    kind: string,
    ctor: new (style: TStyle) => IShapeDecoration<TStyle> | IConnectorDecoration<TStyle>,
    opts: RegisterDecorationOptions,
  ): void {
    this.decorationRegistry.set(kind, {
      ctor: ctor as unknown as ShapeDecorationCtor | ConnectorDecorationCtor,
      target: opts.target,
    });
  }

  /**
   * Register an effect under a string kind. Effects are domain-free primitives
   * that modulate the host shape's transform or style channels each frame
   * (shake, breathing, shimmer, …). The effect's constructor receives the
   * caller's `style` payload; `opts.target` constrains which host kinds the
   * effect may attach to (shape-only for v0).
   *
   * Throws on `setEffect` if the registered `target` doesn't include the
   * host kind being targeted.
   */
  registerEffect<TStyle>(
    kind: string,
    ctor: new (style: TStyle) => IShapeEffect<TStyle> | IConnectorEffect<TStyle>,
    opts: RegisterEffectOptions,
  ): void {
    this.effectRegistry.set(kind, {
      ctor: ctor as unknown as ShapeEffectCtor | ConnectorEffectCtor,
      target: opts.target,
    });
  }

  // ─── Mutation: shapes ───────────────────────────────────────────────────

  addShape<TSpec extends BaseShapeSpec>(id: string, spec: TSpec): void {
    if (this.shapeInstances.has(id)) {
      throw new Error(`PrimitivesRenderer.addShape: id "${id}" already exists`);
    }
    const Ctor = this.shapeRegistry.get(spec.kind);
    if (!Ctor) {
      throw new Error(`PrimitivesRenderer.addShape: unknown shape kind "${spec.kind}"`);
    }
    const host: ShapeHostInfo = {
      surface: this.shapeLayer,
      textureRegistry: this.textureRegistry,
      requestRedraw: () => {
        const cur = this.shapeInstances.get(id);
        if (cur) cur.shape.draw(cur.spec);
      },
    };
    const shape = new Ctor(spec, host) as IShape<TSpec>;
    this.shapeLayer.addChild(shape.gfx);
    const inst = new ShapeInstance<TSpec>(id, spec, shape);
    this.shapeInstances.set(id, inst as unknown as ShapeInstance);
    // A `visible: false` shape (collapsed-group descendant or explicitly hidden)
    // is culled from drawing AND kept out of the hit index — so it is never
    // returned by `hitTest` (no invisible-but-clickable). It re-enters on the
    // next `updateShape` that flips `visible` back on.
    if (spec.visible !== false) {
      this.hit.insert(id, 'shape', this.shapeWorldBounds(inst), spec.zIndex ?? 0);
    }
    // Per-shape Pixi event dispatch is bypassed — the renderer's global
    // pointer router (see `installPointerRouter`) handles hit-routing
    // via `hitTest`. Disabling `eventMode` on the gfx skips Pixi's
    // per-shape hit-test walk on every pointer event (the perf win on
    // dense graphs); the geometric `hitArea` set by `ShapeBase` is
    // left in place so `hitTest` can still consult it via
    // `inst.shape.getHitArea().contains(...)`.
    shape.gfx.eventMode = 'none';
    // Inherit the current label-resolution LOD so a shape with internal text
    // (composite) mounts crisp instead of at base fidelity until the next tier.
    if (this.trackedLabelResolution !== null) shape.setLabelResolution?.(this.trackedLabelResolution);
  }

  updateShape<TSpec extends BaseShapeSpec>(id: string, partial: Partial<TSpec>): void {
    const inst = this.shapeInstances.get(id) as ShapeInstance<TSpec> | undefined;
    if (!inst) return;
    inst.spec = { ...inst.spec, ...partial };
    inst.shape.draw(inst.spec);
    // Keep the hit index in step with visibility: a now-hidden shape is removed
    // (so it stops being hittable), a now-visible one is (re-)inserted. `insert`
    // handles both the "already indexed" and "was hidden" cases idempotently.
    if (inst.spec.visible === false) {
      this.hit.remove(id);
    } else {
      this.hit.insert(id, 'shape', this.shapeWorldBounds(inst), inst.spec.zIndex ?? 0);
    }
    if (inst.decorations.size > 0) this.refreshShapeDecorations(inst);
    if (this.badges.has(id)) this.reanchorBadges(id);
  }

  /**
   * Fast-path uniform rescale for a shape — writes the gfx transform
   * directly without touching the spec or rebuilding geometry.
   *
   * `updateShape` rebuilds the underlying Pixi geometry (Graphics.clear()
   * + retrace) on every call, which dominates the cost when something
   * like `NodeScaleLODBehaviour` rewrites thousands of node sizes per
   * camera-zoom frame. `scaleShape` skips all of that: the geometry on
   * the GPU is unchanged, only its transform changes.
   *
   * **Hit-test bounds are NOT updated here.** rbush's `remove(entry)` is
   * an O(N) tree walk, so per-id `hit.update` × N shapes is O(N²) per
   * zoom frame — pathological at a few thousand shapes. Call
   * {@link reindexScaledShapeHits} once *after* a batch (typically on
   * gesture settle) to bulk-reindex in O(N log N). The hit-bounds are
   * stale until you do — acceptable when the caller knows pointer
   * interaction is unlikely mid-gesture.
   *
   * **Other limitations** — decorations and badges attached to the host
   * are **not** re-anchored against the new visible bounds; if you have
   * either on a size-LOD'd node, prefer `updateShape` or accept the
   * stale anchor. Stroke width inside the geometry scales with the
   * transform (Pixi's stroke is in local units), which is usually the
   * intent for pixel-constant sizing but means you can't independently
   * target body size and stroke width via `scaleShape` alone.
   */
  scaleShape(id: string, scale: number): void {
    const inst = this.shapeInstances.get(id);
    if (!inst) return;
    inst.gfxScale = scale;
    inst.shape.gfx.scale.set(scale, scale);
  }

  /**
   * Show / hide a shape's **text** — both the external `'label'` decoration
   * (simple nodes) *and* any internal text the shape mounts (e.g. a
   * `CompositeShape`'s `label` parts, via the optional `setTextVisible` hook).
   * Gives text zoom-LOD a single entry point that covers atomic and composite
   * nodes alike; the companion trio is {@link setShapeIconVisible} /
   * {@link setShapeImageVisible}. No-op for the pieces a shape doesn't have.
   */
  setShapeTextVisible(id: string, visible: boolean): void {
    const inst = this.shapeInstances.get(id);
    if (!inst) return;
    if (inst.decorations.has('label')) this.setDecorationVisible(id, 'label', visible);
    inst.shape.setTextVisible?.(visible);
  }

  /**
   * Show / hide a shape's **inset icon** content (`glyph` / `svg` / `svg-url`).
   * Pure `.visible` flip — no repaint. Persists across redraws. No-op for
   * shapes that don't carry inset content.
   */
  setShapeIconVisible(id: string, visible: boolean): void {
    this.shapeInstances.get(id)?.shape.setInsetContentVisible?.(visible);
  }

  /**
   * Show / hide a shape's silhouette **image** fill. Repaints the body with the
   * `image` layer stripped / restored. Persists across redraws. No-op for
   * shapes without an image fill.
   */
  setShapeImageVisible(id: string, visible: boolean): void {
    this.shapeInstances.get(id)?.shape.setImageFillVisible?.(visible);
  }

  /**
   * **Viewport culling.** Toggle `renderable` on every *indexed* shape /
   * connector by whether its bbox intersects `visibleBounds` (grown by
   * `padWorld` so elements don't pop at the screen edge during a pan). Off-screen
   * elements are then skipped by Pixi's render pass — the working set drops
   * sharply when zoomed in, which is where it matters. Reuses the same rbush that
   * backs hit-testing (`searchRect`), so it's conservative for loose connector
   * bboxes: it may keep an off-screen edge, but never culls an on-screen one.
   *
   * Elements not in the hit index (hidden / non-hittable) are left untouched.
   * Cheap enough to run once per camera-move frame; it buys nothing for the
   * fully zoomed-out hairball (everything's on screen — that needs batching).
   */
  cull(visibleBounds: Rect, padWorld = 0): void {
    const rect: Rect = {
      x: visibleBounds.x - padWorld,
      y: visibleBounds.y - padWorld,
      width: visibleBounds.width + 2 * padWorld,
      height: visibleBounds.height + 2 * padWorld,
    };
    const visible = new Set<string>();
    for (const e of this.hit.searchRect(rect)) visible.add(e.id);
    for (const [id, inst] of this.shapeInstances) {
      if (this.hit.has(id)) inst.shape.gfx.renderable = visible.has(id);
    }
    for (const [id, inst] of this.connectorInstances) {
      if (this.hit.has(id)) inst.connector.gfx.renderable = visible.has(id);
    }
  }

  /** Undo culling — restore `renderable` on every shape / connector. */
  uncull(): void {
    for (const inst of this.shapeInstances.values()) inst.shape.gfx.renderable = true;
    for (const inst of this.connectorInstances.values()) inst.connector.gfx.renderable = true;
  }

  /**
   * Fast-path position-only move — writes the host `gfx` transform directly,
   * skipping BOTH the geometry redraw and the decoration re-anchor that
   * {@link updateShape} performs. This is what `GraphLayer` routes every
   * layout / drag position write through.
   *
   * **Why it's correct to skip both.** A shape's silhouette is traced in
   * shape-local space and `(spec.x, spec.y)` is applied as the host `gfx`
   * translation (`ShapeBase.draw`). Decorations (labels, halos, rings, …) are
   * children of that same `gfx` and anchor to the shape's *local*,
   * position-independent bounds (`refreshShapeDecorations` reads
   * `inst.shape.bounds()`, not world position). So a pure translation needs
   * only `gfx.position.set(x, y)` — it carries the body and every decoration
   * with it for free, reproducing identical geometry. `updateShape` instead
   * re-tessellates and re-anchors on every move; profiling a ~500-node force
   * settle showed the decoration re-anchor alone was ~2.2 ms/tick (~90 % of
   * the per-move cost) while the translation itself is ~0.05 ms.
   *
   * **Hit-bounds are deferred** — like {@link scaleShape}, the per-call rbush
   * update is skipped (O(N) remove+insert → O(N²) over a full sweep). Moved
   * ids accumulate in `movedShapeHits` and are bulk-reindexed lazily on the
   * next {@link hitTest} (or eagerly via {@link reindexScaledShapeHits}).
   *
   * Badges are separate shape instances (NOT children of the host `gfx`), so
   * the transform can't carry them — they're re-anchored here when present.
   */
  moveShape(id: string, x: number, y: number): void {
    const inst = this.shapeInstances.get(id);
    if (!inst) return;
    // `inst.spec` and the shape's own `spec` are the SAME object reference
    // (kept so by the last `draw`), so mutating in place updates what
    // `bounds()` / `obstacleTest()` / `shapeWorldBounds` read — and avoids a
    // per-move allocation. Reassigning a fresh spec object would desync the
    // two refs. `x` / `y` are `readonly` at the type level (a draw-time
    // contract); this fast path is the sanctioned in-place writer.
    const pos = inst.spec as { x: number; y: number };
    pos.x = x;
    pos.y = y;
    inst.shape.gfx.position.set(x, y);
    this.movedShapeHits.add(id);
    if (this.badges.has(id)) this.reanchorBadges(id);
  }

  /**
   * Raise a shape into the {@link overlayLayer} (above *all* connectors and
   * shapes) or drop it back to its home {@link shapeLayer}. `zIndex !== 0`
   * lifts it — reparented to the overlay at a z above raised connectors so a
   * hovered node stays over its own edges; `zIndex === 0` returns it to the
   * shape layer at natural order. Use to lift a hovered / selected node so
   * unrelated content doesn't draw over the highlighted set.
   *
   * Visual-only: does NOT touch geometry, transform, or the hit index
   * (closest-wins hit resolution consults the spec `zIndex` recorded at insert).
   * Reparenting is safe across redraws — updates mutate the existing `gfx` in
   * place and never re-add it to a layer.
   */
  raiseShape(id: string, zIndex: number): void {
    const inst = this.shapeInstances.get(id);
    if (!inst) return;
    const gfx = inst.shape.gfx;
    if (zIndex === 0) {
      gfx.zIndex = 0;
      if (gfx.parent !== this.shapeLayer) this.shapeLayer.addChild(gfx);
    } else {
      gfx.zIndex = PrimitivesRenderer.OVERLAY_SHAPE_Z + zIndex;
      if (gfx.parent !== this.overlayLayer) this.overlayLayer.addChild(gfx);
    }
  }

  /**
   * Raise a connector into the {@link overlayLayer} (above unrelated nodes) or
   * drop it back to its home {@link connectorLayer} — the connector-side sibling
   * of {@link raiseShape}. `zIndex !== 0` lifts the edge to the overlay, *below*
   * raised shapes but above every non-raised node, so a hovered edge is no
   * longer occluded by unrelated shapes; `zIndex === 0` returns it to the
   * connector layer at natural order.
   */
  raiseConnector(id: string, zIndex: number): void {
    const inst = this.connectorInstances.get(id);
    if (!inst) return;
    const gfx = inst.connector.gfx;
    if (zIndex === 0) {
      gfx.zIndex = 0;
      if (gfx.parent !== this.connectorLayer) this.connectorLayer.addChild(gfx);
    } else {
      gfx.zIndex = PrimitivesRenderer.OVERLAY_CONNECTOR_Z + zIndex;
      if (gfx.parent !== this.overlayLayer) this.overlayLayer.addChild(gfx);
    }
  }

  /**
   * Bulk re-index hit-test bboxes for shapes — pairs with
   * {@link scaleShape} (which intentionally skips per-call hit updates).
   *
   * Passing `ids` confines the reindex to those shapes. Omitting it
   * touches every shape instance. Either way the rbush tree is rebuilt
   * once via `clear + load` rather than N × `remove + insert`.
   *
   * Call on gesture settle (e.g. inside `NodeScaleLODBehaviour`'s
   * trailing-edge `flushReanchor`) so mid-gesture frames stay cheap and
   * hit-test accuracy snaps back the moment the user stops zooming.
   */
  reindexScaledShapeHits(ids?: Iterable<string>): void {
    const updates: Array<{ id: string; rects: Rect[] }> = [];
    const sourceIds: Iterable<string> = ids ?? this.shapeInstances.keys();
    for (const id of sourceIds) {
      const inst = this.shapeInstances.get(id);
      if (!inst) continue;
      updates.push({ id, rects: [this.shapeWorldBounds(inst)] });
    }
    this.hit.bulkUpdateBoxes(updates);
  }

  /**
   * Flush deferred hit-bbox updates from {@link moveShape} (shapes) and
   * {@link indexConnector} (re-routed connectors) in a SINGLE rbush rebuild.
   * Called lazily from {@link hitTest} the first time a query needs accurate
   * bounds, so a layout settle / drag with no pointer interaction pays nothing
   * — and when it does pay, it's one O(N log N) `bulkUpdateBoxes`, never the
   * O(N²) of per-id `remove + insert`.
   */
  private flushMovedHits(): void {
    if (this.movedShapeHits.size === 0 && this.movedConnectorHits.size === 0) return;
    const updates: Array<{ id: string; rects: Rect[] }> = [];
    for (const id of this.movedShapeHits) {
      const inst = this.shapeInstances.get(id);
      if (inst) updates.push({ id, rects: [this.shapeWorldBounds(inst)] });
    }
    for (const id of this.movedConnectorHits) {
      const inst = this.connectorInstances.get(id);
      if (inst && inst.path.length >= 2) updates.push({ id, rects: this.connectorHitBoxes(inst) });
    }
    this.movedShapeHits.clear();
    this.movedConnectorHits.clear();
    this.hit.bulkUpdateBoxes(updates);
  }

  /**
   * Recompute the path of every connector. Use after a batch of
   * `scaleShape` calls (e.g. one `NodeScaleLODBehaviour` zoom tick) so
   * connectors re-anchor against the freshly-scaled silhouettes — without
   * this, edges remain anchored to the pre-scale bounds and visibly fall
   * short of the smaller shape.
   *
   * Cheap when paired with the lazy `obstacles` getter in `routePath`:
   * routers that don't read obstacles (e.g. `straight`) skip the
   * `O(shapes)` collection per connector. Routers that *do* read
   * obstacles (`manhattan`, `metro`, `er`) still pay it — pair them with
   * a debounce when re-anchoring on a continuous gesture.
   */
  reanchorAllConnectors(): void {
    for (const inst of this.connectorInstances.values()) {
      this.recomputeConnectorPath(inst);
    }
  }

  /**
   * Serialise every live shape + connector this renderer holds to an SVG
   * fragment (no `<svg>` wrapper) in world coordinates — the vector projection
   * behind {@link Canvas.exportSVG}. Connectors are emitted first (drawn under
   * shapes), then shapes; each shape/connector's attached `label` decoration is
   * rendered as `<text>`.
   *
   * Coverage caveats (raster export is exact for these) are documented in
   * `export/svgExport.ts`: `image` / `glyph` / `svg` fills, non-label
   * decorations, and effects are not represented in the vector output.
   */
  toSVG(): string {
    const out: string[] = [];
    for (const inst of this.connectorInstances.values()) {
      if (inst.spec.visible === false) continue;
      const label = inst.decorations.get('label')?.style;
      out.push(connectorToSvg(inst.spec, inst.path, inst.strokeWidthScale, label));
    }
    for (const inst of this.shapeInstances.values()) {
      if (inst.spec.visible === false) continue;
      const label = inst.decorations.get('label')?.style;
      out.push(shapeSpecToSvg(inst.spec, label));
    }
    return out.filter(Boolean).join('');
  }

  removeShape(id: string): void {
    const inst = this.shapeInstances.get(id);
    if (!inst) return;
    // Cascade-remove attached badges *before* removing the host so the badge
    // ids don't outlive the host in any consumer-visible state.
    const attached = this.badges.get(id);
    if (attached) {
      for (const slot of [...attached.keys()]) this.removeBadge(id, slot);
      this.badges.delete(id);
    }
    for (const deco of inst.decorations.values()) this.disposeDecoration(deco);
    inst.decorations.clear();
    for (const fx of inst.effects.values()) this.disposeEffect(fx);
    inst.effects.clear();
    this.hostsWithEffects.delete(inst);
    inst.shape.destroy();
    this.hit.remove(id);
    this.movedShapeHits.delete(id);
    this.shapeInstances.delete(id);
    // Drop stale sub-part hover if this was the host (no `partout` — it's gone).
    if (this.currentPart?.id === id) this.currentPart = null;
  }

  // ─── Mutation: connectors ───────────────────────────────────────────────

  addConnector<TSpec extends BaseConnectorSpec>(id: string, spec: TSpec): void {
    if (this.connectorInstances.has(id)) {
      throw new Error(`PrimitivesRenderer.addConnector: id "${id}" already exists`);
    }
    const host: ConnectorHostInfo = {
      surface: this.connectorLayer,
      shapeRegistry: this.shapeRegistry,
    };
    const connector = new Connector(host) as unknown as IConnector<TSpec>;
    this.connectorLayer.addChild(connector.gfx);
    const inst = new ConnectorInstance<TSpec>(id, spec, connector);
    this.connectorInstances.set(id, inst as unknown as ConnectorInstance);
    // No decorations attached yet, so padding is zero — but funnel through
    // `recomputeConnectorPath` for a single code path that handles both
    // the no-decoration and with-decoration cases.
    this.recomputeConnectorPath(inst as unknown as ConnectorInstance);
    // See `addShape` for the rationale — per-connector Pixi event
    // dispatch is replaced by the global pointer router.
    connector.gfx.eventMode = 'none';
  }

  updateConnector<TSpec extends BaseConnectorSpec>(id: string, partial: Partial<TSpec>): void {
    const inst = this.connectorInstances.get(id) as ConnectorInstance<TSpec> | undefined;
    if (!inst) return;
    inst.spec = { ...inst.spec, ...partial };
    this.recomputeConnectorPath(inst as unknown as ConnectorInstance);
  }

  /**
   * Fast-path render update for connectors — patches the `stroke` spec
   * and redraws on the **existing cached path** without re-running the
   * router / pathStyle / obstacle calculation.
   *
   * `updateConnector` always calls `recomputeConnectorPath`, which builds
   * an obstacle list by iterating every shape in the renderer (line 1271).
   * For a `straight` router with thousands of connectors that's
   * `O(connectors × shapes)` per update — fine for one-off restyles, but
   * lethal during continuous camera-driven reflows (e.g. `ScreenSizeBehaviour`
   * keeping stroke widths pixel-constant across zoom).
   *
   * This skips all of that: the path is unchanged (scale doesn't move
   * any endpoint in world coords), so we just redraw the body on the
   * cached `inst.path` with the new stroke. Use when you know **only**
   * the stroke is changing.
   */
  setConnectorStroke(id: string, stroke: { color: number; width: number }): void {
    const inst = this.connectorInstances.get(id);
    if (!inst) return;
    inst.spec = { ...inst.spec, stroke };
    this.drawConnectorInstance(inst);
  }

  /**
   * True iff re-rendering connector `id` with `next` would leave its **geometry**
   * unchanged — everything but the `stroke` matches the current spec. Lets a
   * state-only re-render (hover / select highlight) take the `setConnectorStroke`
   * fast path and skip the re-route + hit-reindex a full `updateConnector` does.
   *
   * Conservative: it compares the whole spec **minus `stroke`**, so any real
   * geometry / marker / router change (or an unknown edge, or a key-order
   * mismatch) returns `false` and the caller does the full update — it can never
   * green-light a stale-geometry fast path.
   */
  connectorGeometryUnchanged(id: string, next: BaseConnectorSpec): boolean {
    const inst = this.connectorInstances.get(id);
    if (!inst) return false;
    return this.strippedStrokeKey(inst.spec) === this.strippedStrokeKey(next);
  }

  /** Stable-ish key of a connector spec with `stroke` removed (geometry only). */
  private strippedStrokeKey(spec: BaseConnectorSpec): string {
    const { stroke: _stroke, ...geometry } = spec as BaseConnectorSpec & { stroke?: unknown };
    return JSON.stringify(geometry);
  }

  /**
   * Re-route the path for `inst`, trim by aggregated decoration end-padding,
   * redraw the connector body + markers on the trimmed path, and refresh
   * any attached decorations against the new path. Called whenever the
   * spec, decorations, or padding requirements change.
   */
  private recomputeConnectorPath(inst: ConnectorInstance): void {
    const rawPath = this.routePath(inst.spec);
    const padding = this.aggregateConnectorPadding(inst);
    // Padding only applies at endpoints that actually have a marker. Without
    // a marker, the body's stroke (and any decoration's body stroke) ends
    // sharp at the path endpoint (butt cap) — there's no "outer extent"
    // past the anchor to make room for. Inserting padding there would just
    // shorten the body and open a visible gap between it and the anchor.
    const srcPad = inst.spec.sourceMarker ? padding.source : 0;
    const tgtPad = inst.spec.targetMarker ? padding.target : 0;
    inst.path = srcPad > 0 || tgtPad > 0
      ? trimPathEnds(rawPath, srcPad, tgtPad)
      : rawPath;
    inst.sampledPolyline = null; // path changed → drop the memoised hit-test polyline
    this.drawConnectorInstance(inst);
    this.indexConnector(inst);
    if (inst.decorations.size > 0) this.refreshConnectorDecorations(inst);
    if (this.badges.has(inst.id)) this.reanchorConnectorBadges(inst, inst.id);
  }

  /**
   * Fast-path render-time stroke multiplier for a connector — writes
   * `inst.strokeWidthScale` and redraws on the cached path.
   *
   * `EdgeScaleLODBehaviour` uses this each `camera:zoom` frame to keep
   * spec stroke widths pixel-constant across zoom. Critically, it does
   * **not** touch `spec.stroke.width`: the canonical spec stays as the
   * caller authored it, so a downstream `setConnectorStroke` (or a state-
   * config-driven `updateConnector` rebuild via `GraphLayer.rerenderEdge`)
   * supplies the new "base" width and the LOD multiplier applies on top
   * — no clobber, no inversion of caller intent.
   *
   * Path / obstacles / decorations are unchanged by a stroke-only
   * rescale, so this is the same shape as `setConnectorStroke`: skip
   * `recomputeConnectorPath`, just redraw on the cached path.
   */
  scaleConnectorStroke(id: string, scale: number): void {
    const inst = this.connectorInstances.get(id);
    if (!inst) return;
    inst.strokeWidthScale = scale;
    this.drawConnectorInstance(inst);
  }

  /**
   * Draw a connector with `inst.strokeWidthScale` baked into the spec's
   * stroke width. The original `inst.spec` is unchanged — only the spec
   * handed to `inst.connector.draw` carries the scaled width.
   *
   * The multiplication also flows through markers (sized off the stroke
   * width via `*Scale` multipliers) and the trimmed body path (computed
   * from stroke width), so the whole connector visual scales coherently.
   */
  private drawConnectorInstance(inst: ConnectorInstance): void {
    const k = inst.strokeWidthScale;
    const stroke = inst.spec.stroke;
    if (k === 1 || !stroke || stroke.width === undefined) {
      inst.connector.draw(inst.spec, inst.path);
      return;
    }
    const scaledSpec = {
      ...inst.spec,
      stroke: { ...stroke, width: stroke.width * k },
    };
    inst.connector.draw(scaledSpec, inst.path);
  }

  /**
   * Max end-padding across every decoration attached to `inst`. Decorations
   * declare their outer extent via `getEndPadding()`; we take the max per
   * endpoint so a glow with radius 16 and a ripple with maxRadius 24 on the
   * same edge result in a 24-px inset at each end (both reach the anchor;
   * the glow stops 8 px short, which is the intended "smaller halo" look).
   */
  private aggregateConnectorPadding(inst: ConnectorInstance): { source: number; target: number } {
    let src = 0;
    let tgt = 0;
    for (const deco of inst.decorations.values()) {
      if (typeof deco.getEndPadding !== 'function') continue;
      const p = deco.getEndPadding();
      if (p.source > src) src = p.source;
      if (p.target > tgt) tgt = p.target;
    }
    return { source: src, target: tgt };
  }

  /**
   * Max resting outer extent across every shape decoration attached to
   * `inst`. Read by `LabelDecoration` (via `ShapeDecorationHostInfo`) so
   * outside-placement labels offset past the outermost ring / halo on the
   * host. Decorations that don't paint past the silhouette (label,
   * marching-ants) omit `getOuterExtent` and contribute `0`; animated
   * transients (pulse-ring) deliberately report `0` so the label doesn't
   * yo-yo with the pulse.
   */
  private aggregateShapeOuterExtent(inst: ShapeInstance): number {
    let max = 0;
    for (const deco of inst.decorations.values()) {
      if (typeof deco.getOuterExtent !== 'function') continue;
      const v = deco.getOuterExtent();
      if (v > max) max = v;
    }
    return max;
  }

  removeConnector(id: string): void {
    const inst = this.connectorInstances.get(id);
    if (!inst) return;
    // Cascade-remove attached badges *before* destroying the host so the
    // badge ids don't outlive the host in any consumer-visible state.
    // Mirrors the symmetric path in `removeShape`.
    const attached = this.badges.get(id);
    if (attached) {
      for (const slot of [...attached.keys()]) this.removeBadge(id, slot);
      this.badges.delete(id);
    }
    for (const deco of inst.decorations.values()) this.disposeDecoration(deco);
    inst.decorations.clear();
    for (const fx of inst.effects.values()) this.disposeEffect(fx);
    inst.effects.clear();
    this.connectorHostsWithEffects.delete(inst);
    this.hit.remove(id);
    this.movedConnectorHits.delete(id);
    inst.connector.destroy();
    this.connectorInstances.delete(id);
  }

  // ─── Decorations ────────────────────────────────────────────────────────

  setDecoration<TStyle = unknown>(
    targetId: string,
    slot: string,
    decoration: DecorationSpec<TStyle> | null,
  ): void {
    const shape = this.shapeInstances.get(targetId);
    const connector = this.connectorInstances.get(targetId);
    if (!shape && !connector) {
      throw new Error(`PrimitivesRenderer.setDecoration: unknown target "${targetId}"`);
    }

    const decorations = (shape ?? connector!).decorations as Map<
      string,
      IDecorationBase<unknown>
    >;
    const prev = decorations.get(slot);
    if (prev) this.disposeDecoration(prev);

    if (decoration === null) {
      decorations.delete(slot);
      // Removing a decoration may shrink the aggregated padding for the
      // connector — re-route + redraw on the new (less-trimmed) path.
      if (connector) this.recomputeConnectorPath(connector);
      // Shape analogue: dropping a ring / halo shrinks the aggregated outer
      // extent, so any LabelDecoration on the same host needs to re-flow
      // back toward the silhouette.
      if (shape) this.refreshShapeDecorations(shape);
      return;
    }

    const entry = this.decorationRegistry.get(decoration.kind);
    if (!entry) {
      throw new Error(`PrimitivesRenderer.setDecoration: unknown kind "${decoration.kind}"`);
    }

    const targetKind: DecorationTarget = shape ? 'shape' : 'connector';
    if (entry.target !== 'both' && entry.target !== targetKind) {
      throw new Error(
        `PrimitivesRenderer.setDecoration: kind "${decoration.kind}" targets ` +
          `"${entry.target}" but host is a ${targetKind}`,
      );
    }

    const z = slotZIndex(slot, decoration.kind);
    if (shape) {
      const ctor = entry.ctor as ShapeDecorationCtor;
      const deco = new ctor(decoration.style);
      shape.shape.gfx.sortableChildren = true;
      // Aggregate must include the new decoration's contribution — set it
      // into the map first so `aggregateShapeOuterExtent` picks it up, then
      // mount.
      decorations.set(slot, deco);
      const outerDecorationExtent = this.aggregateShapeOuterExtent(shape);
      const host: ShapeDecorationHostInfo = {
        hostId: targetId,
        slot,
        slotZIndex: z,
        bounds: shape.shape.bounds(),
        surface: shape.shape.gfx,
        shape: shape.shape,
        outerDecorationExtent,
      };
      deco.mount(host);
      if (typeof deco.tick === 'function') {
        this.animated.add(deco as AnimatedDecoration);
      }
      if (decoHasSetResolution(deco)) this.labelBearingDecorations.add(deco);
      this.applyTrackedLabelResolution(deco);
      // Refresh siblings so any LabelDecoration on this host re-flows past
      // the new ring / halo. Skip the just-mounted decoration — we already
      // gave it the up-to-date aggregate above.
      this.refreshShapeDecorations(shape, deco);
    } else {
      const ctor = entry.ctor as ConnectorDecorationCtor;
      const deco = new ctor(decoration.style);
      connector!.connector.gfx.sortableChildren = true;
      const host: ConnectorDecorationHostInfo = {
        hostId: targetId,
        slot,
        slotZIndex: z,
        path: connector!.path,
        surface: connector!.connector.gfx,
        connector: connector!.connector,
        connectorSpec: connector!.spec,
      };
      deco.mount(host);
      decorations.set(slot, deco);
      if (typeof deco.tick === 'function') {
        this.animated.add(deco as AnimatedDecoration);
      }
      if (decoHasSetResolution(deco)) this.labelBearingDecorations.add(deco);
      this.applyTrackedLabelResolution(deco);
      // Now that the decoration is in the map, re-aggregate padding and
      // re-route the path. `recomputeConnectorPath` redraws the body /
      // markers on the trimmed path and refreshes every decoration
      // (including the one we just mounted) with the new host info.
      this.recomputeConnectorPath(connector!);
    }
  }

  // ─── Effects ────────────────────────────────────────────────────────────

  /**
   * Attach (or detach with `null`) an effect to a shape at the given slot.
   * Effects don't draw — they modulate the host shape's transform and/or
   * style. Multiple effects per host stack: transform deltas compose
   * additively (translations + rotation) and multiplicatively (scale);
   * style channels are last-writer-wins per channel by insertion order.
   *
   * Connector effects are supported and modulate the host connector's
   * style channels (tint + alpha). Transform deltas on a path-resolved
   * primitive have no coherent meaning, so transform effects on connector
   * hosts are ignored at aggregation time.
   */
  setEffect<TStyle = unknown>(
    targetId: string,
    slot: string,
    effect: EffectSpec<TStyle> | null,
  ): void {
    const shape = this.shapeInstances.get(targetId);
    if (shape) {
      this.setShapeEffect(shape, targetId, slot, effect);
      return;
    }
    const connector = this.connectorInstances.get(targetId);
    if (connector) {
      this.setConnectorEffect(connector, targetId, slot, effect);
      return;
    }
    throw new Error(`PrimitivesRenderer.setEffect: unknown target "${targetId}"`);
  }

  private setShapeEffect<TStyle>(
    shape: ShapeInstance,
    targetId: string,
    slot: string,
    effect: EffectSpec<TStyle> | null,
  ): void {
    const prev = shape.effects.get(slot);
    if (prev) this.disposeEffect(prev);

    if (effect === null) {
      shape.effects.delete(slot);
      if (shape.effects.size === 0) {
        this.hostsWithEffects.delete(shape);
        this.resetHostToBaseline(shape);
      }
      return;
    }

    const entry = this.effectRegistry.get(effect.kind);
    if (!entry) {
      throw new Error(`PrimitivesRenderer.setEffect: unknown kind "${effect.kind}"`);
    }
    if (entry.target !== 'both' && entry.target !== 'shape') {
      throw new Error(
        `PrimitivesRenderer.setEffect: kind "${effect.kind}" targets "${entry.target}" but host is a shape`,
      );
    }

    const fx = new (entry.ctor as ShapeEffectCtor)(effect.style) as IShapeEffect;
    const host: ShapeEffectHostInfo = {
      hostId: targetId,
      slot,
      bounds: shape.shape.bounds(),
      shape: shape.shape,
    };
    fx.mount(host);
    shape.effects.set(slot, fx);
    this.hostsWithEffects.add(shape);
    if (typeof fx.tick === 'function') {
      this.animatedEffects.add(fx as AnimatedEffect);
    }
    this.applyEffectsToHost(shape);
  }

  private setConnectorEffect<TStyle>(
    connector: ConnectorInstance,
    targetId: string,
    slot: string,
    effect: EffectSpec<TStyle> | null,
  ): void {
    const prev = connector.effects.get(slot);
    if (prev) this.disposeEffect(prev);

    if (effect === null) {
      connector.effects.delete(slot);
      if (connector.effects.size === 0) {
        this.connectorHostsWithEffects.delete(connector);
        this.resetConnectorToBaseline(connector);
      }
      return;
    }

    const entry = this.effectRegistry.get(effect.kind);
    if (!entry) {
      throw new Error(`PrimitivesRenderer.setEffect: unknown kind "${effect.kind}"`);
    }
    if (entry.target !== 'both' && entry.target !== 'connector') {
      throw new Error(
        `PrimitivesRenderer.setEffect: kind "${effect.kind}" targets "${entry.target}" but host is a connector`,
      );
    }

    const fx = new (entry.ctor as ConnectorEffectCtor)(effect.style) as IConnectorEffect;
    const host: ConnectorEffectHostInfo = {
      hostId: targetId,
      slot,
      connector: connector.connector,
    };
    fx.mount(host);
    connector.effects.set(slot, fx);
    this.connectorHostsWithEffects.add(connector);
    if (typeof fx.tick === 'function') {
      this.animatedEffects.add(fx as AnimatedEffect);
    }
    this.applyEffectsToConnector(connector);
  }

  // ─── Badges ─────────────────────────────────────────────────────────────

  /**
   * Attach a badge to a host shape. The badge is registered as a real shape
   * under id `` `${hostId}:${slot}` `` so it inherits every shape capability —
   * any registered shape kind as the plate, any `ShapeFillLayer` as content
   * (solid / image / glyph / svg / svg-url), and any registered decoration
   * via the `decorations` field.
   *
   * On `updateShape(hostId, …)` every attached badge re-anchors automatically.
   * On `removeShape(hostId)` every attached badge is removed first.
   *
   * Calling `setBadge` with the same `(hostId, slot)` replaces the previous
   * badge (the old badge shape and any of its decorations are destroyed).
   */
  setBadge(hostId: string, slot: string, options: BadgeOptions): void {
    const shapeHost = this.shapeInstances.get(hostId);
    const connectorHost = shapeHost ? undefined : this.connectorInstances.get(hostId);
    if (!shapeHost && !connectorHost) {
      throw new Error(`PrimitivesRenderer.setBadge: unknown host "${hostId}"`);
    }

    const badgeId = badgeIdFor(hostId, slot);
    if (this.shapeInstances.has(badgeId)) this.removeShape(badgeId);

    // Instantiate at (0, 0); read `bounds()` from the live shape instance
    // (works for any registered shape kind without a separate bounds-from-spec
    // contract) and update to the resolved world position synchronously.
    // No render frame happens between the two calls, so the (0, 0) position
    // is never observed by the user.
    this.addShape(badgeId, { ...options.shape, x: 0, y: 0 } as unknown as BaseShapeSpec);
    const badge = this.shapeInstances.get(badgeId)!;

    if (shapeHost) {
      const pos = resolveBadgePosition(
        this.shapeWorldBounds(shapeHost),
        badge.shape.bounds(),
        options,
      );
      this.updateShape(badgeId, { x: pos.x, y: pos.y });
    } else {
      const clearance = this.connectorBadgeEndpointClearance(connectorHost!);
      const pos = resolveConnectorBadgePosition(
        connectorHost!.path,
        badge.shape.bounds(),
        options,
        clearance,
      );
      this.updateShape(badgeId, { x: pos.x, y: pos.y, rotation: pos.rotation });
    }

    if (options.decorations) {
      for (const [decoSlot, decoSpec] of Object.entries(options.decorations)) {
        this.setDecoration(badgeId, decoSlot, decoSpec);
      }
    }

    if (options.effects) {
      for (const [effectSlot, effectSpec] of Object.entries(options.effects)) {
        this.setEffect(badgeId, effectSlot, effectSpec);
      }
    }

    let map = this.badges.get(hostId);
    if (!map) {
      map = new Map();
      this.badges.set(hostId, map);
    }
    map.set(slot, options);
  }

  removeBadge(hostId: string, slot: string): void {
    const map = this.badges.get(hostId);
    if (!map || !map.has(slot)) return;
    const badgeId = badgeIdFor(hostId, slot);
    this.removeShape(badgeId);
    map.delete(slot);
    if (map.size === 0) this.badges.delete(hostId);
  }

  hasBadge(hostId: string, slot: string): boolean {
    return this.badges.get(hostId)?.has(slot) ?? false;
  }

  /**
   * Recompute every attached badge's `(x, y)` from the host's new bounds.
   * Called from `updateShape` when the host has badges; safe to no-op when
   * the badge map for `hostId` is empty. Shape-host flavour only; see
   * {@link reanchorConnectorBadges} for the connector-path flavour.
   */
  private reanchorBadges(hostId: string): void {
    const map = this.badges.get(hostId);
    if (!map) return;
    const host = this.shapeInstances.get(hostId);
    if (!host) return;
    const hostBounds = this.shapeWorldBounds(host);
    for (const [slot, options] of map) {
      const badge = this.shapeInstances.get(badgeIdFor(hostId, slot));
      if (!badge) continue;
      const pos = resolveBadgePosition(hostBounds, badge.shape.bounds(), options);
      this.updateShape(badgeIdFor(hostId, slot), { x: pos.x, y: pos.y });
    }
  }

  /**
   * Recompute every attached badge's `(x, y, rotation)` from the connector
   * host's new path. Called from {@link recomputeConnectorPath} whenever
   * the routed path changes (source / target shape moved, anchor / router /
   * waypoints reconfigured, marker insets adjusted).
   */
  private reanchorConnectorBadges(inst: ConnectorInstance, hostId: string): void {
    const map = this.badges.get(hostId);
    if (!map) return;
    const clearance = this.connectorBadgeEndpointClearance(inst);
    for (const [slot, options] of map) {
      const badge = this.shapeInstances.get(badgeIdFor(hostId, slot));
      if (!badge) continue;
      const pos = resolveConnectorBadgePosition(
        inst.path,
        badge.shape.bounds(),
        options,
        clearance,
      );
      this.updateShape(badgeIdFor(hostId, slot), {
        x: pos.x,
        y: pos.y,
        rotation: pos.rotation,
      });
    }
  }

  /**
   * Per-endpoint clearance to apply when an endpoint-anchored badge sits
   * on a connector — marker length (so the arrowhead isn't tucked under
   * the badge) plus {@link DEFAULT_ENDPOINT_BADGE_GAP_PX} of visual gap.
   *
   * Independent of decoration `getEndPadding()` (which feeds path-trim
   * for the body stroke); markers paint at the *untrimmed* endpoints, so
   * we have to look at the marker spec directly.
   */
  private connectorBadgeEndpointClearance(
    inst: ConnectorInstance,
  ): { source: number; target: number } {
    const strokeWidth = inst.spec.stroke?.width ?? 1;
    const sourceMarkerInset = inst.spec.sourceMarker
      ? markerInsetFor(this.shapeRegistry, inst.spec.sourceMarker, strokeWidth)
      : 0;
    const targetMarkerInset = inst.spec.targetMarker
      ? markerInsetFor(this.shapeRegistry, inst.spec.targetMarker, strokeWidth)
      : 0;
    return {
      source: sourceMarkerInset + DEFAULT_ENDPOINT_BADGE_GAP_PX,
      target: targetMarkerInset + DEFAULT_ENDPOINT_BADGE_GAP_PX,
    };
  }

  // ─── LOD / labels ───────────────────────────────────────────────────────

  setLODLevel(id: string, level: number): void {
    const inst = this.shapeInstances.get(id);
    if (!inst) return;
    if (inst.shape.setLODLevel) {
      inst.shape.setLODLevel(level);
      return;
    }
    inst.shape.gfx.visible = level > 0;
  }

  rasteriseLabel(id: string, resolution: number): void {
    const inst = this.shapeInstances.get(id);
    if (!inst) return;
    inst.shape.setLabelResolution?.(resolution);
  }

  /**
   * Push a rasterisation resolution to every label decoration (shape + edge)
   * currently attached, and remember it so labels mounted later inherit the
   * same fidelity. Driven by zoom-aware behaviours
   * (see `@invana/graph` / `TextResolutionLODBehaviour`): when the camera
   * zooms past a threshold, push `dpr * zoom` to re-rasterise glyphs sharp.
   *
   * Idempotent: Pixi internally short-circuits `Text.resolution` writes when
   * the value matches, so calling this with the unchanged value every frame
   * is safe and cheap.
   */
  setLabelsResolution(resolution: number): void {
    if (!Number.isFinite(resolution) || resolution <= 0) return;
    // Identity short-circuit — keeps repeat pushes from churning the
    // viewport sweep below.
    if (this.trackedLabelResolution === resolution) return;
    this.trackedLabelResolution = resolution;
    // Label *decorations* re-raster via the frame-tick sweep (viewport-budgeted
    // — see the label-bearing decoration set). Shapes with internal text
    // (composite `label` parts) aren't decorations, so push directly here; the
    // optional call is a no-op for atomic shapes and composites are few.
    for (const inst of this.shapeInstances.values()) inst.shape.setLabelResolution?.(resolution);
  }

  /**
   * Forward the tracked label resolution to `deco` when it exposes a
   * `setResolution` method. Called on every label mount (so a newly-added
   * label inherits the current resolution immediately, no waiting for the
   * next tier-change to populate it).
   */
  private applyTrackedLabelResolution(deco: IDecorationBase<unknown>): void {
    if (this.trackedLabelResolution === null) return;
    const withResolution = deco as unknown as { setResolution?: (r: number) => void };
    withResolution.setResolution?.(this.trackedLabelResolution);
  }

  // ─── Per-frame animation ────────────────────────────────────────────────

  tickAnimations(deltaMs: number): void {
    if (this.animated.size > 0) {
      for (const deco of this.animated) {
        const keep = deco.tick(deltaMs);
        if (!keep) this.animated.delete(deco);
      }
    }

    if (this.animatedEffects.size > 0) {
      for (const fx of this.animatedEffects) {
        const keep = fx.tick(deltaMs);
        if (!keep) this.animatedEffects.delete(fx);
      }
    }

    if (this.hostsWithEffects.size > 0) {
      for (const host of this.hostsWithEffects) {
        this.applyEffectsToHost(host);
      }
    }

    if (this.connectorHostsWithEffects.size > 0) {
      for (const host of this.connectorHostsWithEffects) {
        this.applyEffectsToConnector(host);
      }
    }

    if (this.trackedLabelResolution !== null && this.labelBearingDecorations.size > 0) {
      this.tickLabelRasterise();
    }
  }

  /**
   * Re-raster labels whose current resolution differs from the tracked
   * target, prioritising those currently inside the camera viewport so the
   * tier crossing reads as a fade-into-crispness on what the user is
   * looking at. Off-screen labels are deferred to subsequent ticks but
   * *not* skipped forever — once the in-view set converges, remaining
   * budget rolls over to off-screen labels so panning later lands on
   * already-crisp text. Bounds that come back degenerate (Infinity AABB
   * from a container that hasn't laid out yet) fall through to the second
   * pass and are treated as off-screen for this tick.
   *
   * Convergence: once every label matches the target, the loop is O(N)
   * `getResolution` checks per frame with zero texture work — negligible.
   */
  private tickLabelRasterise(): void {
    const target = this.trackedLabelResolution;
    if (target === null) return;
    const viewport = (this.camera.viewport as unknown as {
      getVisibleBounds: () => { x: number; y: number; width: number; height: number };
    }).getVisibleBounds();
    let budget = PrimitivesRenderer.LABEL_RASTER_PER_TICK;
    // First pass: in-viewport labels.
    const offscreen: Array<{ setResolution: (r: number) => void }> = [];
    for (const deco of this.labelBearingDecorations) {
      if (budget <= 0) break;
      const withRes = deco as unknown as {
        getResolution?: () => number | null;
        setResolution: (r: number) => void;
        gfx?: { getBounds?: () => { x: number; y: number; width: number; height: number } };
      };
      if (withRes.getResolution?.() === target) continue;
      const bounds = withRes.gfx?.getBounds?.();
      const inView = bounds !== undefined && isFiniteRect(bounds) && rectsIntersect(bounds, viewport);
      if (inView) {
        withRes.setResolution(target);
        budget--;
      } else {
        offscreen.push(withRes);
      }
    }
    // Second pass: spend the remaining budget on off-screen labels so they
    // converge in the background. Without this, a brand-new tier would
    // leave every off-screen label permanently stale (its bounds wouldn't
    // change until the camera pans past it).
    for (const deco of offscreen) {
      if (budget <= 0) break;
      deco.setResolution(target);
      budget--;
    }
  }

  /**
   * Aggregate every effect attached to `inst` and write the result onto the
   * host gfx. Resets to the spec baseline first so removing effects (or a
   * scale dropping to identity) cleanly reverts. Called every frame for
   * hosts with at least one effect, and synchronously on `setEffect` so
   * non-animated effects take effect immediately.
   */
  private applyEffectsToHost(inst: ShapeInstance): void {
    const { gfx } = inst.shape;
    const spec = inst.spec;
    const baseAlpha = spec.alpha ?? 1;
    const baseX = spec.x;
    const baseY = spec.y;

    let dx = 0;
    let dy = 0;
    let dRot = 0;
    let sx = 1;
    let sy = 1;
    let tint = 0xffffff;
    let alphaMul = 1;

    for (const fx of inst.effects.values()) {
      if (fx.target === 'transform' && fx.readTransform) {
        const d = fx.readTransform();
        if (d.dx) dx += d.dx;
        if (d.dy) dy += d.dy;
        if (d.dRot) dRot += d.dRot;
        if (d.sx !== undefined) sx *= d.sx;
        if (d.sy !== undefined) sy *= d.sy;
      } else if (fx.target === 'style' && fx.readStyle) {
        const s = fx.readStyle();
        if (s.tint !== undefined) tint = s.tint;
        if (s.alpha !== undefined) alphaMul *= s.alpha;
      }
    }

    // Pivot at the shape's local centre so scale and rotation deltas spin
    // around the visual centre (matters for shapes whose local origin isn't
    // the centre — e.g. RectShape is top-left). When scale and rotation are
    // identity, skip the pivot detour to keep the position math trivial.
    const needsCentredPivot = sx !== 1 || sy !== 1 || dRot !== 0;
    if (needsCentredPivot) {
      const b = inst.shape.bounds();
      const cx = b.x + b.width / 2;
      const cy = b.y + b.height / 2;
      gfx.pivot.set(cx, cy);
      gfx.position.set(baseX + dx + cx, baseY + dy + cy);
    } else {
      gfx.pivot.set(0, 0);
      gfx.position.set(baseX + dx, baseY + dy);
    }
    gfx.rotation = (spec.rotation ?? 0) + dRot;
    gfx.scale.set(sx, sy);
    gfx.alpha = baseAlpha * alphaMul;
    // Pixi v8 Container.tint is multiplicative; 0xffffff is identity.
    (gfx as unknown as { tint: number }).tint = tint;
  }

  /**
   * Aggregate every effect attached to a connector and write the result onto
   * `connector.gfx`. Resets to the spec baseline first so removing effects
   * cleanly reverts. Only style channels are honoured for connector hosts
   * (transform deltas on a path-resolved primitive have no coherent
   * meaning); transform effects on connectors contribute nothing.
   */
  private applyEffectsToConnector(inst: ConnectorInstance): void {
    const { gfx } = inst.connector;
    const baseAlpha = inst.spec.alpha ?? 1;

    let tint = 0xffffff;
    let alphaMul = 1;

    for (const fx of inst.effects.values()) {
      if (fx.target === 'style' && fx.readStyle) {
        const s = fx.readStyle();
        if (s.tint !== undefined) tint = s.tint;
        if (s.alpha !== undefined) alphaMul *= s.alpha;
      }
    }

    gfx.alpha = baseAlpha * alphaMul;
    (gfx as unknown as { tint: number }).tint = tint;
  }

  private resetConnectorToBaseline(inst: ConnectorInstance): void {
    const { gfx } = inst.connector;
    gfx.alpha = inst.spec.alpha ?? 1;
    (gfx as unknown as { tint: number }).tint = 0xffffff;
  }

  /** Restore the host gfx to its spec-derived baseline (used after the last effect is removed). */
  private resetHostToBaseline(inst: ShapeInstance): void {
    const { gfx } = inst.shape;
    const spec = inst.spec;
    gfx.pivot.set(0, 0);
    gfx.position.set(spec.x, spec.y);
    gfx.rotation = spec.rotation ?? 0;
    gfx.scale.set(1, 1);
    gfx.alpha = spec.alpha ?? 1;
    (gfx as unknown as { tint: number }).tint = 0xffffff;
  }

  // ─── Hit-testing + pointer router ────────────────────────────────────

  /**
   * Resolve the hit at a world point under render-order rules. Two
   * priority bands:
   *
   *   1. **Exact geometric hits** — any candidate whose
   *      `IHitArea.contains` (shapes) or stroke-tolerance polyline
   *      distance (connectors) covers the cursor. Ranked to match what
   *      is drawn on top:
   *        a. higher `zIndex` wins (mirrors visual stacking);
   *        b. on equal `zIndex`, a shape (node) beats a connector (edge)
   *           — shapes render above connectors;
   *        c. on equal `zIndex` *and* same kind, the closest one to its
   *           origin / polyline wins.
   *      So a node sitting over an edge takes the hit even when the edge's
   *      polyline passes nearer the cursor than the node's centre — and an
   *      edge with an explicitly higher `zIndex` still wins.
   *   2. **Floor fallback** — if NO exact hit, return the closest
   *      candidate whose origin sits within `hitFloorPx` screen pixels
   *      of the cursor. Lets tiny pinpoints stay hoverable in sparse
   *      regions without widening hit areas in dense ones.
   *
   * Returns `null` when nothing is hit.
   */
  /**
   * Enable / disable all picking for this renderer. When disabled, {@link hitTest}
   * returns `null` regardless of what's under the cursor — the owning layer flips
   * this from `onVisibleChange` so a hidden layer's elements aren't clickable.
   */
  setHitTestEnabled(enabled: boolean): void {
    this.hitEnabled = enabled;
  }

  hitTest(worldX: number, worldY: number, exclude?: ReadonlySet<string>): HitResult | null {
    if (!this.hitEnabled) return null;
    // Stale hit-bboxes from deferred moves / re-routes are reindexed once,
    // here — the first time a query actually needs accurate bounds. A layout
    // settle / drag that nobody hovers over never pays for it.
    this.flushMovedHits();
    const floorWorld = this.hitFloorWorld();
    const candidates = this.hit.query(worldX, worldY, floorWorld);
    if (candidates.length === 0) return null;

    let bestExact: { kind: 'shape' | 'connector'; id: string; distSq: number; zIndex: number } | null = null;
    let bestFloor: { kind: 'shape' | 'connector'; id: string; distSq: number } | null = null;
    const floorSq = floorWorld * floorWorld;

    for (const c of candidates) {
      // Skip excluded ids — e.g. a transient drag preview (rubber-band edge)
      // that sits under the cursor and would otherwise mask the real target.
      if (exclude?.has(c.id)) continue;
      const res = this.geometricHit(c.kind, c.id, worldX, worldY);
      if (!res) continue;
      if (res.exact) {
        // Rank to match render order: zIndex first (higher = on top), then
        // shape-over-connector on a tie (nodes draw above edges), then the
        // closest origin/polyline within the same kind.
        const kindRank = c.kind === 'shape' ? 1 : 0;
        const bestKindRank = bestExact && bestExact.kind === 'shape' ? 1 : 0;
        if (
          bestExact === null ||
          c.zIndex > bestExact.zIndex ||
          (c.zIndex === bestExact.zIndex &&
            (kindRank > bestKindRank ||
              (kindRank === bestKindRank && res.distSq < bestExact.distSq)))
        ) {
          bestExact = { kind: c.kind, id: c.id, distSq: res.distSq, zIndex: c.zIndex };
        }
      } else if (res.distSq <= floorSq) {
        if (bestFloor === null || res.distSq < bestFloor.distSq) {
          bestFloor = { kind: c.kind, id: c.id, distSq: res.distSq };
        }
      }
    }

    const winner = bestExact ?? bestFloor;
    return winner ? { kind: winner.kind, id: winner.id } : null;
  }

  /**
   * Squared tolerance (world units) for an *exact* connector hit:
   * `(strokeWidth / 2 + slop)²`. The slop adds 4 world units of
   * forgiveness on top of the stroke half-width since 1-px-stroke
   * lines are genuinely hard to click pixel-perfect.
   */
  private connectorHitToleranceSq(inst: ConnectorInstance): number {
    const sw = inst.spec.stroke?.width ?? 1;
    const slop = 4;
    const r = sw / 2 + slop;
    return r * r;
  }

  /**
   * Geometric test that returns *both* whether the cursor exactly
   * contains the shape/connector AND the squared distance to the
   * shape's origin (or to the connector's nearest polyline point) —
   * used together by {@link hitTest} for the two-band ranking.
   */
  private geometricHit(
    kind: 'shape' | 'connector',
    id: string,
    worldX: number,
    worldY: number,
  ): { exact: boolean; distSq: number } | null {
    if (kind === 'shape') {
      const inst = this.shapeInstances.get(id);
      if (!inst) return null;
      const dx = worldX - inst.spec.x;
      const dy = worldY - inst.spec.y;
      // World-space distance to the shape's origin — used for closest-
      // wins ranking + the floor-radius fallback. Independent of any
      // `gfx.scale` multiplier the shape carries (the visual centre
      // doesn't move under a uniform scale-about-origin).
      const distSq = dx * dx + dy * dy;
      // The shape's geometric `hitArea` operates in its *local* frame
      // — i.e. before `gfx.scale` is applied. `NodeScaleLODBehaviour`
      // (and `HoverActivateBehaviour.zoomedOutScale`) write `gfx.scale`
      // to inflate visuals without rebuilding geometry, so we must
      // divide world-space deltas by `gfxScale` before consulting
      // `contains` — otherwise a 5×-scaled shape whose visible
      // silhouette covers the cursor reports `false`.
      const s = inst.gfxScale || 1;
      const exact = inst.shape.getHitArea().contains(dx / s, dy / s);
      return { exact, distSq };
    }
    const inst = this.connectorInstances.get(id);
    if (!inst) return null;
    const poly = this.sampledConnectorPolyline(inst);
    const distSq = distanceToPolylineSq(poly, worldX, worldY);
    const exact = distSq <= this.connectorHitToleranceSq(inst);
    return { exact, distSq };
  }

  /** {@link hoverHysteresisPx} in world units at the current camera scale. */
  private hoverHysteresisWorld(): number {
    return this.hoverHysteresisPx / Math.max(this.camera.scale, 1e-6);
  }

  /** {@link hoverNodeIncidencePx} in world units at the current camera scale. */
  private hoverIncidenceWorld(): number {
    return this.hoverNodeIncidencePx / Math.max(this.camera.scale, 1e-6);
  }

  /**
   * Hover-specific pick: {@link hitTest}'s winner, refined by two hover-only
   * heuristics that make tracing an edge out of a dense bundle reliable.
   * **Click / drag picking deliberately stays on the raw {@link hitTest}** — a
   * press must resolve exactly what is under the cursor, with no memory of the
   * last hover — so this method is called only from {@link routePointerMove}.
   *
   * - **Node-incidence bias (J).** When the raw winner is a connector but the
   *   cursor also sits within {@link hoverNodeIncidencePx} of a shape's centre,
   *   an edge *incident to that shape* (an endpoint at the node) is preferred
   *   over an unrelated edge merely passing through the region. Incident edges
   *   fan out and separate near their shared endpoint — where you aim. The test
   *   is purely geometric (endpoint ≈ node centre), so the renderer stays
   *   domain-free; it never inspects graph adjacency.
   * - **Hysteresis (I).** The currently-hovered element of the *same kind* is
   *   kept unless the new winner is closer by more than {@link hoverHysteresisPx}
   *   — and only while the old target is still genuinely under the cursor — so a
   *   sub-pixel jitter between two near-equidistant edges doesn't flicker the
   *   highlight.
   *
   * Falls back to identical behaviour to {@link hitTest} when both margins are
   * `0` or nothing nearby qualifies.
   */
  private pickHover(worldX: number, worldY: number): HitResult | null {
    if (!this.hitEnabled) return null;
    this.flushMovedHits();
    const floorWorld = this.hitFloorWorld();
    const incidenceWorld = this.hoverIncidenceWorld();
    // Widen the bbox query enough to also see the nearby shape centres the
    // incidence bias needs — otherwise a node whose centre is just outside the
    // hit-floor pad is invisible to the pick and the bias can't fire.
    const candidates = this.hit.query(worldX, worldY, Math.max(floorWorld, incidenceWorld));
    if (candidates.length === 0) return null;

    const floorSq = floorWorld * floorWorld;
    const incidenceSq = incidenceWorld * incidenceWorld;

    let bestExact: { kind: 'shape' | 'connector'; id: string; distSq: number; zIndex: number } | null = null;
    let bestFloor: { kind: 'shape' | 'connector'; id: string; distSq: number } | null = null;
    // Shape centres within the incidence radius of the cursor — the candidate
    // "nearby nodes" the incidence bias measures edge endpoints against.
    const nearbyCentres: Array<{ x: number; y: number }> = [];
    // Exact connector hits + their two endpoints, for the incidence test.
    const exactConnectors: Array<{ id: string; distSq: number; ax: number; ay: number; bx: number; by: number }> = [];

    for (const c of candidates) {
      if (c.kind === 'shape') {
        const inst = this.shapeInstances.get(c.id);
        if (!inst) continue;
        const dx = worldX - inst.spec.x;
        const dy = worldY - inst.spec.y;
        const distSq = dx * dx + dy * dy;
        if (distSq <= incidenceSq) nearbyCentres.push({ x: inst.spec.x, y: inst.spec.y });
        const s = inst.gfxScale || 1;
        if (inst.shape.getHitArea().contains(dx / s, dy / s)) {
          const bestKindRank = bestExact && bestExact.kind === 'shape' ? 1 : 0;
          if (
            bestExact === null ||
            c.zIndex > bestExact.zIndex ||
            (c.zIndex === bestExact.zIndex && (1 > bestKindRank || (1 === bestKindRank && distSq < bestExact.distSq)))
          ) {
            bestExact = { kind: 'shape', id: c.id, distSq, zIndex: c.zIndex };
          }
        } else if (distSq <= floorSq && (bestFloor === null || distSq < bestFloor.distSq)) {
          bestFloor = { kind: 'shape', id: c.id, distSq };
        }
      } else {
        const inst = this.connectorInstances.get(c.id);
        if (!inst) continue;
        const poly = this.sampledConnectorPolyline(inst);
        const distSq = distanceToPolylineSq(poly, worldX, worldY);
        if (distSq <= this.connectorHitToleranceSq(inst) && poly.length >= 2) {
          const a = poly[0]!;
          const b = poly[poly.length - 1]!;
          exactConnectors.push({ id: c.id, distSq, ax: a.x, ay: a.y, bx: b.x, by: b.y });
          const bestKindRank = bestExact && bestExact.kind === 'shape' ? 1 : 0;
          if (
            bestExact === null ||
            c.zIndex > bestExact.zIndex ||
            (c.zIndex === bestExact.zIndex && (0 > bestKindRank || (0 === bestKindRank && distSq < bestExact.distSq)))
          ) {
            bestExact = { kind: 'connector', id: c.id, distSq, zIndex: c.zIndex };
          }
        } else if (distSq <= floorSq && (bestFloor === null || distSq < bestFloor.distSq)) {
          bestFloor = { kind: 'connector', id: c.id, distSq };
        }
      }
    }

    const base = bestExact ?? bestFloor;
    if (!base) return null;
    let win: { kind: 'shape' | 'connector'; id: string; distSq: number } = {
      kind: base.kind,
      id: base.id,
      distSq: base.distSq,
    };

    // (J) Node-incidence bias — only when the winner is an edge, we have a
    // nearby node, and the winning edge is *not* incident to it.
    if (win.kind === 'connector' && nearbyCentres.length > 0 && exactConnectors.length > 0) {
      const isIncident = (e: { ax: number; ay: number; bx: number; by: number }): boolean =>
        nearbyCentres.some(
          (n) =>
            (e.ax - n.x) * (e.ax - n.x) + (e.ay - n.y) * (e.ay - n.y) <= incidenceSq ||
            (e.bx - n.x) * (e.bx - n.x) + (e.by - n.y) * (e.by - n.y) <= incidenceSq,
        );
      const winnerIncident = exactConnectors.some((e) => e.id === win.id && isIncident(e));
      if (!winnerIncident) {
        let bestInc: { id: string; distSq: number } | null = null;
        for (const e of exactConnectors) {
          if (isIncident(e) && (bestInc === null || e.distSq < bestInc.distSq)) {
            bestInc = { id: e.id, distSq: e.distSq };
          }
        }
        if (bestInc) win = { kind: 'connector', id: bestInc.id, distSq: bestInc.distSq };
      }
    }

    // (I) Hysteresis — keep the current same-kind hover unless the new winner is
    // closer by more than the margin, and only while the old target is still a
    // genuine hit under the cursor (re-probed here). Cross-kind moves (edge→node)
    // switch immediately so landing on a node always wins.
    const cur = this.currentHover;
    if (cur && cur.kind === win.kind && cur.id !== win.id) {
      const curHit = this.geometricHit(cur.kind, cur.id, worldX, worldY);
      if (curHit && (curHit.exact || curHit.distSq <= floorSq)) {
        const margin = this.hoverHysteresisWorld();
        if (Math.sqrt(win.distSq) + margin >= Math.sqrt(curHit.distSq)) {
          return { kind: cur.kind, id: cur.id };
        }
      }
    }

    return { kind: win.kind, id: win.id };
  }

  /**
   * Attach a single `globalpointer*` listener trio to the renderer's
   * container. Pixi's *global* pointer events fire on every move /
   * down / up regardless of which DisplayObject is under the cursor —
   * so one listener handles the whole renderer's hit-routing.
   *
   * Setting `eventMode = 'static'` on the container is the standard
   * Pixi v8 idiom for opting into the event system; we don't set a
   * `hitArea` because the container itself is never the dispatch
   * target — we delegate to {@link hitTest} on every move/down/up.
   */
  private installPointerRouter(): void {
    this._container.eventMode = 'static';
    // Always-true `hitArea` so the container catches `pointerdown` /
    // `pointerup` for the whole canvas. Without this, Pixi can't find
    // an interactive target on press (every shape's `eventMode` is
    // `'none'` so the router can do its own hit-testing), and our
    // `pointerdown` / `pointerup` listeners below never fire —
    // breaking `DragNodeBehaviour` and anything else that listens for
    // `shape:pointerdown` / `connector:pointerdown`. The container's
    // own pointer events are then routed through `hitTest` exactly
    // like the move stream. `globalpointermove` doesn't need this
    // (the `global` variant fires regardless of hit) but the regular
    // down / up events do.
    this._container.hitArea = { contains: () => true };

    // Move events are RAF-coalesced — only the latest pointer position
    // is resolved per frame. Without this, a fast mouse sweep over a
    // dense graph fires hundreds of pickAtWorld + hover-state churns
    // per second, swamping the renderer.
    const onMove = (e: FederatedPointerEvent): void => {
      this.pendingPointerMove = e;
      if (this.pointerMoveRaf !== null) return;
      this.pointerMoveRaf = requestAnimationFrame(() => {
        this.pointerMoveRaf = null;
        const pending = this.pendingPointerMove;
        this.pendingPointerMove = null;
        if (pending) this.routePointerMove(pending);
      });
    };
    const onDown = (e: FederatedPointerEvent): void => this.routePointerDown(e);
    const onUp = (e: FederatedPointerEvent): void => this.routePointerUp(e);

    this._container.on('globalpointermove', onMove);
    this._container.on('pointerdown', onDown);
    this._container.on('pointerup', onUp);
    this._container.on('pointerupoutside', onUp);

    this.pointerRouterUnsubs.push(
      () => this._container.off('globalpointermove', onMove),
      () => this._container.off('pointerdown', onDown),
      () => this._container.off('pointerup', onUp),
      () => this._container.off('pointerupoutside', onUp),
    );
  }

  private routePointerMove(e: FederatedPointerEvent): void {
    // Suppress hover state-changes while a pointer button is held.
    // The currently-hovered target stays highlighted through the
    // drag; on release, the next move resolves the cursor's actual
    // target and fires `pointerover` / `pointerout` normally.
    if (this.pointerDown) return;
    const w = this.camera.toWorld(e.global.x, e.global.y);
    // Hover uses the refined pick (hysteresis + node-incidence bias); click /
    // drag stay on the raw hitTest in routePointerDown / routePointerUp.
    const hit = this.pickHover(w.x, w.y);
    const prev = this.currentHover;

    // Sub-part hover runs every move (even within the same shape) so moving
    // between a card's rows fires partout/partover — independent of the
    // shape-level over/out diffing below.
    this.updatePartHover(hit, w.x, w.y);

    if (hit === null) {
      if (prev) {
        this.events.emit(`${prev.kind}:pointerout`, {
          id: prev.id, worldX: w.x, worldY: w.y,
        });
        this.currentHover = null;
        this.applyHoverCursor(null);
      }
      return;
    }

    if (prev && prev.kind === hit.kind && prev.id === hit.id) return;

    if (prev) {
      this.events.emit(`${prev.kind}:pointerout`, {
        id: prev.id, worldX: w.x, worldY: w.y,
      });
    }
    this.events.emit(`${hit.kind}:pointerover`, {
      id: hit.id, worldX: w.x, worldY: w.y,
    });
    this.currentHover = hit;
    this.applyHoverCursor(hit);
  }

  /**
   * Apply a hover cursor on the canvas DOM element. Skipped when a
   * pointer-capture interaction is in flight (`downHit != null`) so
   * behaviours like `DragNodeBehaviour` that own the cursor during a
   * drag (`'grabbing'`) aren't overridden mid-gesture.
   */
  private applyHoverCursor(hit: { kind: 'shape' | 'connector'; id: string } | null): void {
    if (!this.canvasElement) return;
    if (this.downHit) return;
    this.canvasElement.style.cursor = hit ? 'pointer' : '';
  }

  /**
   * Resolve the `hitId` of the sub-part under a world point for a shape hit, or
   * `undefined` (not a shape / no `hitTestPart` / no part there). Local
   * coordinates mirror {@link geometricHit}: `(world − spec.origin) / gfxScale`.
   * Shared by hover ({@link updatePartHover}) and right-click routing.
   */
  private partIdAt(hit: HitResult | null, worldX: number, worldY: number): string | undefined {
    if (!hit || hit.kind !== 'shape') return undefined;
    const inst = this.shapeInstances.get(hit.id);
    if (!inst?.shape.hitTestPart) return undefined;
    const s = inst.gfxScale || 1;
    return inst.shape.hitTestPart((worldX - inst.spec.x) / s, (worldY - inst.spec.y) / s);
  }

  /**
   * Diff the sub-part under the cursor against {@link currentPart} to emit
   * `shape:partout` (leaving a part) / `shape:partover` (entering one). Atomic
   * shapes (no `hitTestPart`) never produce part events.
   */
  private updatePartHover(hit: HitResult | null, worldX: number, worldY: number): void {
    const partId = this.partIdAt(hit, worldX, worldY);
    const cur = this.currentPart;
    // Leaving the current part — off the shape, or onto a different part.
    if (cur && (partId === undefined || cur.id !== hit?.id || cur.partId !== partId)) {
      this.events.emit('shape:partout', { id: cur.id, partId: cur.partId });
      this.currentPart = null;
    }
    // Entering a part (only when not already tracking one).
    if (partId !== undefined && hit && this.currentPart === null) {
      this.events.emit('shape:partover', { id: hit.id, partId, worldX, worldY });
      this.currentPart = { id: hit.id, partId };
    }
  }

  private routePointerDown(e: FederatedPointerEvent): void {
    this.pointerDown = true;
    const w = this.camera.toWorld(e.global.x, e.global.y);
    const hit = this.hitTest(w.x, w.y);
    if (!hit) {
      this.downHit = null;
      return;
    }
    this.events.emit(`${hit.kind}:pointerdown`, {
      id: hit.id, worldX: w.x, worldY: w.y, button: e.button, pointerId: e.pointerId,
    });
    this.downHit = { kind: hit.kind, id: hit.id, button: e.button };
  }

  private routePointerUp(e: FederatedPointerEvent): void {
    this.pointerDown = false;
    const w = this.camera.toWorld(e.global.x, e.global.y);
    const hit = this.hitTest(w.x, w.y);

    if (!hit) {
      // Right-button release on empty canvas → background context menu.
      // There's no shape/connector to attribute a pointerup/click to, so this
      // is the only event the renderer surfaces for an empty-canvas right-click.
      if (e.button === 2) {
        this.events.emit('background:contextmenu', { worldX: w.x, worldY: w.y });
      }
      this.downHit = null;
      return;
    }

    this.events.emit(`${hit.kind}:pointerup`, {
      id: hit.id, worldX: w.x, worldY: w.y, button: e.button, pointerId: e.pointerId,
    });

    const down = this.downHit;
    this.downHit = null;
    if (!down) return;
    if (down.kind !== hit.kind || down.id !== hit.id) return;
    if (down.button !== e.button) return;

    if (e.button === 0) {
      this.events.emit(`${hit.kind}:click`, {
        id: hit.id, worldX: w.x, worldY: w.y, button: 0,
      });
      // Manual double-click detection — Pixi's federated `e.detail`
      // counter isn't available on `globalpointer*` paths the same way,
      // so we track per-target click timestamps ourselves. 350ms matches
      // common OS double-click intervals; same target required.
      const now = performance.now();
      const last = this.lastLeftClick;
      if (last && last.kind === hit.kind && last.id === hit.id && now - last.t < 350) {
        this.events.emit(`${hit.kind}:doubleclick`, {
          id: hit.id, worldX: w.x, worldY: w.y, button: 0,
        });
        this.lastLeftClick = null;
      } else {
        this.lastLeftClick = { kind: hit.kind, id: hit.id, t: now };
      }
    } else if (e.button === 2) {
      // Over a hittable sub-part → the part-scoped menu; otherwise the
      // shape/connector-level menu. Mutually exclusive per right-click.
      const partId = this.partIdAt(hit, w.x, w.y);
      if (partId !== undefined) {
        this.events.emit('shape:partcontextmenu', { id: hit.id, partId, worldX: w.x, worldY: w.y });
      } else {
        this.events.emit(`${hit.kind}:contextmenu`, {
          id: hit.id, worldX: w.x, worldY: w.y,
        });
      }
    }
  }

  /**
   * `hitFloorPx` translated into world units at the current camera scale.
   * The clamp guards against a zero/NaN scale from a misconfigured camera —
   * with a divide-by-zero, the floor would balloon to `Infinity` and every
   * pointer event would hit every shape.
   */
  private hitFloorWorld(): number {
    const scale = this.camera.scale;
    return this.hitFloorPx / Math.max(scale, 1e-6);
  }

  // ─── Diagnostics ────────────────────────────────────────────────────────

  getRenderStats(): RenderStats {
    return {
      shapes: this.shapeInstances.size,
      connectors: this.connectorInstances.size,
      animatedDecorations: this.animated.size,
    };
  }

  get shapeCount(): number {
    return this.shapeInstances.size;
  }

  get connectorCount(): number {
    return this.connectorInstances.size;
  }

  hasShape(id: string): boolean {
    return this.shapeInstances.has(id);
  }

  /**
   * Kind of the currently-installed shape with id `id`, or `undefined`
   * if no shape with that id exists.
   *
   * `GraphLayer.rerenderNode` / `updateNodeShape` use this to decide
   * between an instance-preserving `updateShape` (when the rebuilt spec
   * has the same kind — the common case) and a `removeShape + addShape`
   * fallback (when the kind changed, e.g. `circle` → `rect`, which
   * `updateShape` can't handle since the underlying `IShape` class is
   * fixed at construction time).
   */
  getShapeKind(id: string): string | undefined {
    return this.shapeInstances.get(id)?.spec.kind;
  }

  /**
   * Local AABB for the registered shape `kind`, derived from `spec` alone
   * without instantiating the shape's Pixi `Graphics`. Returns `undefined`
   * when the kind isn't registered, or when the registered ctor doesn't
   * implement `static boundsOf`.
   *
   * `spec.x` / `spec.y` are ignored — the returned rect is in the shape's
   * local (centre-relative) frame, so callers can reuse the same width /
   * height for every positioned instance of the kind. To get world-space
   * bounds for a mounted instance, use {@link getShapeWorldBounds}
   * instead.
   *
   * The argument's only required field is `kind`; pass either a full
   * positioned spec (with `x` / `y` / paint) or a bare shape-options
   * record (geometry only — `NodeStyle.shape` from `@invana/graph`).
   * Either way the shape's static `boundsOf` reads only its own
   * geometry params.
   *
   * Consumers (minimap footprint estimation, layouts that need node
   * sizes, label-collision pre-pass, the LOD behaviours) call this so
   * they don't have to switch over a closed kind enum — built-in shapes
   * and shapes registered at runtime via {@link registerShape} both
   * flow through the same hook.
   */
  boundsOfSpec(spec: { readonly kind: string }): Rect | undefined {
    const Ctor = this.shapeRegistry.get(spec.kind);
    return Ctor?.boundsOf?.(spec as never);
  }

  /**
   * Uniformly-scaled partial of the registered shape `kind`, with
   * geometry params multiplied by `factor`. Aspect ratio, angular
   * range, and vertex topology are preserved. Returns `undefined`
   * when the kind isn't registered or its ctor doesn't implement
   * `static scaleSpec`.
   *
   * The contract pairs with {@link boundsOfSpec}: scaling by `k`
   * scales the AABB exactly by `k`. Callers compose the returned
   * partial with paint channels (`fill` / `stroke`) and position
   * (`x` / `y`) themselves.
   *
   * Used by `NodeScaleLODBehaviour` to rewrite shape size as the
   * camera zooms, without switching over a closed kind enum. Shapes
   * that don't implement `scaleSpec` are simply skipped by the
   * LOD writer.
   */
  scaleShapeSpec(spec: { readonly kind: string }, factor: number): Record<string, unknown> | undefined {
    const Ctor = this.shapeRegistry.get(spec.kind);
    return Ctor?.scaleSpec?.(spec as never, factor) as Record<string, unknown> | undefined;
  }

  hasConnector(id: string): boolean {
    return this.connectorInstances.has(id);
  }

  /**
   * Currently-mounted decoration instance for shape (or connector) `id` at
   * `slot`, or `undefined` when no decoration is attached at that slot.
   *
   * Domain behaviours read this when they need to introspect a decoration's
   * exposed state — e.g. `CollapseExpandBehaviour` calls
   * `getDecoration(nodeId, 'collapse-toggle')` and reads the toggle's
   * cached hit geometry to test a pointer click against the button's
   * shape-local centre + radius.
   *
   * The returned object is the live `IDecorationBase` — callers should
   * treat it as read-only and not mutate the decoration's `style` directly
   * (use `setDecoration` to swap the style atomically).
   */
  getDecoration(id: string, slot: string): IDecorationBase<unknown> | undefined {
    const shape = this.shapeInstances.get(id);
    const connector = this.connectorInstances.get(id);
    if (!shape && !connector) return undefined;
    return (shape ?? connector!).decorations.get(slot) as IDecorationBase<unknown> | undefined;
  }

  /**
   * Densified polyline of the routed connector's path, in world coordinates,
   * or `null` when no connector with that id exists. Returns the same point
   * set used internally for hit-testing — so curved / orthogonal / bezier
   * connectors hand back their true visible silhouette, not the straight
   * source-to-target line.
   *
   * Domain-free read accessor for overview layers (e.g. `MiniMapLayer`) that
   * need to render the actual routed shape without re-running the router.
   * Cheap: only samples the cached `inst.path`; no router invocation.
   */
  getConnectorPolyline(id: string): readonly Point[] | null {
    const inst = this.connectorInstances.get(id);
    if (!inst) return null;
    return this.sampledConnectorPolyline(inst);
  }

  /**
   * Densified polyline of a connector's routed path, memoised on the instance
   * ({@link ConnectorInstance.sampledPolyline}) and cleared on re-route. Hover
   * hit-testing runs this per candidate on every `pointermove`; caching turns a
   * dense-graph resample storm into one sample per edge per re-route.
   */
  private sampledConnectorPolyline(inst: ConnectorInstance): Polyline {
    return (inst.sampledPolyline ??= samplePath(inst.path));
  }

  /**
   * Local-space AABB of a decoration's gfx container in world coordinates
   * (origin offset by the host). Returns `null` when no host or slot exists.
   *
   * Cheaper to call than `getGlobalBounds` because we don't traverse the
   * scene; just take the decoration's local bounds and offset by its
   * position. Used by `LabelCollisionBehaviour` and any other behaviour
   * that needs per-decoration screen geometry.
   */
  getDecorationWorldBounds(targetId: string, slot: string): Rect | null {
    const host =
      this.shapeInstances.get(targetId) ?? this.connectorInstances.get(targetId);
    if (!host) return null;
    const deco = host.decorations.get(slot);
    if (!deco) return null;
    const g = (deco as { gfx?: Container }).gfx;
    if (!g) return null;
    const lb = g.getLocalBounds();
    // Decoration gfx is parented to the host's gfx. The host's gfx has the
    // host position applied (shape: spec.x/y, connector: 0). Combine to get
    // world-space.
    const hostX = (host as { spec?: { x?: number; y?: number } }).spec?.x ?? 0;
    const hostY = (host as { spec?: { x?: number; y?: number } }).spec?.y ?? 0;
    return {
      x: hostX + g.position.x + lb.x,
      y: hostY + g.position.y + lb.y,
      width: lb.width,
      height: lb.height,
    };
  }

  /**
   * Show / hide a decoration's gfx without destroying it. Used by
   * collision-style behaviours that want to suppress overlapping labels for a
   * frame without paying the cost of re-mounting on the next reveal.
   *
   * No-op when `targetId` / `slot` doesn't resolve.
   */
  setDecorationVisible(targetId: string, slot: string, visible: boolean): void {
    const host =
      this.shapeInstances.get(targetId) ?? this.connectorInstances.get(targetId);
    if (!host) return;
    const deco = host.decorations.get(slot);
    if (!deco) return;
    const g = (deco as { gfx?: Container }).gfx;
    if (g) g.visible = visible;
  }

  /**
   * World-space AABB of the registered shape, or `null` when no shape with
   * that id exists. Domain-free read accessor for layer code that needs to
   * query shape geometry without poking at private state — e.g. a graph
   * layer building an obstacle list for an edge's router, a behaviour that
   * wants to fit content to a selection, or a debug overlay.
   */
  getShapeWorldBounds(id: string): Rect | null {
    const inst = this.shapeInstances.get(id);
    return inst ? this.shapeWorldBounds(inst) : null;
  }

  /**
   * World-space origin `(spec.x, spec.y)` of the registered shape, or `null`
   * when no shape with that id exists. Counterpart to `getShapeWorldBounds`;
   * use this when a behaviour needs the shape's translation point (drag
   * offset baseline, anchor for an external overlay, etc.).
   */
  getShapePosition(id: string): Point | null {
    const inst = this.shapeInstances.get(id);
    return inst ? { x: inst.spec.x, y: inst.spec.y } : null;
  }

  /**
   * World-space geometric **centre** of the registered shape's bounding box,
   * or `null` when no shape with that id exists. Differs from
   * `getShapePosition` for shapes whose local origin isn't the centre
   * (`RectShape` is anchored top-left; `CircleShape` is already centred).
   *
   * This is the canonical "anchor reference point" for layer code that wants
   * a uniform centre regardless of shape kind — connector routing, badge
   * placement, fit-to-content, etc.
   */
  getShapeCenter(id: string): Point | null {
    const inst = this.shapeInstances.get(id);
    if (!inst) return null;
    const b = inst.shape.bounds();
    return {
      x: inst.spec.x + b.x + b.width / 2,
      y: inst.spec.y + b.y + b.height / 2,
    };
  }

  /**
   * Text extent `content` would occupy if mounted as a `label` decoration,
   * or `null` for content this can't measure statically (`html-text`).
   *
   * Nothing is mounted, drawn or cached — this is a pure query against the
   * same font resolution the renderer uses, so a domain layer can size
   * geometry **around** a label (a tab, a header band, a chip) before that
   * label exists, without importing a drawing library to do it.
   */
  measureLabel(
    content: LabelContent,
    wrap?: LabelWrap,
  ): { width: number; height: number } | null {
    return measureLabelContent(content, wrap);
  }

  /**
   * Re-route every registered connector. Useful after a non-endpoint shape
   * moves (e.g. an obstacle) and you want connectors that auto-collect
   * obstacles to update their path.
   *
   * Each call re-runs `routePath` per connector and refreshes the hit index
   * and any connector decorations. Linear in `connectorInstances`; safe to
   * call from drag handlers in typical layouts. Heavy graphs with thousands
   * of edges should prefer a targeted re-route (future).
   */
  reRouteAllConnectors(): void {
    for (const inst of this.connectorInstances.values()) {
      inst.path = this.routePath(inst.spec);
      this.drawConnectorInstance(inst);
      this.indexConnector(inst);
      if (inst.decorations.size > 0) this.refreshConnectorDecorations(inst);
    }
  }

  // ─── Teardown ───────────────────────────────────────────────────────────

  destroy(): void {
    if (this.pointerMoveRaf !== null) {
      cancelAnimationFrame(this.pointerMoveRaf);
      this.pointerMoveRaf = null;
    }
    this.pendingPointerMove = null;
    for (const fn of this.pointerRouterUnsubs) fn();
    this.pointerRouterUnsubs = [];
    this.currentHover = null;
    this.currentPart = null;
    this.downHit = null;
    this.lastLeftClick = null;
    this.pointerDown = false;
    for (const id of [...this.shapeInstances.keys()]) this.removeShape(id);
    for (const id of [...this.connectorInstances.keys()]) this.removeConnector(id);
    this.animated.clear();
    this.hit.clear();
    this.movedShapeHits.clear();
    this.movedConnectorHits.clear();
    this.events.removeAllListeners();
  }

  // ─── Internals ──────────────────────────────────────────────────────────

  private shapeWorldBounds(inst: ShapeInstance): Rect {
    const local = inst.shape.bounds();
    const s = inst.gfxScale;
    return {
      x: inst.spec.x + local.x * s,
      y: inst.spec.y + local.y * s,
      width: local.width * s,
      height: local.height * s,
    };
  }

  private routePath(spec: BaseConnectorSpec): Path {
    const routerKind = spec.router ?? 'straight';
    const router = this.routerRegistry.get(routerKind);
    if (!router) {
      throw new Error(`PrimitivesRenderer: unknown router "${routerKind}"`);
    }
    const pathStyleKind = spec.pathStyle ?? 'normal';
    const pathStyle = this.pathStyleRegistry.get(pathStyleKind);
    if (!pathStyle) {
      throw new Error(`PrimitivesRenderer: unknown pathStyle "${pathStyleKind}"`);
    }

    // Pass 1: resolve both endpoints to a stable point (centre for shape
    // endpoints, literal for `kind: 'point'`). The pass-1 point of one
    // endpoint is the `fromPoint` for the other endpoint's anchor in pass 2.
    const sourceCenter = this.endpointCenter(spec.source);
    const targetCenter = this.endpointCenter(spec.target);

    // Pass 2: re-resolve each endpoint with its declared anchor.
    const source = this.resolveEndpoint(spec.source, targetCenter);
    const target = this.resolveEndpoint(spec.target, sourceCenter);

    // `obstacles` is a memoised getter — routers that don't read it (e.g.
    // `straight`, `orth`) avoid the O(shapes) per-connector cost. Critical
    // when `reanchorAllConnectors` re-routes thousands of straight edges
    // per zoom frame; without laziness the build is O(connectors × shapes).
    const resolveObstacles = (): ReadonlyArray<Obstacle> => this.resolveObstacles(spec);
    let obstaclesCache: ReadonlyArray<Obstacle> | null = null;
    const ctx: RouterCtx = {
      get obstacles(): ReadonlyArray<Obstacle> {
        if (obstaclesCache === null) obstaclesCache = resolveObstacles();
        return obstaclesCache;
      },
    };
    const polyline = router(source, target, spec.waypoints, spec.routerOpts, ctx);
    return pathStyle(polyline, spec.pathStyleOpts, { source, target });
  }

  /**
   * Build the obstacle list passed to the router. By default every shape in
   * the renderer except the source / target shapes (when those endpoints are
   * `kind: 'shape'`) is included. Each obstacle carries its AABB plus an
   * optional `containsInflated` silhouette test (when the shape exposes
   * `obstacleTest`) so routers can hug non-rect silhouettes tightly.
   *
   * Callers can override via `routerOpts.obstacles`:
   * - `'auto'` (default) — auto-collected as above.
   * - `'none'` — empty list; router runs as if no obstacles exist.
   * - `Obstacle[]` / `Rect[]` — verbatim list (used for testing or
   *   layer-specific filtering). Plain `Rect` entries are valid because
   *   `Obstacle extends Rect`; they fall back to AABB-only marking.
   */
  private resolveObstacles(spec: BaseConnectorSpec): ReadonlyArray<Obstacle> {
    const opt = (spec.routerOpts as
      | { obstacles?: 'auto' | 'none' | ReadonlyArray<Obstacle> }
      | undefined)?.obstacles;
    if (opt === 'none') return [];
    if (Array.isArray(opt)) return opt;
    const excludeIds = new Set<string>();
    if (spec.source.kind === 'shape') excludeIds.add(spec.source.shapeId);
    if (spec.target.kind === 'shape') excludeIds.add(spec.target.shapeId);
    const out: Obstacle[] = [];
    for (const [id, inst] of this.shapeInstances) {
      if (excludeIds.has(id)) continue;
      const bounds = this.shapeWorldBounds(inst);
      const containsInflated = inst.shape.obstacleTest?.();
      out.push({ ...bounds, containsInflated });
    }
    return out;
  }

  /**
   * Pass-1 endpoint resolution — stable, anchor-independent reference point.
   * Returns the shape's geometric bounding-box centre in world space (NOT
   * the raw `(spec.x, spec.y)` origin) so the anchor's pass-2 ray cast is
   * uniform across shape kinds.
   */
  private endpointCenter(spec: ConnectorEndpointSpec): Point {
    if (spec.kind === 'point') return { x: spec.x, y: spec.y };
    const inst = this.shapeInstances.get(spec.shapeId);
    if (!inst) {
      throw new Error(`PrimitivesRenderer: connector references unknown shape "${spec.shapeId}"`);
    }
    const b = inst.shape.bounds();
    const s = inst.gfxScale;
    return {
      x: inst.spec.x + (b.x + b.width / 2) * s,
      y: inst.spec.y + (b.y + b.height / 2) * s,
    };
  }

  /** Pass-2 endpoint resolution — applies the declared anchor for shape endpoints. */
  private resolveEndpoint(spec: ConnectorEndpointSpec, fromPoint: Point): Endpoint {
    if (spec.kind === 'point') {
      return { x: spec.x, y: spec.y, tangent: spec.tangent };
    }
    const inst = this.shapeInstances.get(spec.shapeId);
    if (!inst) {
      throw new Error(`PrimitivesRenderer: connector references unknown shape "${spec.shapeId}"`);
    }
    const { name, opts } = normalizeAnchorSpec(spec.anchor);
    const anchor = this.anchorRegistry.get(name);
    if (!anchor) {
      throw new Error(`PrimitivesRenderer: unknown anchor "${name}"`);
    }
    const ctx: AnchorCtx = { getShape: (id) => this.anchorShapeRef(id) };
    const result = anchor({ shapeId: spec.shapeId, opts }, fromPoint, ctx);

    // Optional outward `padding`: push the endpoint along the anchor's
    // tangent direction. Useful when a halo / glow decoration extends
    // beyond the silhouette and the connector should visibly start at
    // the halo's edge. No-op when the anchor returns no tangent.
    const padding = spec.padding ?? 0;
    if (padding === 0 || !result.tangent) return result;
    return {
      x: result.x + result.tangent.x * padding,
      y: result.y + result.tangent.y * padding,
      tangent: result.tangent,
    };
  }

  private anchorShapeRef(id: string): AnchorShapeRef | undefined {
    const inst = this.shapeInstances.get(id);
    if (!inst) return undefined;
    const localBounds = inst.shape.bounds();
    const s = inst.gfxScale;
    const bounds = s === 1
      ? localBounds
      : {
          x: localBounds.x * s,
          y: localBounds.y * s,
          width: localBounds.width * s,
          height: localBounds.height * s,
        };
    // When `gfxScale !== 1` the visible silhouette is a uniform scale of
    // the local geometry around the gfx origin. The anchor passes a
    // `localFromCenter` in *world units* relative to the (scaled) centre;
    // the shape's `boundaryIntersect` interprets its input in *unscaled*
    // local coords. Divide on the way in, multiply on the way out so the
    // returned point lands on the visible silhouette.
    const rawBoundary = inst.shape.boundaryIntersect?.bind(inst.shape);
    const boundaryIntersect = rawBoundary
      ? s === 1
        ? rawBoundary
        : (localFromCenter: Point): Point | null => {
            const p = rawBoundary({ x: localFromCenter.x / s, y: localFromCenter.y / s });
            return p === null ? null : { x: p.x * s, y: p.y * s };
          }
      : undefined;
    return {
      origin: { x: inst.spec.x, y: inst.spec.y },
      bounds,
      center: {
        x: inst.spec.x + bounds.x + bounds.width / 2,
        y: inst.spec.y + bounds.y + bounds.height / 2,
      },
      boundaryIntersect,
    };
  }

  private indexConnector(inst: ConnectorInstance): void {
    // A hidden connector (collapse self-loop or effectively-hidden edge) is
    // culled from drawing and must not be hittable either.
    if (inst.spec.visible === false || inst.path.length < 2) {
      this.hit.remove(inst.id);
      this.movedConnectorHits.delete(inst.id);
      return;
    }
    // Existing entry → defer the bbox refresh. `hit.insert` does an O(N) rbush
    // remove+insert; doing that per edge while a settle re-routes thousands of
    // edges each tick is O(N²). The deferred set is bulk-rebuilt (O(N log N),
    // once) on the next `hitTest`. A brand-new edge has no entry to update, so
    // it must insert now to be hittable.
    if (this.hit.has(inst.id)) {
      this.movedConnectorHits.add(inst.id);
      return;
    }
    this.hit.insert(inst.id, 'connector', this.connectorHitBoxes(inst), inst.spec.zIndex ?? 0);
  }

  /** World-space hit bbox for a connector: its path bounds inflated by half the
   * stroke width plus a small slop so thin edges stay grabbable. */
  private connectorHitRect(inst: ConnectorInstance): Rect {
    const bb = pathBounds(inst.path);
    const pad = (inst.spec.stroke?.width ?? 1) / 2 + 4;
    return { x: bb.x - pad, y: bb.y - pad, width: bb.width + pad * 2, height: bb.height + pad * 2 };
  }

  /**
   * World-space hit **boxes** for a connector — the segment-level hit index
   * (edge-pick correctness H). A single loose AABB over a long diagonal edge
   * makes that edge a candidate for every point in a huge empty box; splitting
   * the sampled polyline into up to {@link CONNECTOR_HIT_MAX_BOXES} tight boxes
   * (cut at equal arc-length, so straight diagonals subdivide and curves — which
   * `samplePath` already densifies — get one box per run) keeps the candidate
   * set to edges *physically near* the cursor, making "nearest" cheaper and more
   * meaningful in a bundle. Short edges collapse to one box (identical to
   * {@link connectorHitRect}), so nothing regresses.
   */
  private connectorHitBoxes(inst: ConnectorInstance): Rect[] {
    const poly = this.sampledConnectorPolyline(inst);
    const pad = (inst.spec.stroke?.width ?? 1) / 2 + 4;
    if (poly.length < 2) return [this.connectorHitRect(inst)];

    // Total arc length + per-segment lengths.
    let total = 0;
    const segLen: number[] = [];
    for (let i = 0; i < poly.length - 1; i++) {
      const a = poly[i]!;
      const b = poly[i + 1]!;
      const l = Math.hypot(b.x - a.x, b.y - a.y);
      segLen.push(l);
      total += l;
    }
    // One box below the split threshold — same loose AABB as before.
    const n = Math.min(CONNECTOR_HIT_MAX_BOXES, Math.max(1, Math.ceil(total / CONNECTOR_HIT_SPLIT_LEN)));
    if (n <= 1 || total === 0) return [this.connectorHitRect(inst)];

    const step = total / n;
    const rects: Rect[] = [];
    let boundary = step; // next arc-length cut
    let acc = 0; // arc length at the current segment's start point
    let minX = poly[0]!.x;
    let minY = poly[0]!.y;
    let maxX = minX;
    let maxY = minY;
    const expand = (x: number, y: number): void => {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    };
    const flush = (): void => {
      rects.push({ x: minX - pad, y: minY - pad, width: maxX - minX + pad * 2, height: maxY - minY + pad * 2 });
    };
    for (let i = 0; i < poly.length - 1; i++) {
      const a = poly[i]!;
      const b = poly[i + 1]!;
      const l = segLen[i]!;
      // Cut this segment wherever an arc-length boundary falls inside it, so a
      // long straight run still yields several boxes hugging the line.
      while (l > 0 && rects.length < n - 1 && boundary <= acc + l + 1e-9) {
        const t = (boundary - acc) / l;
        const cx = a.x + (b.x - a.x) * t;
        const cy = a.y + (b.y - a.y) * t;
        expand(cx, cy);
        flush();
        minX = maxX = cx;
        minY = maxY = cy;
        boundary += step;
      }
      expand(b.x, b.y);
      acc += l;
    }
    flush();
    return rects;
  }

  private refreshShapeDecorations(
    inst: ShapeInstance,
    skip?: IDecorationBase<ShapeDecorationHostInfo>,
  ): void {
    const bounds = inst.shape.bounds();
    const outerDecorationExtent = this.aggregateShapeOuterExtent(inst);
    for (const [slot, deco] of inst.decorations) {
      if (deco === skip) continue;
      if (!deco.update) continue;
      const host: ShapeDecorationHostInfo = {
        hostId: inst.id,
        slot,
        slotZIndex: slotZIndex(slot),
        bounds,
        surface: inst.shape.gfx,
        shape: inst.shape,
        outerDecorationExtent,
      };
      deco.update(host);
    }
  }

  private refreshConnectorDecorations(inst: ConnectorInstance): void {
    for (const [slot, deco] of inst.decorations) {
      if (!deco.update) continue;
      const host: ConnectorDecorationHostInfo = {
        hostId: inst.id,
        slot,
        slotZIndex: slotZIndex(slot),
        path: inst.path,
        surface: inst.connector.gfx,
        connector: inst.connector,
        connectorSpec: inst.spec,
      };
      deco.update(host);
    }
  }

  private disposeDecoration(deco: IDecorationBase<unknown>): void {
    if ('tick' in deco && typeof deco.tick === 'function') {
      this.animated.delete(deco as AnimatedDecoration);
    }
    if (decoHasSetResolution(deco)) this.labelBearingDecorations.delete(deco);
    // Best-effort destroy. A label decoration's Pixi `Text` returns its glyph
    // render-texture to Pixi's *process-shared* `TexturePool` on destroy; when
    // one `Canvas` is torn down while sibling canvases keep that pool live (e.g.
    // closing one of several mounted canvases — a "canvas boards" UI), the
    // size-bucket can be missing and Pixi throws inside `returnTexture`. Teardown
    // must stay resilient — one decoration's destroy throwing must not abort the
    // rest of the unmount — so swallow it here. (Deeper fix = per-renderer
    // texture pool so canvases never share teardown state; tracked separately.)
    try {
      deco.destroy?.();
    } catch {
      /* teardown is best-effort — see comment above */
    }
  }

  private disposeEffect(fx: IShapeEffect | IConnectorEffect): void {
    if (typeof fx.tick === 'function') {
      this.animatedEffects.delete(fx as AnimatedEffect);
    }
    fx.destroy?.();
  }
}

// ─── Slot z-band ────────────────────────────────────────────────────────────
//
// Decoration slots stack in a fixed visual order regardless of insertion order.
// Built-in slot names get well-known z-indices; unrecognised names fall into
// a default mid-band so callers can pick custom slot names without breaking
// ordering.
//
// Layout (bottom → top):
//   glow         −300
//   halo         −200
//   breathing    −150
//   pulse        −100
//   pulse-ring   −80
//   ring         −50
//   <shape>        0
//   liquid        20  (fills inside silhouette, above shape body)
//   <other>       50  (mid-band)
//   badge        300
//   fx           400

const SLOT_Z_TABLE: Readonly<Record<string, number>> = {
  glow: -300,
  halo: -200,
  breathing: -150,
  pulse: -100,
  'pulse-ring': -80,
  ring: -50,
  liquid: 20,
  label: 200,
  badge: 300,
  fx: 400,
};

const SLOT_Z_DEFAULT = 50;

/**
 * Resolve the z-band for a decoration. The `slot` is a caller-chosen mount key
 * — for sugar methods it equals the well-known band name (`glow`, `ring`,
 * `label`, …), but for state overlays it is an arbitrary id (e.g.
 * `canonical-select-halo`) chosen so per-layer overrides can swap/remove a
 * single decoration. When the slot itself isn't a known band, fall back to the
 * decoration's `kind` (`glow` → -300, `ring` → -50, …) so a selection halo
 * still renders *behind* the shape body instead of dropping to the mid-band
 * default (50) and painting over the host's text/geometry.
 */
function slotZIndex(slot: string, kind?: string): number {
  return SLOT_Z_TABLE[slot] ?? (kind !== undefined ? SLOT_Z_TABLE[kind] : undefined) ?? SLOT_Z_DEFAULT;
}

/** Stable id mapping `(hostId, slot)` → badge shape id. */
function badgeIdFor(hostId: string, slot: string): string {
  return `${hostId}:${slot}`;
}

/** Resolve an `AnchorSpec` (string or object form) to a `(name, opts)` pair. */
function normalizeAnchorSpec(
  spec: AnchorSpec | undefined,
): { name: string; opts?: Readonly<Record<string, unknown>> } {
  if (spec === undefined) return { name: 'center' };
  if (typeof spec === 'string') return { name: spec };
  return { name: spec.name, opts: spec.opts };
}

/**
 * Duck-type check for the `setResolution` hook used by label decorations
 * (`LabelDecoration` / `LabelConnectorDecoration`). Other decoration kinds
 * don't implement it, so the viewport-clipped rasterisation sweep can
 * skip them cheaply.
 */
function decoHasSetResolution(deco: IDecorationBase<unknown>): boolean {
  return typeof (deco as { setResolution?: unknown }).setResolution === 'function';
}

/** AABB intersection in screen / world coords. Half-open on the far edges. */
function rectsIntersect(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * Pixi v8's `Container.getBounds()` returns an Infinity-AABB for containers
 * whose content hasn't been laid out yet (no children with renderable
 * geometry attached). Filter those out — the label decoration just got
 * mounted; its real bounds will resolve on the next tick.
 */
function isFiniteRect(r: { x: number; y: number; width: number; height: number }): boolean {
  return (
    Number.isFinite(r.x) &&
    Number.isFinite(r.y) &&
    Number.isFinite(r.width) &&
    Number.isFinite(r.height)
  );
}
