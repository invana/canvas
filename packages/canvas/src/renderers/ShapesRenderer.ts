/**
 * `ShapesRenderer` — fully generic, opinion-free drawing API for shapes,
 * connectors, markers, routers, and decorations.
 *
 * Architecture: see `architecture-proposal.md` §2.6 (renderer / layer /
 * behaviour boundaries) and `decorations-plan.md` (five primitives, slot-
 * composed decorations).
 *
 * **What this is**
 *
 * A Layer composes a `ShapesRenderer` internally and projects its state into
 * `addShape` / `updateShape` / `setDecoration` / ... calls. The renderer is
 * not a Layer and is never registered on `canvas.layers`. It knows about
 * pixels, hit-testing, and a camera; it knows nothing about data, semantics,
 * interactions, LOD policy, or label policy.
 *
 * **Five extensible registries**
 * - shapes      — `IShape`           (built-ins: circle, rect, ellipse, polygon, path, image, text)
 * - connectors  — `IConnector`       (built-ins: line, curve)
 * - markers     — `IMarker`          (built-ins: arrow, circle, square, diamond)
 * - routers     — `IRouter` (pure)   (built-ins: straight, orthogonal, bezier)
 * - decorations — `IShapeDecoration` / `IConnectorDecoration`
 *                                    (built-ins: ring, glow,
 *                                     marching-ants, pulse-ring)
 *
 * **Lifecycle**
 *
 * Constructed by the host Layer in `onMount(ctx)`. The Layer passes
 * `this.container` (its own root pixi Container) and the canvas `Camera`.
 * On Layer unmount the root container is destroyed (cascading to all renderer
 * children); call `destroy()` on the renderer first to clear internal
 * bookkeeping (instance maps, animation set, hit index).
 *
 * Status: Step 1 skeleton — registries + mutation/event/hit method
 * signatures. Built-in primitives, decoration framework, hit wiring, and
 * LOD primitives land in subsequent steps (see plan).
 */

import { Container } from 'pixi.js';
import type { Camera } from '../camera/Camera';
import { EventEmitter } from '../events/EventEmitter';
import { TextureRegistry } from './TextureRegistry';
import { SpritePool } from './SpritePool';
import { ConnectorInstance } from './ConnectorInstance';
import { HitIndex } from './HitIndex';
import { ShapeInstance } from './ShapeInstance';
import { CircleShape } from './shapes/CircleShape';
import { EllipseShape } from './shapes/EllipseShape';
import { ImageShape } from './shapes/ImageShape';
import { ImageCircleShape } from './shapes/ImageCircleShape';
import { ImageRectShape } from './shapes/ImageRectShape';
import { PathShape } from './shapes/PathShape';
import type { PathCommand } from './shapes/PathShape';
import { PolygonShape } from './shapes/PolygonShape';
import { RectShape } from './shapes/RectShape';
import { TextShape } from './shapes/TextShape';
import { LineConnector } from './connectors/LineConnector';
import { CurveConnector } from './connectors/CurveConnector';
import { straightRouter } from './routers/straight';
import { orthogonalRouter } from './routers/orthogonal';
import { bezierRouter } from './routers/bezier';
import { RingDecoration } from './decorations/RingDecoration';
import { GlowDecoration } from './decorations/GlowDecoration';
import { PulseRingDecoration } from './decorations/PulseRingDecoration';
import { MarchingAntsDecoration } from './decorations/MarchingAntsDecoration';
import { MarchingAntsConnectorDecoration } from './decorations/MarchingAntsConnectorDecoration';
import { PulsatingGlowConnectorDecoration } from './decorations/PulsatingGlowConnectorDecoration';
import type {
  BaseConnectorSpec,
  BaseShapeSpec,
  ConnectorCtor,
  ConnectorDecorationCtor,
  ConnectorHostInfo,
  DecorationSpec,
  DecorationTarget,
  HitResult,
  IRouter,
  RegisterDecorationOptions,
  RenderStats,
  ShapeCtor,
  ShapeDecorationCtor,
  ShapeHostInfo,
  ShapesRendererEventMap,
} from './types';

// Internal record for the decoration registry — keeps the constructor and
// the target it applies to so `setDecoration` can reject mismatches.
interface RegisteredDecoration {
  readonly ctor: ShapeDecorationCtor | ConnectorDecorationCtor;
  readonly target: DecorationTarget;
}

// Set of decorations currently animating. Walked by `tickAnimations`.
// Membership only — order doesn't matter.
type AnimatedDecoration = { tick(deltaMs: number): boolean };

