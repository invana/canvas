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
 * - pathStyles  — `IPathStyle`            (built-ins: normal, rounded, bezier, smooth)
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

import { Container } from 'pixi.js';
import type { Camera } from '../camera/Camera';
import { EventEmitter } from '../events/EventEmitter';
import { TextureRegistry } from '../textures/TextureRegistry';
import { HitIndex } from '../hit/HitIndex';
import { ShapeInstance } from '../instancing/ShapeInstance';
import { ConnectorInstance } from '../instancing/ConnectorInstance';
import { CircleShape } from './shapes/CircleShape';
import { RectShape } from './shapes/RectShape';
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
import { smoothPathStyle } from './connectors/pathStyles/smooth';
import { centerAnchor } from './connectors/anchors/center';
import { boundaryAnchor } from './connectors/anchors/boundary';
import { perpendicularAnchor } from './connectors/anchors/perpendicular';
import { distanceToPolylineSq, pathBounds, samplePath } from './connectors/pathSampling';
import { ArrowMarker } from './markers/ArrowMarker';
import { GlowDecoration } from './decorations/shape/GlowDecoration';
import { PulseRingDecoration } from './decorations/shape/PulseRingDecoration';
import { ShakeEffect } from './effects/shape/ShakeEffect';
import { BreathingEffect } from './effects/shape/BreathingEffect';
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
  readonly ctor: ShapeEffectCtor;
  readonly target: EffectTargetKind;
}

