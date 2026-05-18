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
 * - pathStyles  — `IPathStyle`            (built-ins: normal, rounded, bezier, bump-radial, bump-horizontal, step-radial, smooth, bundle, loop-curve, loop-orth)
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

import { Container, type IHitArea } from 'pixi.js';
import type { Camera } from '../camera/Camera';
import { EventEmitter } from '../events/EventEmitter';
import { TextureRegistry } from '../textures/TextureRegistry';
import { HitIndex } from '../hit/HitIndex';
import { ShapeInstance } from '../instancing/ShapeInstance';
import { ConnectorInstance } from '../instancing/ConnectorInstance';
import { CircleShape } from './shapes/CircleShape';
import { RectShape } from './shapes/RectShape';
import { PolygonShape } from './shapes/PolygonShape';
import { RegularPolygonShape } from './shapes/RegularPolygonShape';
import { StarShape } from './shapes/StarShape';
import { ArcShape } from './shapes/ArcShape';
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
import { loopCurvePathStyle } from './connectors/pathStyles/loopCurve';
import { loopOrthPathStyle } from './connectors/pathStyles/loopOrth';
import { centerAnchor } from './connectors/anchors/center';
import { boundaryAnchor } from './connectors/anchors/boundary';
import { perpendicularAnchor } from './connectors/anchors/perpendicular';
import { edgePortAnchor } from './connectors/anchors/edgePort';
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
import { LabelConnectorDecoration } from './decorations/connector/LabelConnectorDecoration';
import { ShakeEffect } from './effects/shape/ShakeEffect';
import { BreathingEffect } from './effects/shape/BreathingEffect';
import { BreathingConnectorEffect } from './effects/connector/BreathingConnectorEffect';
import { FadeInConnectorEffect } from './effects/connector/FadeInConnectorEffect';
import { resolveBadgePosition } from './badges/placement';
import type { BadgeOptions } from './badges/types';
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
  ConnectorEffectCtor,
  ConnectorEffectHostInfo,
  Obstacle,
  Path,
  Point,
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
}

/**
 * Minimum hover/click target in screen pixels — a renderer-level interaction
 * policy that backstops the primitive's geometric hit area. When a node or
 * edge shrinks below this many pixels on screen (low camera zoom, or a
 * physically tiny shape), the cursor still registers a hit within this many
 * pixels of the shape's local origin (or the connector's polyline).
 *
 * The floor never *shrinks* a hit area — it OR's with the primitive's exact
 * `IHitArea.contains`, so big shapes keep their precise silhouette boundary.
 *
 * Kept as a renderer-level constant rather than a `PrimitivesRendererOptions`
 * field until a real use case asks for it — touch-friendly stories might
 * want `8`, cursor-precision stories `4`. Promote to an option when needed.
 */