export interface ShapesRendererOptions {
  /**
   * Pixi `Container` the renderer attaches its pixi children to. Pass
   * `this.container` from the host `WorldLayer`'s `onMount` — the layer's own
   * root container, obtained via the protected `container` getter.
   */
  readonly container: Container;
  /** Canvas camera — used for resolution-aware draws (e.g. text rasterisation). */
  readonly camera: Camera;
  /**
   * Optional shared texture registry. When provided, `url`-based
   * `ImageShapeSpec`s resolve textures from this registry (cache hit →
   * synchronous; miss → async load). Multiple renderers sharing one registry
   * share GPU texture uploads.
   *
   * If omitted, the renderer creates an internal registry — URL-based image
   * shapes still work, but textures are not shared across renderer instances.
   */
  readonly textureRegistry?: TextureRegistry;
}

export class ShapesRenderer {
  // ─── Registries ──────────────────────────────────────────────────────────

  private readonly shapeRegistry = new Map<string, ShapeCtor>();
  private readonly connectorRegistry = new Map<string, ConnectorCtor>();
  private readonly routerRegistry = new Map<string, IRouter>();
  private readonly decorationRegistry = new Map<string, RegisteredDecoration>();

  // ─── Live instances ──────────────────────────────────────────────────────

  private readonly shapeInstances = new Map<string, ShapeInstance>();
  private readonly connectorInstances = new Map<string, ConnectorInstance>();
  private readonly animated = new Set<AnimatedDecoration>();

  // ─── Spatial index for hit-testing ──────────────────────────────────────

  private readonly hit = new HitIndex();

  // ─── Public events ──────────────────────────────────────────────────────

  /**
   * Raw, DOM-level pointer events on shapes/connectors. The host Layer
   * subscribes and translates these into domain events. No semantic
   * interpretation happens at this level.
   */
  readonly events = new EventEmitter<ShapesRendererEventMap>();

  // ─── Construction ───────────────────────────────────────────────────────

  /** Pixi container all shape, connector, and marker primitives attach to. */
  private readonly _container: Container;

  /**
   * Canvas camera. Exposed (read-only) so primitives can do
   * resolution-aware draws (e.g. text rasterisation at the current zoom).
   */
  readonly camera: Camera;

  /** Texture registry injected into every `ShapeHostInfo`. */
  private readonly textureRegistry: TextureRegistry;

  /** Sprite object pool — reduces GC churn at 500k+ scale. Internal only. */
  private readonly spritePool = new SpritePool();

  constructor(opts: ShapesRendererOptions) {
    this._container = opts.container;
    this.camera = opts.camera;
    this.textureRegistry = opts.textureRegistry ?? new TextureRegistry();
    this.registerBuiltins();
  }

  /**
   * Register the built-in primitives shipped with `@invana/canvas`. Called
   * once from the constructor. Subsequent `registerShape(...)` calls with
   * the same `kind` override these (last-wins), so projects can swap a
   * built-in for a custom variant if they need to.
   */
  private registerBuiltins(): void {
    this.registerShape('circle', CircleShape);
    this.registerShape('rect', RectShape);
    this.registerShape('ellipse', EllipseShape);
    this.registerShape('polygon', PolygonShape);
    this.registerShape('path', PathShape);
    this.registerShape('image', ImageShape);
    this.registerShape('image-circle', ImageCircleShape);
    this.registerShape('image-rect', ImageRectShape);
    this.registerShape('text', TextShape);

    this.registerRouter('straight', straightRouter);
    this.registerRouter('orthogonal', orthogonalRouter);
    this.registerRouter('bezier', bezierRouter);

    this.registerConnector('line', LineConnector);
    this.registerConnector('curve', CurveConnector);

    this.registerDecoration('ring', RingDecoration, { target: 'shape' });
    this.registerDecoration('glow', GlowDecoration, { target: 'shape' });
    this.registerDecoration('pulse-ring', PulseRingDecoration, { target: 'shape' });
    this.registerDecoration('marching-ants', MarchingAntsDecoration, { target: 'shape' });
    this.registerDecoration('marching-ants-connector', MarchingAntsConnectorDecoration, {
      target: 'connector',
    });
    this.registerDecoration('pulsating-glow', PulsatingGlowConnectorDecoration, {
      target: 'connector',
    });
  }

  // ─── Registry: shapes ────────────────────────────────────────────────────

  /**
   * Register a shape kind. Subsequent `addShape({ kind, ... })` calls with a
   * matching `spec.kind` instantiate this constructor. Re-registering an
   * existing kind replaces the previous constructor (last-wins, matching
   * the behaviour-registry conventions).
   */
  registerShape<TSpec extends BaseShapeSpec>(kind: string, ctor: ShapeCtor<TSpec>): void {
    this.shapeRegistry.set(kind, ctor as ShapeCtor);
  }

