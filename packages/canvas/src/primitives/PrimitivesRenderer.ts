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
 * **Three extensible registries**
 * - shapes      — `ShapeCtor`             (built-ins: circle, rect)
 * - routers     — `IRouter`               (built-ins: straight)
 * - decorations — shape / connector       (built-ins: registered as the v0
 *                                          plan progresses — currently none)
 *
 * **No connector registry** — there is one concrete `Connector` class.
 * Visual variation comes from the router (which produces the path).
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
import { distanceToPolylineSq, pathBounds, samplePath } from './connectors/pathSampling';
import { ArrowMarker } from './markers/ArrowMarker';
import { GlowDecoration } from './decorations/shape/GlowDecoration';
import { resolveBadgePosition } from './badges/placement';
import type { BadgeOptions } from './badges/types';
import type {
  BaseConnectorSpec,
  BaseShapeSpec,
  ConnectorDecorationCtor,
  ConnectorDecorationHostInfo,
  ConnectorHostInfo,
  DecorationSpec,
  DecorationTarget,
  Endpoint,
  HitResult,
  IConnector,
  IConnectorDecoration,
  IDecorationBase,
  IRouter,
  IShape,
  IShapeDecoration,
  Path,
  Point,
  PrimitivesRendererEventMap,
  Rect,
  RegisterDecorationOptions,
  RenderStats,
  ShapeCtor,
  ShapeDecorationCtor,
  ShapeDecorationHostInfo,
  ShapeHostInfo,
} from './types';

interface RegisteredDecoration {
  readonly ctor: ShapeDecorationCtor | ConnectorDecorationCtor;
  readonly target: DecorationTarget;
}

type AnimatedDecoration = { tick(deltaMs: number): boolean };

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
  private readonly decorationRegistry = new Map<string, RegisteredDecoration>();

  private readonly shapeInstances = new Map<string, ShapeInstance>();
  private readonly connectorInstances = new Map<string, ConnectorInstance>();
  private readonly animated = new Set<AnimatedDecoration>();

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

    this.registerDecoration('glow', GlowDecoration, { target: 'shape' });
  }

  // ─── Registries ─────────────────────────────────────────────────────────

  registerShape<TSpec extends BaseShapeSpec>(kind: string, ctor: ShapeCtor<TSpec>): void {
    this.shapeRegistry.set(kind, ctor as ShapeCtor);
  }

  registerRouter(kind: string, fn: IRouter): void {
    this.routerRegistry.set(kind, fn);
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
    if (this.animated.size === 0) return;
    for (const deco of this.animated) {
      const keep = deco.tick(deltaMs);
      if (!keep) this.animated.delete(deco);
    }
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
    const router = this.routerRegistry.get(spec.router ?? 'straight');
    if (!router) {
      throw new Error(`PrimitivesRenderer: unknown router "${spec.router ?? 'straight'}"`);
    }
    const source = this.resolveEndpoint(spec.source);
    const target = this.resolveEndpoint(spec.target);
    return router(source, target, spec.waypoints);
  }

  private resolveEndpoint(spec: BaseConnectorSpec['source']): Endpoint {
    if (spec.kind === 'point') return { x: spec.x, y: spec.y, tangent: spec.tangent };
    const target = this.shapeInstances.get(spec.shapeId);
    if (!target) {
      throw new Error(`PrimitivesRenderer: connector references unknown shape "${spec.shapeId}"`);
    }
    return { x: target.spec.x, y: target.spec.y };
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
      const w = worldOf(e);
      this.events.emit('shape:click', { id: inst.id, worldX: w.x, worldY: w.y, button: e.button });
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
      const w = worldOf(e);
      this.events.emit('connector:click', { id: inst.id, worldX: w.x, worldY: w.y, button: e.button });
    });
  }

  private disposeDecoration(deco: IDecorationBase<unknown>): void {
    if ('tick' in deco && typeof deco.tick === 'function') {
      this.animated.delete(deco as AnimatedDecoration);
    }
    deco.destroy?.();
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