const MIN_HIT_PX = 6;

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
  readonly camera: Camera;
  private readonly textureRegistry: TextureRegistry;

  constructor(opts: PrimitivesRendererOptions) {
    this._container = opts.container;
    this.camera = opts.camera;
    this.textureRegistry = opts.textureRegistry ?? new TextureRegistry();
    // Insertion order = render order in Pixi. Adding the connector layer
    // first then the shape layer puts shapes on top — so any connector
    // decoration that extends past a path endpoint (glow halo, ripple
    // wave) is clipped visually by the overlapping shape.
    this.connectorLayer = new Container();
    this.shapeLayer = new Container();
    this._container.addChild(this.connectorLayer);
    this._container.addChild(this.shapeLayer);
    this.registerBuiltins();
  }

  private registerBuiltins(): void {
    this.registerShape('circle', CircleShape);
    this.registerShape('rect', RectShape);
    this.registerShape('polygon', PolygonShape);
    this.registerShape('regular-polygon', RegularPolygonShape);
    this.registerShape('star', StarShape);
    this.registerShape('arc', ArcShape);
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
    this.registerPathStyle('bump-radial', bumpRadialPathStyle);
    this.registerPathStyle('bump-horizontal', bumpHorizontalPathStyle);
    this.registerPathStyle('bundle', bundlePathStyle);
    this.registerPathStyle('step-radial', stepRadialPathStyle);
    this.registerPathStyle('smooth', smoothPathStyle);
    // Self-loop pathStyles — draw a petal / U-stub anchored at the first
    // polyline point. Pair with `router: 'straight'` and a connector whose
    // source and target reference the same shape.
    this.registerPathStyle('loop-curve', loopCurvePathStyle);
    this.registerPathStyle('loop-orth', loopOrthPathStyle);

    this.registerAnchor('center', centerAnchor);
    this.registerAnchor('boundary', boundaryAnchor);
    this.registerAnchor('perpendicular', perpendicularAnchor);
    this.registerAnchor('edge-port', edgePortAnchor);

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
    this.hit.insert(id, 'shape', this.shapeWorldBounds(inst), spec.zIndex ?? 0);
    this.wireShapeEvents(inst as unknown as ShapeInstance);
  }

  updateShape<TSpec extends BaseShapeSpec>(id: string, partial: Partial<TSpec>): void {
    const inst = this.shapeInstances.get(id) as ShapeInstance<TSpec> | undefined;
    if (!inst) return;
    inst.spec = { ...inst.spec, ...partial };
    inst.shape.draw(inst.spec);
    this.hit.update(id, this.shapeWorldBounds(inst), inst.spec.zIndex ?? 0);
    if (inst.decorations.size > 0) this.refreshShapeDecorations(inst);
    if (this.badges.has(id)) this.reanchorBadges(id);
  }

  /**
   * Fast-path uniform rescale for a shape — writes the gfx transform
   * directly without touching the spec or rebuilding geometry.
   *
   * `updateShape` rebuilds the underlying Pixi geometry (Graphics.clear()
   * + retrace) on every call, which dominates the cost when something
   * like `NodeSizeLODBehaviour` rewrites thousands of node sizes per
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
   * Bulk re-index hit-test bboxes for shapes — pairs with
   * {@link scaleShape} (which intentionally skips per-call hit updates).
   *
   * Passing `ids` confines the reindex to those shapes. Omitting it
   * touches every shape instance. Either way the rbush tree is rebuilt
   * once via `clear + load` rather than N × `remove + insert`.
   *
   * Call on gesture settle (e.g. inside `NodeSizeLODBehaviour`'s
   * trailing-edge `flushReanchor`) so mid-gesture frames stay cheap and
   * hit-test accuracy snaps back the moment the user stops zooming.
   */
  reindexScaledShapeHits(ids?: Iterable<string>): void {
    const updates: Array<{ id: string; rect: Rect }> = [];
    const sourceIds: Iterable<string> = ids ?? this.shapeInstances.keys();
    for (const id of sourceIds) {
      const inst = this.shapeInstances.get(id);
      if (!inst) continue;
      updates.push({ id, rect: this.shapeWorldBounds(inst) });
    }
    this.hit.bulkUpdateBoxes(updates);
  }

  /**
   * Recompute the path of every connector. Use after a batch of
   * `scaleShape` calls (e.g. one `NodeSizeLODBehaviour` zoom tick) so
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
    this.shapeInstances.delete(id);
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
    this.wireConnectorEvents(inst as unknown as ConnectorInstance);
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
    this.drawConnectorInstance(inst);
    this.indexConnector(inst);
    if (inst.decorations.size > 0) this.refreshConnectorDecorations(inst);
  }

  /**
   * Fast-path render-time stroke multiplier for a connector — writes
   * `inst.strokeWidthScale` and redraws on the cached path.
   *
   * `EdgeSizeLODBehaviour` uses this each `camera:zoom` frame to keep
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
    for (const deco of inst.decorations.values()) this.disposeDecoration(deco);
    inst.decorations.clear();
    for (const fx of inst.effects.values()) this.disposeEffect(fx);
    inst.effects.clear();
    this.connectorHostsWithEffects.delete(inst);
    this.hit.remove(id);
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

    const z = slotZIndex(slot);
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
    const host = this.shapeInstances.get(hostId);
    if (!host) {
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
    const pos = resolveBadgePosition(
      this.shapeWorldBounds(host),
      badge.shape.bounds(),
      options,
    );
    this.updateShape(badgeId, { x: pos.x, y: pos.y });

    if (options.decorations) {
      for (const [decoSlot, decoSpec] of Object.entries(options.decorations)) {
        this.setDecoration(badgeId, decoSlot, decoSpec);
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
   * the badge map for `hostId` is empty.
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
   * (see `@invana/graph` / `LabelResolutionLODBehaviour`): when the camera
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
    // No iteration here. The frame-tick sweep (see `tickLabelRasterise`)
    // picks up the new target and re-rasters only on-screen labels, plus
    // any that scroll into view later. This bounds the per-frame texture-
    // regen cost to whatever's visible instead of the full dataset.
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
    gfx.rotation = dRot;
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
    gfx.rotation = 0;
    gfx.scale.set(1, 1);
    gfx.alpha = spec.alpha ?? 1;
    (gfx as unknown as { tint: number }).tint = 0xffffff;
  }

  // ─── Hit-testing ────────────────────────────────────────────────────────

  hitTest(worldX: number, worldY: number): HitResult | null {
    // Match the federated-event hit floor: pad the rbush query by the
    // same screen-px → world-units conversion that `withinShapeFloor` /
    // `withinConnectorFloor` use. Otherwise sub-pixel shapes get pruned
    // here before `preciseContains` could rescue them via the floor.
    const pad = this.hitFloorWorld();
    const candidates = this.hit.query(worldX, worldY, pad);
    if (candidates.length === 0) return null;
    let best: { kind: 'shape' | 'connector'; id: string; zIndex: number } | null = null;
    for (const c of candidates) {
      if (!this.preciseContains(c.kind, c.id, worldX, worldY)) continue;
      if (best === null || c.zIndex > best.zIndex) {
        best = { kind: c.kind, id: c.id, zIndex: c.zIndex };
      }
    }
    return best ? { kind: best.kind, id: best.id } : null;
  }

  private preciseContains(
    kind: 'shape' | 'connector',
    id: string,
    worldX: number,
    worldY: number,
  ): boolean {
    if (kind === 'shape') {
      const inst = this.shapeInstances.get(id);
      if (!inst) return false;
      const localX = worldX - inst.spec.x;
      const localY = worldY - inst.spec.y;
      return (
        inst.shape.getHitArea().contains(localX, localY) ||
        this.withinShapeFloor(localX, localY)
      );
    }
    const inst = this.connectorInstances.get(id);
    if (!inst) return false;
    const poly = samplePath(inst.path);
    const dsq = distanceToPolylineSq(poly, worldX, worldY);
    const floorR = this.hitFloorWorld();
    const tolSq = Math.max(this.connectorHitToleranceSq(inst), floorR * floorR);
    return dsq <= tolSq;
  }

  private connectorHitToleranceSq(inst: ConnectorInstance): number {
    const sw = inst.spec.stroke?.width ?? 1;
    const slop = 4;
    const r = sw / 2 + slop;
    return r * r;
  }

  /**
   * `MIN_HIT_PX` translated into world units at the current camera scale.
   * The clamp guards against a zero/NaN scale from a misconfigured camera —
   * with a divide-by-zero, the floor would balloon to `Infinity` and every
   * pointer event would hit every shape.
   */
  private hitFloorWorld(): number {
    const scale = this.camera.scale;
    return MIN_HIT_PX / Math.max(scale, 1e-6);
  }

  /**
   * Screen-pixel floor for shapes — true when the local point lies within
   * `MIN_HIT_PX / camera.scale` of the shape's local origin. Used to OR a
   * minimum hover target on top of the primitive's geometric hit area, so a
   * tiny visual stays hoverable.
   *
   * Origin-centred rather than centroid-centred — a deliberate choice for
   * the v1 floor. For `CircleShape` / `EllipseShape` / `RectShape` / `ArcShape`
   * the local origin matches the centroid. For `PolygonShape` / `PathShape`
   * the origin may sit off-centre; the floor backstop is biased toward one
   * side. Acceptable for a backstop (the geometric test still owns the
   * primary hit boundary); revisit when a polygon hover-miss complaint
   * surfaces.
   */
  private withinShapeFloor(localX: number, localY: number): boolean {
    const r = this.hitFloorWorld();
    return localX * localX + localY * localY <= r * r;
  }

  /**
   * Screen-pixel floor for connectors — true when the local point lies
   * within `MIN_HIT_PX / camera.scale` of any segment of the connector's
   * polyline. Reads `path` by reference; route reruns flow through.
   */
  private withinConnectorFloor(
    localX: number,
    localY: number,
    path: Path,
  ): boolean {
    if (path.length < 2) return false;
    const r = this.hitFloorWorld();
    return distanceToPolylineSq(samplePath(path), localX, localY) <= r * r;
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
   * Used by `NodeSizeLODBehaviour` to rewrite shape size as the
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
    return samplePath(inst.path);
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
    for (const id of [...this.shapeInstances.keys()]) this.removeShape(id);
    for (const id of [...this.connectorInstances.keys()]) this.removeConnector(id);
    this.animated.clear();
    this.hit.clear();
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
    return pathStyle(polyline, spec.pathStyleOpts);
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
    if (inst.path.length < 2) {
      this.hit.remove(inst.id);
      return;
    }
    const bb = pathBounds(inst.path);
    const sw = inst.spec.stroke?.width ?? 1;
    const slop = 4;
    const pad = sw / 2 + slop;
    this.hit.insert(
      inst.id,
      'connector',
      {
        x: bb.x - pad,
        y: bb.y - pad,
        width: bb.width + pad * 2,
        height: bb.height + pad * 2,
      },
      inst.spec.zIndex ?? 0,
    );
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

  /**
   * Subscribe to the primitive's Pixi pointer events and re-emit them on the
   * renderer's typed bus (`shape:pointerover` / `shape:click` / etc.) with
   * the instance id + world-space coords.
   *
   * Hit geometry — `eventMode`, `cursor`, `hitArea` — is owned by
   * {@link ShapeBase} (`hitArea` derived from `drawGeometry` via
   * `getHitArea`). This wirer adds one renderer-level UX policy on top: the
   * screen-pixel **hit floor**. The geometric `contains` is OR'd with a
   * disc of `MIN_HIT_PX` screen pixels around the shape's local origin —
   * so a shape that's collapsed to ~1 anti-aliased pixel at low zoom stays
   * hoverable within ~6 px of where the user sees it. The floor only adds
   * area, never shrinks it.
   */
  private wireShapeEvents(inst: ShapeInstance): void {
    // Wrap the primitive's geometric hit area with the screen-pixel floor.
    // The closure captures the original `contains` by reference so further
    // `draw()` calls (which update the silhouette `containsPoint` reads
    // from) still flow through, and the floor `this.camera.scale` lookup
    // happens per pointer event — no zoom subscription needed.
    const geometric = inst.shape.gfx.hitArea as IHitArea | null;
    inst.shape.gfx.hitArea = {
      contains: (x: number, y: number): boolean =>
        (geometric?.contains(x, y) ?? false) || this.withinShapeFloor(x, y),
    };

    const worldOf = (e: { global: { x: number; y: number } }): Point =>
      this.camera.toWorld(e.global.x, e.global.y);

    inst.shape.gfx.on('pointerover', (e) => {
      const w = worldOf(e);
      this.events.emit('shape:pointerover', { id: inst.id, worldX: w.x, worldY: w.y });
    });
    inst.shape.gfx.on('pointerout', (e) => {
      const w = worldOf(e);
      this.events.emit('shape:pointerout', { id: inst.id, worldX: w.x, worldY: w.y });
    });
    inst.shape.gfx.on('pointerdown', (e) => {
      const w = worldOf(e);
      this.events.emit('shape:pointerdown', { id: inst.id, worldX: w.x, worldY: w.y, button: e.button });
    });
    inst.shape.gfx.on('pointerup', (e) => {
      const w = worldOf(e);
      this.events.emit('shape:pointerup', { id: inst.id, worldX: w.x, worldY: w.y, button: e.button });
    });
    inst.shape.gfx.on('click', (e) => {
      // Only emit `shape:click` for left-button presses. Right-button gets its
      // own channel (`shape:contextmenu`) so consumers can distinguish without
      // inspecting `button`.
      if (e.button !== 0) return;
      const w = worldOf(e);
      this.events.emit('shape:click', { id: inst.id, worldX: w.x, worldY: w.y, button: e.button });
      // Pixi's federated `click` carries the DOM `detail` counter (1 on first
      // click, 2 on a double-click within the OS double-click interval). Fire
      // `shape:doubleclick` *in addition* to the second `shape:click` — matches
      // DOM semantics. Consumers that only want one of them filter by name.
      if (e.detail >= 2) {
        this.events.emit('shape:doubleclick', {
          id: inst.id, worldX: w.x, worldY: w.y, button: e.button,
        });
      }
    });
    inst.shape.gfx.on('rightclick', (e) => {
      const w = worldOf(e);
      this.events.emit('shape:contextmenu', { id: inst.id, worldX: w.x, worldY: w.y });
    });
  }

  /**
   * Sibling of {@link wireShapeEvents} for connectors. Hit geometry lives
   * in {@link ConnectorBase} (distance to the resolved polyline within
   * stroke / world-slop tolerance). This wirer adds the same screen-pixel
   * floor as shapes: a thin line at low zoom stays hoverable within
   * `MIN_HIT_PX` screen pixels of the polyline.
   */
  private wireConnectorEvents(inst: ConnectorInstance): void {
    const geometric = inst.connector.gfx.hitArea as IHitArea | null;
    inst.connector.gfx.hitArea = {
      contains: (x: number, y: number): boolean =>
        (geometric?.contains(x, y) ?? false) ||
        this.withinConnectorFloor(x, y, inst.path),
    };

    const worldOf = (e: { global: { x: number; y: number } }): Point =>
      this.camera.toWorld(e.global.x, e.global.y);

    inst.connector.gfx.on('pointerover', (e) => {
      const w = worldOf(e);
      this.events.emit('connector:pointerover', { id: inst.id, worldX: w.x, worldY: w.y });
    });
    inst.connector.gfx.on('pointerout', (e) => {
      const w = worldOf(e);
      this.events.emit('connector:pointerout', { id: inst.id, worldX: w.x, worldY: w.y });
    });
    inst.connector.gfx.on('pointerdown', (e) => {
      const w = worldOf(e);
      this.events.emit('connector:pointerdown', { id: inst.id, worldX: w.x, worldY: w.y, button: e.button });
    });
    inst.connector.gfx.on('pointerup', (e) => {
      const w = worldOf(e);
      this.events.emit('connector:pointerup', { id: inst.id, worldX: w.x, worldY: w.y, button: e.button });
    });
    inst.connector.gfx.on('click', (e) => {
      if (e.button !== 0) return;
      const w = worldOf(e);
      this.events.emit('connector:click', {
        id: inst.id, worldX: w.x, worldY: w.y, button: e.button,
      });
      if (e.detail >= 2) {
        this.events.emit('connector:doubleclick', {
          id: inst.id, worldX: w.x, worldY: w.y, button: e.button,
        });
      }
    });
    inst.connector.gfx.on('rightclick', (e) => {
      const w = worldOf(e);
      this.events.emit('connector:contextmenu', { id: inst.id, worldX: w.x, worldY: w.y });
    });
  }

  private disposeDecoration(deco: IDecorationBase<unknown>): void {
    if ('tick' in deco && typeof deco.tick === 'function') {
      this.animated.delete(deco as AnimatedDecoration);
    }
    if (decoHasSetResolution(deco)) this.labelBearingDecorations.delete(deco);
    deco.destroy?.();
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

function slotZIndex(slot: string): number {
  return SLOT_Z_TABLE[slot] ?? SLOT_Z_DEFAULT;
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