  registerConnector<TSpec extends BaseConnectorSpec>(
    kind: string,
    ctor: ConnectorCtor<TSpec>,
  ): void {
    this.connectorRegistry.set(kind, ctor as ConnectorCtor);
  }

  registerRouter(kind: string, fn: IRouter): void {
    this.routerRegistry.set(kind, fn);
  }

  /**
   * Register a decoration kind. `opts.target` declares whether the decoration
   * applies to shapes, connectors, or both. `setDecoration` will reject
   * mismatches at runtime.
   *
   * The ctor's style parameter type flows through the generic so call-site
   * inference works without `as` casts (`registerDecoration('ring',
   * RingDecoration, ...)` infers `TStyle = RingStyle`). The registry
   * stores the ctor with a widened style type — `setDecoration` is responsible
   * for passing a matching `decoration.style` payload at the runtime boundary.
   */
  registerDecoration<TStyle>(
    kind: string,
    ctor: new (
      style: TStyle,
    ) => import('./types').IShapeDecoration<TStyle> | import('./types').IConnectorDecoration<TStyle>,
    opts: RegisterDecorationOptions,
  ): void {
    this.decorationRegistry.set(kind, {
      ctor: ctor as unknown as ShapeDecorationCtor | ConnectorDecorationCtor,
      target: opts.target,
    });
  }

  // ─── Mutation: shapes ────────────────────────────────────────────────────

  /**
   * Add a shape. Throws if `id` already exists or `spec.kind` is unregistered.
   * Pixi Graphics attaches to the renderer's container; the bbox is
   * inserted into the hit index using the shape's `bounds()` translated by
   * the spec's `(x, y)`.
   */
  addShape<TSpec extends BaseShapeSpec>(id: string, spec: TSpec): void {
    if (this.shapeInstances.has(id)) {
      throw new Error(`ShapesRenderer.addShape: id "${id}" already exists`);
    }
    const Ctor = this.shapeRegistry.get(spec.kind);
    if (!Ctor) {
      throw new Error(`ShapesRenderer.addShape: unknown shape kind "${spec.kind}"`);
    }
    const host: ShapeHostInfo = {
      surface: this._container,
      textureRegistry: this.textureRegistry,
      spritePool: this.spritePool,
    };
    const shape = new Ctor(spec, host) as import('./types').IShape<TSpec>;
    shape.draw(spec);
    const inst = new ShapeInstance<TSpec>(id, spec, shape);
    this.shapeInstances.set(id, inst as unknown as ShapeInstance);
    this.hit.insert(id, 'shape', this.worldBounds(inst), spec.zIndex ?? 0);
    this.wireShapePointer(inst as unknown as ShapeInstance);
  }

  /**
   * Apply a partial update. Re-runs `draw()` on the shape, re-syncs the
   * hit-index entry, and re-applies any active decorations so they track
   * the new bounds.
   */
  updateShape<TSpec extends BaseShapeSpec>(id: string, partial: Partial<TSpec>): void {
    const inst = this.shapeInstances.get(id) as ShapeInstance<TSpec> | undefined;
    if (!inst) return;
    inst.spec = { ...inst.spec, ...partial };
    inst.shape.draw(inst.spec);
    this.hit.update(id, this.worldBounds(inst), inst.spec.zIndex ?? 0);
    // Decoration host-info refresh is handled in the decoration framework
    // (Step 5). Stub here: iterate active decorations and call `update` if
    // they expose one. The host info plumbing lands with that step.
    if (inst.decorations.size > 0) {
      this.refreshShapeDecorations(inst);
    }
  }

  removeShape(id: string): void {
    const inst = this.shapeInstances.get(id);
    if (!inst) return;
    for (const deco of inst.decorations.values()) this.disposeDecoration(deco);
    inst.decorations.clear();
    inst.shape.destroy();
    this.hit.remove(id);
    this.shapeInstances.delete(id);
  }

  // ─── Mutation: connectors ────────────────────────────────────────────────

  addConnector<TSpec extends BaseConnectorSpec>(id: string, spec: TSpec): void {
    if (this.connectorInstances.has(id)) {
      throw new Error(`ShapesRenderer.addConnector: id "${id}" already exists`);
    }
    const Ctor = this.connectorRegistry.get(spec.kind);
    if (!Ctor) {
      throw new Error(`ShapesRenderer.addConnector: unknown kind "${spec.kind}"`);
    }
    const host: ConnectorHostInfo = {
      surface: this._container,
      shapeRegistry: this.shapeRegistry,
    };
    const connector = new Ctor(spec, host) as import('./types').IConnector<TSpec>;
    const points = this.routePoints(spec);
    connector.draw(spec, points);
    const inst = new ConnectorInstance<TSpec>(id, spec, connector);
    inst.polyline = points;
    this.connectorInstances.set(id, inst as unknown as ConnectorInstance);
    this.indexConnector(inst as unknown as ConnectorInstance);
    this.wireConnectorPointer(inst as unknown as ConnectorInstance);
  }