type AnimatedDecoration = { tick(deltaMs: number): boolean };
type AnimatedEffect = IShapeEffect & { tick(deltaMs: number): boolean };

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
   * Host → (slot → BadgeOptions). Each entry corresponds to a shape registered
   * under id `${hostId}:${slot}` and re-anchored on host updates.
   */
  private readonly badges = new Map<string, Map<string, BadgeOptions>>();

  private readonly hit = new HitIndex();

  readonly events = new EventEmitter<PrimitivesRendererEventMap>();

  private readonly _container: Container;
  readonly camera: Camera;
  private readonly textureRegistry: TextureRegistry;

  constructor(opts: PrimitivesRendererOptions) {
    this._container = opts.container;
    this.camera = opts.camera;
    this.textureRegistry = opts.textureRegistry ?? new TextureRegistry();
    this.registerBuiltins();
  }

  private registerBuiltins(): void {
    this.registerShape('circle', CircleShape);
    this.registerShape('rect', RectShape);
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
    this.registerPathStyle('smooth', smoothPathStyle);

    this.registerAnchor('center', centerAnchor);
    this.registerAnchor('boundary', boundaryAnchor);
    this.registerAnchor('perpendicular', perpendicularAnchor);

    this.registerDecoration('glow', GlowDecoration, { target: 'shape' });
    this.registerDecoration('pulse-ring', PulseRingDecoration, { target: 'shape' });

    this.registerEffect('shake', ShakeEffect, { target: 'shape' });
    this.registerEffect('breathing', BreathingEffect, { target: 'shape' });
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
    ctor: new (style: TStyle) => IShapeEffect<TStyle>,
    opts: RegisterEffectOptions,
  ): void {
    this.effectRegistry.set(kind, {
      ctor: ctor as unknown as ShapeEffectCtor,
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
      surface: this._container,
      textureRegistry: this.textureRegistry,
      requestRedraw: () => {
        const cur = this.shapeInstances.get(id);
        if (cur) cur.shape.draw(cur.spec);
      },
    };
    const shape = new Ctor(spec, host) as IShape<TSpec>;
    this._container.addChild(shape.gfx);
    const inst = new ShapeInstance<TSpec>(id, spec, shape);
    this.shapeInstances.set(id, inst as unknown as ShapeInstance);
    this.hit.insert(id, 'shape', this.shapeWorldBounds(inst), spec.zIndex ?? 0);
    this.wireShapePointer(inst as unknown as ShapeInstance);
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
      surface: this._container,
      shapeRegistry: this.shapeRegistry,
    };
    const connector = new Connector(host) as unknown as IConnector<TSpec>;
    this._container.addChild(connector.gfx);
    const path = this.routePath(spec);
    connector.draw(spec, path);
    const inst = new ConnectorInstance<TSpec>(id, spec, connector);
    inst.path = path;
    this.connectorInstances.set(id, inst as unknown as ConnectorInstance);
    this.indexConnector(inst as unknown as ConnectorInstance);
    this.wireConnectorPointer(inst as unknown as ConnectorInstance);
  }

  updateConnector<TSpec extends BaseConnectorSpec>(id: string, partial: Partial<TSpec>): void {
    const inst = this.connectorInstances.get(id) as ConnectorInstance<TSpec> | undefined;
    if (!inst) return;
    inst.spec = { ...inst.spec, ...partial };
    inst.path = this.routePath(inst.spec);
    inst.connector.draw(inst.spec, inst.path);
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
      const host: ShapeDecorationHostInfo = {
        hostId: targetId,
        slot,
        slotZIndex: z,
        bounds: shape.shape.bounds(),
        surface: shape.shape.gfx,
        shape: shape.shape,
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
   * Connector effects are not supported in v0 — the call throws if `targetId`
   * resolves to a connector. Once concrete connector effects land, this
   * branches on host kind like `setDecoration`.
   */
  setEffect<TStyle = unknown>(
    targetId: string,
    slot: string,
    effect: EffectSpec<TStyle> | null,
  ): void {
    const shape = this.shapeInstances.get(targetId);
    if (!shape) {
      if (this.connectorInstances.has(targetId)) {
        throw new Error(
          `PrimitivesRenderer.setEffect: connector effects not yet supported ("${targetId}")`,
        );
      }
      throw new Error(`PrimitivesRenderer.setEffect: unknown target "${targetId}"`);
    }

    const prev = shape.effects.get(slot);
    if (prev) this.disposeEffect(prev);

    if (effect === null) {
      shape.effects.delete(slot);
      if (shape.effects.size === 0) {
        this.hostsWithEffects.delete(shape);
        // Reset baseline so any prior modulation doesn't linger on the gfx.
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

    const fx = new entry.ctor(effect.style);
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
    // Apply non-animated effects immediately so they take effect this frame.
    this.applyEffectsToHost(shape);
  }

  // ─── Badges ─────────────────────────────────────────────────────────────

  /**
   * Attach a badge to a host shape. The badge is registered as a real shape
   * under id `` `${hostId}:${slot}` `` so it inherits every shape capability —
   * any registered shape kind as the plate, any `ShapeFillLayer` as content
   * (solid / image / glyph / text / svg / image-inset / svg-url), and any
   * registered decoration via the `decorations` field.
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
    const poly = samplePath(inst.path);
    return distanceToPolylineSq(poly, worldX, worldY) <= this.connectorHitToleranceSq(inst);
  }

  private connectorHitToleranceSq(inst: ConnectorInstance): number {
    const sw = inst.spec.stroke?.width ?? 1;
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

  get shapeCount(): number {
    return this.shapeInstances.size;
  }

  get connectorCount(): number {
    return this.connectorInstances.size;
  }

  hasShape(id: string): boolean {
    return this.shapeInstances.has(id);
  }

  hasConnector(id: string): boolean {
    return this.connectorInstances.has(id);
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
      inst.connector.draw(inst.spec, inst.path);
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
    return {
      x: inst.spec.x + local.x,
      y: inst.spec.y + local.y,
      width: local.width,
      height: local.height,
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

    const ctx: RouterCtx = { obstacles: this.resolveObstacles(spec) };
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
    return {
      x: inst.spec.x + b.x + b.width / 2,
      y: inst.spec.y + b.y + b.height / 2,
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
    const bounds = inst.shape.bounds();
    return {
      origin: { x: inst.spec.x, y: inst.spec.y },
      bounds,
      center: {
        x: inst.spec.x + bounds.x + bounds.width / 2,
        y: inst.spec.y + bounds.y + bounds.height / 2,
      },
      boundaryIntersect: inst.shape.boundaryIntersect?.bind(inst.shape),
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

  private refreshShapeDecorations(inst: ShapeInstance): void {
    const bounds = inst.shape.bounds();
    for (const [slot, deco] of inst.decorations) {
      if (!deco.update) continue;
      const host: ShapeDecorationHostInfo = {
        hostId: inst.id,
        slot,
        slotZIndex: slotZIndex(slot),
        bounds,
        surface: inst.shape.gfx,
        shape: inst.shape,
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

  private wireShapePointer(inst: ShapeInstance): void {
    inst.shape.gfx.eventMode = 'static';
    inst.shape.gfx.cursor = 'pointer';

    const containsFn = inst.shape.contains?.bind(inst.shape);
    if (containsFn) {
      inst.shape.gfx.hitArea = {
        contains: (x: number, y: number): boolean => containsFn(x, y),
      };
    }

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

  private wireConnectorPointer(inst: ConnectorInstance): void {
    inst.connector.gfx.eventMode = 'static';
    inst.connector.gfx.cursor = 'pointer';

    const tolSq = this.connectorHitToleranceSq(inst);
    inst.connector.gfx.hitArea = {
      contains: (x: number, y: number): boolean =>
        distanceToPolylineSq(samplePath(inst.path), x, y) <= tolSq,
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
    deco.destroy?.();
  }

  private disposeEffect(fx: IShapeEffect): void {
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
//   glow        −300
//   halo        −200
//   breathing   −150
//   pulse       −100
//   ring         −50
//   <shape>        0
//   <other>       50  (mid-band)
//   badge        300
//   fx           400

const SLOT_Z_TABLE: Readonly<Record<string, number>> = {
  glow: -300,
  halo: -200,
  breathing: -150,
  pulse: -100,
  ring: -50,
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