  updateConnector<TSpec extends BaseConnectorSpec>(
    id: string,
    partial: Partial<TSpec>,
  ): void {
    const inst = this.connectorInstances.get(id) as ConnectorInstance<TSpec> | undefined;
    if (!inst) return;
    inst.spec = { ...inst.spec, ...partial };
    inst.polyline = this.routePoints(inst.spec);
    inst.connector.draw(inst.spec, inst.polyline);
    this.indexConnector(inst as unknown as ConnectorInstance);

    if (inst.decorations.size > 0) this.refreshConnectorDecorations(inst);
  }

  removeConnector(id: string): void {
    const inst = this.connectorInstances.get(id);
    if (!inst) return;
    for (const deco of inst.decorations.values()) this.disposeDecoration(deco);
    inst.decorations.clear();
    this.hit.remove(id);
    inst.connector.destroy();
    this.connectorInstances.delete(id);
  }

  // ─── Decorations (slot-composed) ────────────────────────────────────────

  /**
   * Set / replace / clear a decoration on a host (shape or connector). Pass
   * `null` to clear that slot.
   *
   * Slots are caller-defined names. Well-known slot names get a fixed z-band
   * (`glow` / `halo` below the host; `ring` / `pulse` / `badge` / `fx`
   * above) — see `slotZIndex()`. Other slot names land in a default mid-band.
   *
   * The decoration kind must have been registered via `registerDecoration`
   * with a `target` matching the host (`'shape'` / `'connector'` / `'both'`);
   * mismatches throw.
   *
   * Replacing an existing decoration on the same slot disposes the previous
   * one cleanly (and removes it from the animated set if it was animated).
   */
  setDecoration<TStyle = unknown>(
    targetId: string,
    slot: string,
    decoration: DecorationSpec<TStyle> | null,
  ): void {
    const shape = this.shapeInstances.get(targetId);
    const connector = this.connectorInstances.get(targetId);
    if (!shape && !connector) {
      throw new Error(`ShapesRenderer.setDecoration: unknown target "${targetId}"`);
    }

    const decorations = (shape ?? connector!).decorations as Map<
      string,
      import('./types').IDecorationBase<unknown>
    >;
    const prev = decorations.get(slot);
    if (prev) this.disposeDecoration(prev);

    if (decoration === null) {
      decorations.delete(slot);
      return;
    }

    const entry = this.decorationRegistry.get(decoration.kind);
    if (!entry) {
      throw new Error(`ShapesRenderer.setDecoration: unknown kind "${decoration.kind}"`);
    }

    const targetKind: DecorationTarget = shape ? 'shape' : 'connector';
    if (entry.target !== 'both' && entry.target !== targetKind) {
      throw new Error(
        `ShapesRenderer.setDecoration: kind "${decoration.kind}" targets ` +
          `"${entry.target}" but host is a ${targetKind}`,
      );
    }

    const z = slotZIndex(slot);
    if (shape) {
      const ctor = entry.ctor as ShapeDecorationCtor;
      const deco = new ctor(decoration.style);
      shape.shape.gfx.sortableChildren = true;
      const host: import('./types').ShapeDecorationHostInfo = {
        hostId: targetId,
        hostKind: shape.spec.kind,
        slot,
        bounds: shape.shape.bounds(),
        surface: shape.shape.gfx,
        slotZIndex: z,
        outlinePolyline: shapeOutlinePolyline(shape.spec),
      };
      deco.mount(host);
      decorations.set(slot, deco);
      if (typeof deco.tick === 'function') {
        this.animated.add(deco as AnimatedDecoration);
      }
    } else {
      const ctor = entry.ctor as ConnectorDecorationCtor;
      const deco = new ctor(decoration.style);
      connector!.connector.gfx.sortableChildren = true;
      const host: import('./types').ConnectorDecorationHostInfo = {
        hostId: targetId,
        hostKind: connector!.spec.kind,
        slot,
        polyline: connector!.polyline,
        surface: connector!.connector.gfx,
        slotZIndex: z,
        connector: connector!.connector,
        connectorSpec: connector!.spec,
      };
      deco.mount(host);
      decorations.set(slot, deco);
      if (typeof deco.tick === 'function') {
        this.animated.add(deco as AnimatedDecoration);
      }
    }
  }

  // ─── LOD / labels ───────────────────────────────────────────────────────

  /**
   * Set a discrete LOD level on a shape. The host Layer owns the policy
   * (which level a shape should be at given camera zoom / cull state); the
   * renderer just forwards the request.
   *
   * Forwarding rules:
   *   • If the shape implements `setLODLevel`, call it directly — the shape
   *     decides what each level means.
   *   • Otherwise apply the default policy: `level === 0` → hide; `level >= 1`
   *     → visible.
   *
   * Unknown ids are silent no-ops (matches the rest of the
   * `update*`/`remove*` API).
   */
  setLODLevel(id: string, level: number): void {
    const inst = this.shapeInstances.get(id);
    if (!inst) return;
    if (inst.shape.setLODLevel) {
      inst.shape.setLODLevel(level);
      return;
    }
    inst.shape.gfx.visible = level > 0;
  }

  /**
   * Bake a label texture at the given resolution. Forwards to the shape's
   * `setLabelResolution` if implemented (e.g. `TextShape` swaps its
   * underlying `Text.resolution`). Shapes without text ignore the call.
   * Unknown ids are no-ops.
   */
  rasteriseLabel(id: string, resolution: number): void {
    const inst = this.shapeInstances.get(id);
    if (!inst) return;
    inst.shape.setLabelResolution?.(resolution);
  }

  // ─── Per-frame animation ────────────────────────────────────────────────

  /**
   * Advance all animated decorations. Called by the host Canvas tick after
   * `layer.flush()`. Decorations that return `false` from their `tick`
   * retire from the animated set; static decorations cost zero per frame.
   */
  tickAnimations(deltaMs: number): void {
    if (this.animated.size === 0) return;
    for (const deco of this.animated) {
      const keep = deco.tick(deltaMs);
      if (!keep) this.animated.delete(deco);
    }
  }

  // ─── Hit-testing ────────────────────────────────────────────────────────

  /**
   * Topmost-by-zIndex precise hit at the given world coordinates. Returns
   * `null` when no candidate is hit.
   *
   * Two-stage:
   *   1. Spatial index narrows to candidates whose AABB contains the point
   *      (rbush, O(log n + k)).
   *   2. Each candidate runs its kind-specific containment check —
   *      `IShape.contains(localX, localY)` for shapes (default = bbox) and
   *      a stroke-distance test against the routed polyline for connectors.
   *
   * Among precise hits, the highest `zIndex` wins; ties resolve to the
   * latest-inserted (rbush iteration order — unspecified but stable enough
   * for typical scenes).
   */
  hitTest(worldX: number, worldY: number): HitResult | null {
    const candidates = this.hit.query(worldX, worldY);
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

  /** Per-kind containment check used by `hitTest`. */
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
      return inst.shape.contains?.(localX, localY) ?? true;
    }
    const inst = this.connectorInstances.get(id);
    if (!inst) return false;
    return distanceToPolylineSq(inst.polyline, worldX, worldY) <=
      this.connectorHitToleranceSq(inst);
  }

  /**
   * Squared hit tolerance for a connector. Equal to (strokeWidth/2 + slop)^2,
   * where `slop` is a fixed 4 px to make hairline edges easier to pick up.
   * Spec lookup is shallow — typical connector specs declare `strokeWidth`
   * directly.
   */
  private connectorHitToleranceSq(inst: ConnectorInstance): number {
    const sw = (inst.spec as { strokeWidth?: number }).strokeWidth ?? 1;
    const slop = 4;
    const r = sw / 2 + slop;
    return r * r;
  }

  // ─── Diagnostics ────────────────────────────────────────────────────────

  getRenderStats(): RenderStats {
    return {
      shapes: this.shapeInstances.size,
      connectors: this.connectorInstances.size,
      animatedDecorations: this.animated.size,
    };
  }

  // ─── Teardown ───────────────────────────────────────────────────────────

  /**
   * Release all renderer-owned objects. The host Layer calls this in its
   * unmount path before the host layer's container is destroyed
   * (which would orphan our pixi children otherwise).
   */
  destroy(): void {
    for (const id of [...this.shapeInstances.keys()]) this.removeShape(id);
    for (const id of [...this.connectorInstances.keys()]) this.removeConnector(id);
    this.animated.clear();
    this.hit.clear();
    this.spritePool.destroy();
    this.events.removeAllListeners();
  }

  // ─── Internals ──────────────────────────────────────────────────────────

  /** Translate a shape's local AABB into world coords for the hit index. */
  private worldBounds(inst: ShapeInstance): import('./types').Rect {
    const local = inst.shape.bounds();
    return {
      x: inst.spec.x + local.x,
      y: inst.spec.y + local.y,
      width: local.width,
      height: local.height,
    };
  }

  /**
   * Resolve a connector's spec into a routed polyline. Endpoints can resolve
   * to raw points or to other shape ids; the latter projects to the bound
   * shape's center (final endpoint policy — anchor on shape boundary, etc.
   * — is shape-specific and lands with the connector built-ins in Step 4).
   */
  private routePoints(spec: BaseConnectorSpec): ReadonlyArray<import('./types').Point> {
    const router = this.routerRegistry.get(spec.router ?? 'straight');
    if (!router) {
      throw new Error(`ShapesRenderer: unknown router "${spec.router ?? 'straight'}"`);
    }
    const source = this.resolveEndpoint(spec.source);
    const target = this.resolveEndpoint(spec.target);
    return router(source, target);
  }

  /**
   * Insert / refresh a connector in the spatial index, using the polyline's
   * AABB inflated by the stroke half-width. Called from `addConnector` and
   * `updateConnector`. Connectors with `<2` polyline points are skipped —
   * they have no visible footprint.
   */
  private indexConnector(inst: ConnectorInstance): void {
    const pts = inst.polyline;
    if (pts.length < 2) {
      this.hit.remove(inst.id);
      return;
    }
    let minX = pts[0]!.x;
    let minY = pts[0]!.y;
    let maxX = minX;
    let maxY = minY;
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i]!;
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    const sw = (inst.spec as { strokeWidth?: number }).strokeWidth ?? 1;
    const slop = 4;
    const pad = sw / 2 + slop;
    this.hit.insert(
      inst.id,
      'connector',
      {
        x: minX - pad,
        y: minY - pad,
        width: maxX - minX + pad * 2,
        height: maxY - minY + pad * 2,
      },
      inst.spec.zIndex ?? 0,
    );
  }

  private resolveEndpoint(spec: BaseConnectorSpec['source']): import('./types').Endpoint {
    if (spec.kind === 'point') return { x: spec.x, y: spec.y, tangent: spec.tangent };
    const target = this.shapeInstances.get(spec.shapeId);
    if (!target) {
      throw new Error(
        `ShapesRenderer: connector references unknown shape "${spec.shapeId}"`,
      );
    }
    return { x: target.spec.x, y: target.spec.y };
  }

  /**
   * Re-issue host info for every decoration on a shape and call `update?.()`.
   * Triggered from `updateShape` whenever the spec's bounds may have shifted.
   * Decorations that don't expose `update` are left alone — they captured
   * their state at `mount()` and don't need re-syncing.
   */
  private refreshShapeDecorations(inst: ShapeInstance): void {
    const bounds = inst.shape.bounds();
    for (const [slot, deco] of inst.decorations) {
      if (!deco.update) continue;
      const host: import('./types').ShapeDecorationHostInfo = {
        hostId: inst.id,
        hostKind: inst.spec.kind,
        slot,
        bounds,
        surface: inst.shape.gfx,
        slotZIndex: slotZIndex(slot),
        outlinePolyline: shapeOutlinePolyline(inst.spec),
      };
      deco.update(host);
    }
  }

  private refreshConnectorDecorations(inst: ConnectorInstance): void {
    for (const [slot, deco] of inst.decorations) {
      if (!deco.update) continue;
      const host: import('./types').ConnectorDecorationHostInfo = {
        hostId: inst.id,
        hostKind: inst.spec.kind,
        slot,
        polyline: inst.polyline,
        surface: inst.connector.gfx,
        slotZIndex: slotZIndex(slot),
        connector: inst.connector,
        connectorSpec: inst.spec,
      };
      deco.update(host);
    }
  }

  /**
   * Make a shape's gfx interactive and forward pixi pointer events as raw
   * `shape:*` events on the renderer's bus. The renderer (not the shape)
   * owns this wiring so all interaction surface area stays in one place.
   *
   * Pixi v8 cleanup: the listeners attach to `inst.shape.gfx`, which is
   * destroyed in `removeShape`. Pixi's destroy detaches the listeners
   * automatically — no manual `off` needed.
   *
   * Per-kind precise hit: pixi consults `gfx.hitArea` if set; otherwise it
   * uses bbox of children. We set `hitArea` to a thin object that defers
   * to the shape's `contains` so pointer events match the programmatic
   * `hitTest` exactly.
   */
  private wireShapePointer(inst: ShapeInstance): void {
    inst.shape.gfx.eventMode = 'static';
    inst.shape.gfx.cursor = 'pointer';

    const shape = inst.shape;
    const containsFn = shape.contains?.bind(shape);
    if (containsFn) {
      // Local-space hitArea — the gfx is positioned at spec.x/spec.y, so
      // the event hit-test runs in shape-local coords automatically.
      inst.shape.gfx.hitArea = {
        contains: (x: number, y: number): boolean => containsFn(x, y),
      };
    }

    const emit = <K extends keyof ShapesRendererEventMap>(
      key: K,
      payload: ShapesRendererEventMap[K],
    ): void => this.events.emit(key, payload);

    const worldOf = (e: { global: { x: number; y: number } }): { x: number; y: number } =>
      this.camera.toWorld(e.global.x, e.global.y);

    inst.shape.gfx.on('pointerover', (e) => {
      const w = worldOf(e);
      emit('shape:pointerover', { id: inst.id, worldX: w.x, worldY: w.y });
    });
    inst.shape.gfx.on('pointerout', (e) => {
      const w = worldOf(e);
      emit('shape:pointerout', { id: inst.id, worldX: w.x, worldY: w.y });
    });
    inst.shape.gfx.on('pointerdown', (e) => {
      const w = worldOf(e);
      emit('shape:pointerdown', { id: inst.id, worldX: w.x, worldY: w.y, button: e.button });
    });
    inst.shape.gfx.on('pointerup', (e) => {
      const w = worldOf(e);
      emit('shape:pointerup', { id: inst.id, worldX: w.x, worldY: w.y, button: e.button });
    });
    inst.shape.gfx.on('click', (e) => {
      const w = worldOf(e);
      emit('shape:click', { id: inst.id, worldX: w.x, worldY: w.y, button: e.button });
    });
  }

  /**
   * Like `wireShapePointer` but for connectors. Uses a polyline-distance
   * `hitArea.contains` so pointer events register only when the cursor is
   * within the stroke's hit tolerance (same logic as programmatic hitTest).
   */
  private wireConnectorPointer(inst: ConnectorInstance): void {
    inst.connector.gfx.eventMode = 'static';
    inst.connector.gfx.cursor = 'pointer';

    const tolSq = this.connectorHitToleranceSq(inst);
    inst.connector.gfx.hitArea = {
      contains: (x: number, y: number): boolean =>
        distanceToPolylineSq(inst.polyline, x, y) <= tolSq,
    };

    const emit = <K extends keyof ShapesRendererEventMap>(
      key: K,
      payload: ShapesRendererEventMap[K],
    ): void => this.events.emit(key, payload);

    const worldOf = (e: { global: { x: number; y: number } }): { x: number; y: number } =>
      this.camera.toWorld(e.global.x, e.global.y);

    inst.connector.gfx.on('pointerover', (e) => {
      const w = worldOf(e);
      emit('connector:pointerover', { id: inst.id, worldX: w.x, worldY: w.y });
    });
    inst.connector.gfx.on('pointerout', (e) => {
      const w = worldOf(e);
      emit('connector:pointerout', { id: inst.id, worldX: w.x, worldY: w.y });
    });
    inst.connector.gfx.on('pointerdown', (e) => {
      const w = worldOf(e);
      emit('connector:pointerdown', { id: inst.id, worldX: w.x, worldY: w.y, button: e.button });
    });
    inst.connector.gfx.on('pointerup', (e) => {
      const w = worldOf(e);
      emit('connector:pointerup', { id: inst.id, worldX: w.x, worldY: w.y, button: e.button });
    });
    inst.connector.gfx.on('click', (e) => {
      const w = worldOf(e);
      emit('connector:click', { id: inst.id, worldX: w.x, worldY: w.y, button: e.button });
    });
  }

  private disposeDecoration(deco: import('./types').IDecorationBase<unknown>): void {
    if ('tick' in deco && typeof deco.tick === 'function') {
      this.animated.delete(deco as AnimatedDecoration);
    }
    deco.destroy?.();
  }

  // ─── Test/debug accessors ───────────────────────────────────────────────

  /** Number of shape instances currently in the renderer. */
  get shapeCount(): number {
    return this.shapeInstances.size;
  }

  /** Number of connector instances currently in the renderer. */
  get connectorCount(): number {
    return this.connectorInstances.size;
  }

  hasShape(id: string): boolean {
    return this.shapeInstances.has(id);
  }

  hasConnector(id: string): boolean {
    return this.connectorInstances.has(id);
  }
}

// ─── Slot z-band ──────────────────────────────────────────────────────────
//
// ─── Shape outline helpers ───────────────────────────────────────────────────

type Pt = { x: number; y: number };

/**
 * Returns a closed outline polyline for `polygon` and `path` specs so
 * decorations can trace the actual shape geometry instead of the AABB.
 * Returns `undefined` for all other shape kinds.
 */
function shapeOutlinePolyline(spec: BaseShapeSpec): ReadonlyArray<Pt> | undefined {
  if (spec.kind === 'polygon') {
    const pts = (spec as unknown as { points: ReadonlyArray<Pt> }).points;
    if (!pts || pts.length < 3) return undefined;
    const first = pts[0]!;
    const last = pts[pts.length - 1]!;
    return first.x === last.x && first.y === last.y ? pts : [...pts, first];
  }
  if (spec.kind === 'path') {
    const commands = (spec as unknown as { commands: ReadonlyArray<PathCommand> }).commands;
    if (!commands || commands.length === 0) return undefined;
    return pathCommandsToOutline(commands);
  }
  return undefined;
}

function pathCommandsToOutline(commands: ReadonlyArray<PathCommand>): Pt[] {
  const pts: Pt[] = [];
  let cx = 0;
  let cy = 0;
  let subStartX = 0;
  let subStartY = 0;

  for (const cmd of commands) {
    switch (cmd.kind) {
      case 'moveTo':
        subStartX = cmd.x;
        subStartY = cmd.y;
        cx = cmd.x;
        cy = cmd.y;
        pts.push({ x: cx, y: cy });
        break;
      case 'lineTo':
        cx = cmd.x;
        cy = cmd.y;
        pts.push({ x: cx, y: cy });
        break;
      case 'quadTo':
        sampleQuad(pts, cx, cy, cmd.cpx, cmd.cpy, cmd.x, cmd.y, 8);
        cx = cmd.x;
        cy = cmd.y;
        break;
      case 'cubicTo':
        sampleCubic(pts, cx, cy, cmd.cp1x, cmd.cp1y, cmd.cp2x, cmd.cp2y, cmd.x, cmd.y, 12);
        cx = cmd.x;
        cy = cmd.y;
        break;
      case 'close':
        if (pts.length > 0) pts.push({ x: subStartX, y: subStartY });
        cx = subStartX;
        cy = subStartY;
        break;
    }
  }

  // Ensure closed
  if (pts.length > 1) {
    const first = pts[0]!;
    const last = pts[pts.length - 1]!;
    if (first.x !== last.x || first.y !== last.y) {
      pts.push({ x: first.x, y: first.y });
    }
  }

  return pts;
}

function sampleQuad(
  out: Pt[],
  x0: number, y0: number,
  cpx: number, cpy: number,
  x1: number, y1: number,
  steps: number,
): void {
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const mt = 1 - t;
    out.push({
      x: mt * mt * x0 + 2 * mt * t * cpx + t * t * x1,
      y: mt * mt * y0 + 2 * mt * t * cpy + t * t * y1,
    });
  }
}

function sampleCubic(
  out: Pt[],
  x0: number, y0: number,
  cp1x: number, cp1y: number,
  cp2x: number, cp2y: number,
  x1: number, y1: number,
  steps: number,
): void {
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const mt = 1 - t;
    out.push({
      x: mt * mt * mt * x0 + 3 * mt * mt * t * cp1x + 3 * mt * t * t * cp2x + t * t * t * x1,
      y: mt * mt * mt * y0 + 3 * mt * mt * t * cp1y + 3 * mt * t * t * cp2y + t * t * t * y1,
    });
  }
}

// Decoration slots stack in a fixed visual order regardless of insertion
// order. Built-in slots get well-known z-indices; unrecognised slot names
// fall into a default mid-band so callers can pick custom slot names without
// breaking ordering.
//
// Layout (bottom → top):
//   glow        −200
//   halo        −100
//   <shape>        0
//   ring         100
//   pulse        200
//   badge        300
//   fx           400
//   <other>       50  (mid-band)

const SLOT_Z_TABLE: Readonly<Record<string, number>> = {
  glow: -200,
  halo: -100,
  ring: 100,
  pulse: 200,
  badge: 300,
  fx: 400,
};

const SLOT_Z_DEFAULT = 50;

function slotZIndex(slot: string): number {
  return SLOT_Z_TABLE[slot] ?? SLOT_Z_DEFAULT;
}

/**
 * Squared minimum distance from `(px, py)` to any segment of the polyline.
 * Squared (no sqrt) since callers compare against a squared tolerance —
 * faster + branch-free for the common no-hit case. Returns `Infinity` for
 * polylines with `<2` points.
 */
function distanceToPolylineSq(
  poly: ReadonlyArray<{ x: number; y: number }>,
  px: number,
  py: number,
): number {
  if (poly.length < 2) return Infinity;
  let best = Infinity;
  for (let i = 0; i < poly.length - 1; i++) {
    const a = poly[i]!;
    const b = poly[i + 1]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
    let t = lenSq === 0 ? 0 : ((px - a.x) * dx + (py - a.y) * dy) / lenSq;
    if (t < 0) t = 0;
    else if (t > 1) t = 1;
    const cx = a.x + dx * t;
    const cy = a.y + dy * t;
    const ex = px - cx;
    const ey = py - cy;
    const d = ex * ex + ey * ey;
    if (d < best) best = d;
  }
  return best;
}

