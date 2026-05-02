// ── ShapesPlugin ──────────────────────────────────────────────────────────────
// General-purpose rendering engine for shapes and connectors.
// Can be used standalone or as the backend for higher-level plugins.

import type { Ticker } from 'pixi.js';
import type { CanvasPlugin, PluginContext, Label } from '@invana/canvas-deprecated';
import { ShapePool } from './ShapePool.js';
import { ShapeScene } from './ShapeScene.js';
import { ShapeObject } from './ShapeObject.js';
import { BaseShape } from './BaseShape.js';
import { BaseConnector } from './BaseConnector.js';
import type { BaseShapeSpec, BaseConnectorSpec, BBox, Point, RouterFn, ArrowSpec } from './spec/index.js';
export type { RouterFn };
import { CameraTracker } from './CameraTracker.js';
import { LODController, type LODThresholds } from './LODController.js';
import { AnimationRegistry } from './AnimationRegistry.js';
import type { AnimationHandler } from './AnimationRegistry.js';
import { AnimationHaloPool } from './AnimationHaloPool.js';
import { defaultRegistry } from './handlers/index.js';
import type { ElementAnimations } from './spec/animations.js';
import {
  ShapeClickEvent,
  ShapeDblClickEvent,
  ShapeContextMenuEvent,
  ShapePointerOverEvent,
  ShapePointerOutEvent,
  ShapePointerMoveEvent,
  ShapePointerDownEvent,
  ShapePointerUpEvent,
  ShapeDragStartEvent,
  ShapeDragMoveEvent,
  ShapeDragEndEvent,
  ShapeStateChangeEvent,
  ShapeAddedEvent,
  ShapeRemovedEvent,
} from './ShapeEvents.js';

// Built-in shape types
import { CircleShape } from './shapes/CircleShape.js';
import { RectShape } from './shapes/RectShape.js';
import { EllipseShape } from './shapes/EllipseShape.js';
import { PolygonShape } from './shapes/PolygonShape.js';
import { DiamondShape } from './shapes/DiamondShape.js';
import { StarShape } from './shapes/StarShape.js';
import { HexagonShape } from './shapes/HexagonShape.js';
import { PolylineShape } from './shapes/PolylineShape.js';
// Built-in connector types
import { StraightConnector } from './connectors/StraightConnector.js';
import { BezierConnector } from './connectors/BezierConnector.js';
import { OrthogonalConnector } from './connectors/OrthogonalConnector.js';
import { QuadraticConnector } from './connectors/QuadraticConnector.js';
import { CubicHorizontalConnector } from './connectors/CubicHorizontalConnector.js';
import { CubicVerticalConnector } from './connectors/CubicVerticalConnector.js';
import { RoundedConnector } from './connectors/RoundedConnector.js';
import { SmoothConnector } from './connectors/SmoothConnector.js';
import { LoopPolylineConnector } from './connectors/LoopPolylineConnector.js';
import { LoopCurveConnector } from './connectors/LoopCurveConnector.js';
// Built-in routers
import { BUILTIN_ROUTERS } from './routers/builtins.js';
import type { DrawContext } from './DrawContext.js';

// ── Options ───────────────────────────────────────────────────────────────────

/**
 * Construction options for {@link ShapesPlugin}.
 */
export interface ShapesPluginOptions {
  /**
   * Plugin instance key.  Must be unique if multiple instances are registered.
   * Defaults to `'shapes'`.
   */
  key?: string;
  /** z-index for the connector layer (default: 5). Shape layer = zIndex + 1. */
  zIndex?: number;
  /** Override LOD zoom thresholds. */
  lod?: Partial<LODThresholds>;
  /**
   * Custom animation registry.  Defaults to {@link defaultRegistry}.
   */
  animationRegistry?: AnimationRegistry;
}

// ── Shape/Connector constructor types ─────────────────────────────────────────

/** Constructor signature for shape element classes. */
export type ShapeCtor = new (spec: BaseShapeSpec) => BaseShape;
/** Constructor signature for connector element classes. */
export type ConnectorCtor = new (spec: BaseConnectorSpec) => BaseConnector;

// ── Backward-compatibility aliases ───────────────────────────────────────────
/** @deprecated Use {@link ShapesPluginOptions} instead. */
export type GraphPluginOptions = ShapesPluginOptions;
/** @deprecated Use {@link ShapeCtor} instead. */
export type NodeCtor = ShapeCtor;
/** @deprecated Use {@link ConnectorCtor} instead. */
export type EdgeCtor = ConnectorCtor;

// ── ShapesPlugin ──────────────────────────────────────────────────────────────

/**
 * `ShapesPlugin` — general-purpose rendering engine for shapes and connectors.
 *
 * @remarks
 * **Shape types:** `'circle'`, `'rect'`, `'ellipse'`, `'polygon'`,
 * `'diamond'`, `'star'`, `'hexagon'`.
 * **Connector types:** `'straight'`, `'bezier'`, `'orthogonal'`, `'quadratic'`,
 * `'rounded'`, `'smooth'`.
 * Register custom types via {@link registerShape} / {@link registerConnector}.
 *
 * @example
 * ```ts
 * const shapes = new ShapesPlugin();
 * await canvas.plugins.register(shapes);
 *
 * shapes.addShape('circle', {
 *   id: 's1', x: 0, y: 0, radius: 30,
 *   style: { fill: '#3fcbeb', stroke: '#ffffff', strokeWidth: 2 },
 *   label: 'Shape', interactive: true,
 * });
 *
 * shapes.addConnector('bezier', {
 *   id: 'c1', from: { x: 30, y: 0 }, to: { x: 170, y: 0 },
 *   style: { stroke: '#58a6ff', strokeWidth: 2 },
 * });
 *
 * canvas.events.on('shape:click', ({ elementId, elementType }) => {
 *   console.log('clicked', elementId, elementType);
 * });
 * ```
 */
export class ShapesPlugin implements CanvasPlugin {
  readonly id: string;

  private _zIndex:      number;
  private _lodOptions:  Partial<LODThresholds>;

  private _shapePool!:       ShapePool;
  private _connectorPool!:   ShapePool;
  private _shapeScene!:      ShapeScene;
  private _connectorScene!:  ShapeScene;
  private _nodeLabelLayer!:  import('pixi.js').Container;
  private _edgeLabelLayer!:  import('pixi.js').Container;
  private _lod!:             LODController;
  private _cameraTracker!:   CameraTracker;
  private _ctx!:             PluginContext;

  private _ticker: Ticker | null = null;
  private _animSet = new Set<string>();
  private _boundTick: ((t: Ticker) => void) | null = null;
  private _animRegistry: AnimationRegistry;
  private _halos!: AnimationHaloPool;

  private _lastHoverId:    string | null = null;
  private _dragState: { id: string; lastX: number; lastY: number; grabOffsetX: number; grabOffsetY: number } | null = null;

  private _batchingAdd = false;

  // Reverse index: shapeId → Set of connectorIds attached to it.
  private _shapeToConnectors = new Map<string, Set<string>>();

  // Per-shape base style captured at setData time.  Used by setStyles to merge
  // a shared global style on top of each shape's own style without losing it.
  private _baseStyles  = new Map<string, BaseShapeSpec['style']>();
  private _globalStyle: Partial<NonNullable<BaseShapeSpec['style']>> | null = null;

  // ── Registries ────────────────────────────────────────────────────────────

  private _markerRegistry = new Map<
    string,
    (ctx: DrawContext, tip: Point, angle: number, spec: ArrowSpec) => void
  >();

  private _routerRegistry = new Map<string, RouterFn>(BUILTIN_ROUTERS);

  private _shapeRegistry = new Map<string, ShapeCtor>([
    ['circle',   CircleShape   as unknown as ShapeCtor],
    ['rect',     RectShape     as unknown as ShapeCtor],
    ['ellipse',  EllipseShape  as unknown as ShapeCtor],
    ['polygon',  PolygonShape  as unknown as ShapeCtor],
    ['diamond',  DiamondShape  as unknown as ShapeCtor],
    ['star',     StarShape     as unknown as ShapeCtor],
    ['hexagon',  HexagonShape  as unknown as ShapeCtor],
    ['polyline', PolylineShape as unknown as ShapeCtor],
  ]);

  private _connectorRegistry = new Map<string, ConnectorCtor>([
    ['straight',         StraightConnector         as unknown as ConnectorCtor],
    ['bezier',           BezierConnector           as unknown as ConnectorCtor],
    ['cubic',            BezierConnector           as unknown as ConnectorCtor],
    ['cubic-horizontal', CubicHorizontalConnector  as unknown as ConnectorCtor],
    ['cubic-vertical',   CubicVerticalConnector    as unknown as ConnectorCtor],
    ['orthogonal',       OrthogonalConnector       as unknown as ConnectorCtor],
    ['quadratic',        QuadraticConnector        as unknown as ConnectorCtor],
    ['rounded',          RoundedConnector          as unknown as ConnectorCtor],
    ['smooth',           SmoothConnector           as unknown as ConnectorCtor],
    ['loop-polyline',    LoopPolylineConnector     as unknown as ConnectorCtor],
    ['loop-curve',       LoopCurveConnector        as unknown as ConnectorCtor],
  ]);

  constructor(options: ShapesPluginOptions = {}) {
    this.id              = options.key               ?? 'shapes';
    this._zIndex         = options.zIndex            ?? 5;
    this._lodOptions     = options.lod               ?? {};
    this._animRegistry   = options.animationRegistry ?? defaultRegistry;
  }

  // ── CanvasPlugin lifecycle ────────────────────────────────────────────────

  register(ctx: PluginContext): void {
    this._ctx = ctx;

    const connectorLayer  = ctx.createLayer({ id: `${this.id}-connectors`,  zIndex: this._zIndex,     label: 'Connectors' });
    const shapeLayer      = ctx.createLayer({ id: `${this.id}-shapes`,      zIndex: this._zIndex + 1, label: 'Shapes' });
    const haloLayer       = ctx.createLayer({ id: `${this.id}-halos`,       zIndex: this._zIndex + 2, label: 'Halos' });
    // Edge labels above shape bodies so a midpoint label is never hidden
    // behind a neighbouring node; node labels above edge labels so they win
    // when the two would overlap.
    this._edgeLabelLayer  = ctx.createLayer({ id: `${this.id}-edge-labels`, zIndex: this._zIndex + 3, label: 'Edge labels' });
    this._nodeLabelLayer  = ctx.createLayer({ id: `${this.id}-node-labels`, zIndex: this._zIndex + 4, label: 'Node labels' });
    this._edgeLabelLayer.eventMode = 'none';
    this._nodeLabelLayer.eventMode = 'none';
    this._halos = new AnimationHaloPool(haloLayer);

    this._shapePool      = new ShapePool();
    this._connectorPool  = new ShapePool();
    this._lod            = new LODController(this._lodOptions);
    this._shapeScene     = new ShapeScene(shapeLayer, this._shapePool);
    this._connectorScene = new ShapeScene(connectorLayer, this._connectorPool);

    this._lod.update(ctx.camera.scale);
    this._shapeScene.onDetailChanged(this._lod.current);
    this._connectorScene.onDetailChanged(this._lod.current);

    ctx.events.on('camera:zoom', ({ scale }) => {
      if (this._lod.update(scale)) {
        this._shapeScene.onDetailChanged(this._lod.current);
        this._connectorScene.onDetailChanged(this._lod.current);
      }
    });

    this._cameraTracker = new CameraTracker(
      ctx.camera,
      ctx.events,
      (bounds) => {
        this._shapeScene.onCameraChanged(bounds);
        this._connectorScene.onCameraChanged(bounds);
      },
    );

    ctx.events.on('canvas:pointermove',  (e) => this._onPointerMove(e.worldX, e.worldY, e.nativeEvent));
    ctx.events.on('canvas:pointerdown',  (e) => this._onPointerDown(e.worldX, e.worldY, e.nativeEvent));
    ctx.events.on('canvas:pointerup',    (e) => this._onPointerUp(e.worldX, e.worldY, e.nativeEvent));
    ctx.events.on('canvas:clicked',      (e) => this._onPointerClick(e.worldX, e.worldY, e.nativeEvent));
    ctx.events.on('canvas:dblclicked',   (e) => this._onPointerDblClick(e.worldX, e.worldY, e.nativeEvent));
    ctx.events.on('canvas:contextmenu',  (e) => this._onPointerContextMenu(e.worldX, e.worldY, e.nativeEvent));

    const ticker = (ctx as unknown as { _ticker?: Ticker })._ticker;
    if (ticker) {
      this._ticker = ticker;
      this._boundTick = this._tick.bind(this);
      this._ticker.add(this._boundTick);
    }
  }

  destroy(): void {
    if (this._ticker && this._boundTick) {
      this._ticker.remove(this._boundTick);
    }
    this._shapeScene?.clear();
    this._connectorScene?.clear();
    for (const obj of this._shapePool?.values() ?? []) obj.destroy();
    for (const obj of this._connectorPool?.values() ?? []) obj.destroy();
    this._shapePool?.clear();
    this._connectorPool?.clear();
    this._halos?.destroy();
  }

  // ── Type registry ─────────────────────────────────────────────────────────

  /**
   * Register a custom shape type.
   *
   * @example
   * ```ts
   * shapesPlugin.registerShape('database', DatabaseShape);
   * shapesPlugin.addShape('database', { id: 'db1', x: 0, y: 0, ... });
   * ```
   */
  registerShape(type: string, cls: ShapeCtor): void {
    this._shapeRegistry.set(type, cls);
  }

  /** @deprecated Use {@link registerShape} instead. */
  registerNode(type: string, cls: ShapeCtor): void {
    this.registerShape(type, cls);
  }

  /** Register a custom connector type. */
  registerConnector(type: string, cls: ConnectorCtor): void {
    this._connectorRegistry.set(type, cls);
  }

  /** @deprecated Use {@link registerConnector} instead. */
  registerEdge(type: string, cls: ConnectorCtor): void {
    this.registerConnector(type, cls);
  }

  /** Register a custom router function under `name`. */
  registerRouter(name: string, fn: RouterFn): void {
    this._routerRegistry.set(name, fn);
  }

  /** Register a custom marker (arrowhead) drawing function under `name`. */
  registerMarker(
    name: string,
    fn: (ctx: DrawContext, tip: Point, angle: number, spec: ArrowSpec) => void,
  ): void {
    this._markerRegistry.set(name, fn);
  }

  // ── Shape CRUD ────────────────────────────────────────────────────────────

  /** Add a shape of the given type. */
  addShape(type: string, spec: BaseShapeSpec): void {
    const Ctor = this._shapeRegistry.get(type);
    if (!Ctor) {
      console.warn(`[ShapesPlugin] Unknown shape type: "${type}". Register it via registerShape().`);
      return;
    }
    const shape = new Ctor(spec);
    const obj   = new ShapeObject(shape, this._nodeLabelLayer);
    this._shapePool.add(obj);
    this._ctx.events.emit('shape:added', new ShapeAddedEvent({ elementId: spec.id, elementType: 'shape' }));
    if (shape.onAnimationTick) this._animSet.add(spec.id);
    if (!this._batchingAdd) this._cameraTracker.flush();
  }

  /** @deprecated Use {@link addShape} instead. */
  addNode(type: string, spec: BaseShapeSpec): void {
    this.addShape(type, spec);
  }

  /** Partially update a shape's spec by id. */
  updateShape(id: string, partial: Partial<BaseShapeSpec>): void {
    const obj = this._shapePool.get(id);
    if (!obj) return;
    const prev = { ...obj.element.spec };
    const next = { ...obj.element.spec, ...partial } as BaseShapeSpec;
    obj.element.spec = next;
    (obj.element as BaseShape).onUpdate?.(prev as never, next as never);
    this._shapePool.updateBBox(obj);
    obj.markDirty();
    this._shapeScene.redraw(id);
    if (partial.x !== undefined || partial.y !== undefined) {
      this._updateAttachedConnectors(id);
    }
  }

  /** @deprecated Use {@link updateShape} instead. */
  updateNode(id: string, partial: Partial<BaseShapeSpec>): void {
    this.updateShape(id, partial);
  }

  /** Remove a shape by id. */
  removeShape(id: string): void {
    this.clearAnimation(id);
    this._shapeToConnectors.delete(id);
    this._shapeScene.evict(id);
    this._animSet.delete(id);
    const obj = this._shapePool.get(id);
    this._shapePool.remove(id);
    obj?.destroy();
    this._ctx.events.emit('shape:removed', new ShapeRemovedEvent({ elementId: id, elementType: 'shape' }));
  }

  /** @deprecated Use {@link removeShape} instead. */
  removeNode(id: string): void {
    this.removeShape(id);
  }

  /** Get the raw `ShapeObject` wrapper for a shape by id. */
  getShape(id: string): ShapeObject | undefined {
    return this._shapePool.get(id);
  }

  /** @deprecated Use {@link getShape} instead. */
  getNode(id: string): ShapeObject | undefined {
    return this.getShape(id);
  }

  /**
   * Apply a shared style across every shape registered via {@link setData}.
   *
   * The style is merged *over* each shape's base style (captured from the
   * `spec.style` passed to `setData`), so global keys win on conflict.  Each
   * call re-merges from the captured base, so removing a key from `style`
   * restores the original value for that key.
   *
   * Shapes added via {@link addShape} directly are not affected.
   *
   * @example
   * ```ts
   * shapes.setStyles({ stroke: '#f97316', strokeWidth: 4 });
   * ```
   */
  setStyles(style: Partial<NonNullable<BaseShapeSpec['style']>>): void {
    this._globalStyle = style;
    for (const [id, base] of this._baseStyles) {
      this.updateShape(id, { style: { ...(base ?? {}), ...style } });
    }
  }

  // ── Connector CRUD ────────────────────────────────────────────────────────

  /** Add a connector of the given type. */
  addConnector(type: string, spec: BaseConnectorSpec): void {
    const Ctor = this._connectorRegistry.get(type);
    if (!Ctor) {
      console.warn(`[ShapesPlugin] Unknown connector type: "${type}". Register it via registerConnector().`);
      return;
    }
    const resolved = this._resolveConnectorEndpoints(spec, type);
    const resolvedSpec = {
      ...spec,
      from:      resolved.from,
      to:        resolved.to,
      fromAngle: resolved.fromAngle,
      toAngle:   resolved.toAngle,
    };
    const connector = new Ctor(resolvedSpec);
    (connector as BaseConnector)._routerRegistry = this._routerRegistry;
    (connector as BaseConnector)._markerRegistry = this._markerRegistry;
    (connector as BaseConnector)._connectorType  = type;
    const obj = new ShapeObject(connector, this._edgeLabelLayer);
    this._connectorPool.add(obj);
    this._registerConnectorAttachment(resolvedSpec);
    this._ctx.events.emit('shape:added', new ShapeAddedEvent({ elementId: spec.id, elementType: 'connector' }));
    if (connector.onAnimationTick) this._animSet.add(spec.id);
    if (!this._batchingAdd) this._cameraTracker.flush();
  }

  /** @deprecated Use {@link addConnector} instead. */
  addEdge(type: string, spec: BaseConnectorSpec): void {
    this.addConnector(type, spec);
  }

  /** Partially update a connector's spec by id. */
  updateConnector(id: string, partial: Partial<BaseConnectorSpec>): void {
    const obj = this._connectorPool.get(id);
    if (!obj) return;
    const prev = { ...obj.element.spec };
    const next = { ...obj.element.spec, ...partial } as BaseConnectorSpec;
    obj.element.spec = next;
    (obj.element as BaseConnector).onUpdate?.(prev as never, next as never);
    this._connectorPool.updateBBox(obj);
    obj.markDirty();
    this._connectorScene.redraw(id);
  }

  /** @deprecated Use {@link updateConnector} instead. */
  updateEdge(id: string, partial: Partial<BaseConnectorSpec>): void {
    this.updateConnector(id, partial);
  }

  /** Remove a connector by id. */
  removeConnector(id: string): void {
    this._unregisterConnector(id);
    this._connectorScene.evict(id);
    this._animSet.delete(id);
    const obj = this._connectorPool.get(id);
    this._connectorPool.remove(id);
    obj?.destroy();
    this._ctx.events.emit('shape:removed', new ShapeRemovedEvent({ elementId: id, elementType: 'connector' }));
  }

  /** @deprecated Use {@link removeConnector} instead. */
  removeEdge(id: string): void {
    this.removeConnector(id);
  }

  /** Get the raw `ShapeObject` wrapper for a connector by id. */
  getConnector(id: string): ShapeObject | undefined {
    return this._connectorPool.get(id);
  }

  /**
   * Iterate every {@link Label} owned by this plugin's shapes and connectors,
   * regardless of visibility. Used by behaviour plugins like
   * `LabelResolutionPlugin` to drive runtime properties (resolution, etc.)
   * without walking the Pixi display list.
   */
  forEachLabel(cb: (label: Label) => void): void {
    for (const obj of this._shapePool.values())     obj.labels?.forEach(cb);
    for (const obj of this._connectorPool.values()) obj.labels?.forEach(cb);
  }

  /** @deprecated Use {@link getConnector} instead. */
  getEdge(id: string): ShapeObject | undefined {
    return this.getConnector(id);
  }

  // ── Geometry queries ──────────────────────────────────────────────────────

  /** Bounding box for a shape or connector.  Returns `null` if not found. */
  getBBox(id: string): BBox | null {
    return this._shapePool.get(id)?.getBBox()
        ?? this._connectorPool.get(id)?.getBBox()
        ?? null;
  }

  /** World-space centre of a shape. */
  getCenter(id: string): Point | null {
    const obj = this._shapePool.get(id);
    if (!obj) return null;
    return (obj.element as BaseShape).getCenter();
  }

  /** Perimeter connection point for a shape in the direction of `(toX, toY)`. */
  getConnectionPoint(id: string, toX: number, toY: number): Point | null {
    const obj = this._shapePool.get(id);
    if (!obj) return null;
    return (obj.element as BaseShape).getConnectionPoint(toX, toY);
  }

  // ── State API ─────────────────────────────────────────────────────────────

  /** Set a named state on a shape or connector. */
  setState(id: string, state: string, active: boolean): void {
    const pool  = this._shapePool.has(id) ? this._shapePool  : this._connectorPool;
    const scene = this._shapePool.has(id) ? this._shapeScene : this._connectorScene;
    const obj = pool.get(id);
    if (!obj) return;
    obj.element.setState(state, active);
    scene.redraw(id);
    this._ctx.events.emit(
      'shape:statechange',
      new ShapeStateChangeEvent({ elementId: id, state, active }),
    );
  }

  /** Deactivate a single state on an element. */
  clearState(id: string, state: string): void {
    this.setState(id, state, false);
  }

  /** Deactivate all active states on an element. */
  clearAllStates(id: string): void {
    const obj = this._shapePool.get(id) ?? this._connectorPool.get(id);
    if (!obj) return;
    for (const state of [...obj.element.activeStates]) {
      this.setState(id, state, false);
    }
  }

  /** Return the list of currently active state names for an element. */
  getStates(id: string): string[] {
    const obj = this._shapePool.get(id) ?? this._connectorPool.get(id);
    return obj ? [...obj.element.activeStates] : [];
  }

  // ── Bulk API ──────────────────────────────────────────────────────────────

  /**
   * Replace all current elements with the provided sets.
   *
   * Each shape's `spec.style` is captured as that shape's "base style" — used
   * by {@link setStyles} to merge a shared global style on top without losing
   * the per-shape baseline.  If a global style was previously set via
   * {@link setStyles}, it is re-applied on top of the new batch.
   */
  setData(
    shapes:     Array<{ type: string; spec: BaseShapeSpec }>,
    connectors: Array<{ type: string; spec: BaseConnectorSpec }> = [],
  ): void {
    this.clear();
    this._batchingAdd = true;
    try {
      for (const { type, spec } of shapes) {
        this.addShape(type, spec);
        this._baseStyles.set(spec.id, spec.style);
      }
      for (const { type, spec } of connectors) this.addConnector(type, spec);
    } finally {
      this._batchingAdd = false;
    }
    this._cameraTracker.flush();

    if (this._globalStyle) this.setStyles(this._globalStyle);
  }

  /** Remove all shapes and connectors, stop animations, and reset state. */
  clear(): void {
    this._halos?.returnAll();
    this._shapeScene.clear();
    this._connectorScene.clear();
    for (const obj of this._shapePool.values())     obj.destroy();
    for (const obj of this._connectorPool.values()) obj.destroy();
    this._shapePool.clear();
    this._connectorPool.clear();
    this._animSet.clear();
    this._baseStyles.clear();
    this._globalStyle = null;
    this._lastHoverId = null;
    this._dragState   = null;
  }

  /**
   * Fit the camera to the bounding box of all elements.
   * @param padding - Extra world-space padding (default: 60).
   */
  fitContent(padding = 60): void {
    const boxes = [
      ...this._shapePool.allBBoxes(),
      ...this._connectorPool.allBBoxes(),
    ];
    if (boxes.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const b of boxes) {
      if (b.minX < minX) minX = b.minX;
      if (b.minY < minY) minY = b.minY;
      if (b.maxX > maxX) maxX = b.maxX;
      if (b.maxY > maxY) maxY = b.maxY;
    }
    this._ctx.camera.fitTo(
      { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
      padding,
    );
  }

  // ── Animation tick ────────────────────────────────────────────────────────

  private _tick(ticker: Ticker): void {
    const dt = ticker.deltaMS;
    for (const id of this._animSet) {
      const obj = this._shapePool.get(id) ?? this._connectorPool.get(id);
      if (!obj) { this._animSet.delete(id); continue; }

      const element = obj.element;
      let dirty = false;

      if (element instanceof BaseShape && element._animSlots.size > 0) {
        const toStop: string[] = [];

        for (const [type, slot] of element._animSlots) {
          const handler = this._animRegistry.get(type) as AnimationHandler | undefined;
          if (!handler) continue;
          const result = handler.tick(slot.state, slot.spec, dt);
          handler.apply(slot.state, slot.spec, element, this._halos);
          if (result.dirty) dirty = true;
          if (result.stop)  toStop.push(type);
        }

        for (const type of toStop) {
          const slot = element._animSlots.get(type);
          if (slot) {
            const handler = this._animRegistry.get(type) as AnimationHandler | undefined;
            handler?.cleanup?.(slot.state, element, this._halos);
          }
          element._animSlots.delete(type);
        }

        this._applyContainerOverrides(obj, element);
      }

      element.onAnimationTick?.(dt);
      dirty = dirty || obj.isDirty;

      if (dirty) {
        obj.markDirty();
        const scene = this._shapePool.has(id) ? this._shapeScene : this._connectorScene;
        scene.redraw(id);
      }

      if (
        element instanceof BaseShape &&
        element._animSlots.size === 0 &&
        !element.onAnimationTick
      ) {
        this._animSet.delete(id);
      }
    }
  }

  /**
   * Start one or more animations on a shape.
   *
   * @example
   * ```ts
   * shapesPlugin.animate('s1', { breathe: { amplitude: 0.12 } });
   * ```
   */
  animate(id: string, spec: ElementAnimations): void {
    const obj = this._shapePool.get(id);
    if (!obj) {
      console.warn(`[ShapesPlugin] animate(): shape "${id}" not found.`);
      return;
    }
    const element = obj.element as BaseShape;

    for (const [type, opts] of Object.entries(spec)) {
      if (opts === undefined || opts === null) continue;
      const handler = this._animRegistry.get(type) as AnimationHandler | undefined;
      if (!handler) {
        console.warn(`[ShapesPlugin] animate(): no handler registered for type "${type}".`);
        continue;
      }
      const existing = element._animSlots.get(type);
      if (existing) {
        handler.cleanup?.(existing.state, element, this._halos);
        element._animSlots.delete(type);
      }
      const state = handler.init(opts as Record<string, unknown>, element, this._halos);
      element._animSlots.set(type, { spec: opts as Record<string, unknown>, state });
    }

    this._animSet.add(id);
  }

  /**
   * Stop one or all animations on a shape.
   *
   * @param id   - Shape id.
   * @param type - Animation type to stop.  Omit to stop all animations.
   */
  clearAnimation(id: string, type?: string): void {
    const obj = this._shapePool.get(id);
    if (!obj) return;
    const element = obj.element as BaseShape;
    if (!element._animSlots) return;

    if (type) {
      const slot = element._animSlots.get(type);
      if (slot) {
        const handler = this._animRegistry.get(type) as AnimationHandler | undefined;
        handler?.cleanup?.(slot.state, element, this._halos);
        element._animSlots.delete(type);
      }
    } else {
      for (const [t, slot] of element._animSlots) {
        const handler = this._animRegistry.get(t) as AnimationHandler | undefined;
        handler?.cleanup?.(slot.state, element, this._halos);
      }
      element._animSlots.clear();
    }

    this._applyContainerOverrides(obj, element);

    if (element._animSlots.size === 0 && !element.onAnimationTick) {
      this._animSet.delete(id);
    }
  }

  private _applyContainerOverrides(obj: ShapeObject, element: BaseShape): void {
    const o = element._animOverrides;
    obj.container.alpha = o.alpha;
    if (o.scale !== 1) {
      const c = element.getCenter();
      obj.container.pivot.set(c.x, c.y);
      obj.container.position.set(c.x, c.y);
      obj.container.scale.set(o.scale);
    } else {
      obj.container.pivot.set(0, 0);
      obj.container.position.set(0, 0);
      obj.container.scale.set(1);
    }
  }

  // ── Connector attachment helpers ──────────────────────────────────────────

  private _registerConnectorAttachment(spec: BaseConnectorSpec): void {
    for (const shapeId of [spec.sourceId, spec.targetId]) {
      if (!shapeId) continue;
      if (!this._shapeToConnectors.has(shapeId)) this._shapeToConnectors.set(shapeId, new Set());
      this._shapeToConnectors.get(shapeId)!.add(spec.id);
    }
  }

  private _unregisterConnector(connectorId: string): void {
    for (const set of this._shapeToConnectors.values()) set.delete(connectorId);
  }

  /**
   * Resolve a connector's endpoints (`from` / `to`) and attachment tangents
   * (`fromAngle` / `toAngle`) by asking the connector itself where its curve
   * actually wants to enter/exit each shape.
   *
   * Algorithm:
   *
   *   1. **Ports** win — a named port supplies both the anchor position and
   *      the outward normal directly.
   *   2. **Explicit angles** on the spec are honoured next.
   *   3. **Otherwise**, build a *draft route* between the two shape centres
   *      using the actual connector class. Read the curve's true tangent at
   *      each end, take its outward direction, and ray-cast from the centre
   *      along that direction to find where the curve really wants to meet
   *      the perimeter.
   *
   * This is the "refinement pass" approach: it works uniformly across
   * straight, bezier, quadratic, smooth, orthogonal, and rounded connectors,
   * because every connector type yields a path whose end-tangents reveal its
   * preferred entry / exit direction. One pass converges visually for all
   * typical cases.
   */
  private _resolveConnectorEndpoints(
    spec: BaseConnectorSpec,
    connectorType: string,
  ): { from: Point; to: Point; fromAngle?: number; toAngle?: number } {
    let from = spec.from;
    let to   = spec.to;

    const src = spec.sourceId ? (this._shapePool.get(spec.sourceId)?.element as BaseShape | undefined) : undefined;
    const tgt = spec.targetId ? (this._shapePool.get(spec.targetId)?.element as BaseShape | undefined) : undefined;
    const sC  = src?.getCenter();
    const tC  = tgt?.getCenter();

    // Outward unit vectors at source / target. Once known, we ray-cast from
    // each centre along these to find the perimeter hit.
    let srcOut: Point | undefined;
    let tgtOut: Point | undefined;

    // Tangent angles to propagate to the connector. Only set when we have a
    // strong signal (port normal or user-provided angle); never set from the
    // refinement pass — propagating those would lock the connector into its
    // "explicit angle" branch and over-constrain control-point placement.
    let fromAngleOut: number | undefined;
    let toAngleOut:   number | undefined;

    // 1. Ports win — anchor and outward normal both come from the port.
    if (src && spec.sourcePortId) {
      const port = src.getPorts?.()?.find((p) => p.id === spec.sourcePortId);
      if (port) {
        from = port.position;
        srcOut = port.normal;
        fromAngleOut = Math.atan2(port.normal.y, port.normal.x);
      }
    }
    if (tgt && spec.targetPortId) {
      const port = tgt.getPorts?.()?.find((p) => p.id === spec.targetPortId);
      if (port) {
        to = port.position;
        tgtOut = port.normal;
        toAngleOut = Math.atan2(port.normal.y, port.normal.x);
      }
    }

    // 2. Explicit user-supplied angles.
    if (fromAngleOut === undefined && spec.fromAngle !== undefined) {
      srcOut ??= { x: Math.cos(spec.fromAngle), y: Math.sin(spec.fromAngle) };
      fromAngleOut = spec.fromAngle;
    }
    if (toAngleOut === undefined && spec.toAngle !== undefined) {
      tgtOut ??= { x: Math.cos(spec.toAngle), y: Math.sin(spec.toAngle) };
      toAngleOut = spec.toAngle;
    }

    // 3. Refinement pass — only when we still need an outward direction and
    //    we have both centres to draft a route between.
    if ((!srcOut || !tgtOut) && src && tgt && sC && tC) {
      const refined = this._draftTangentDirections(spec, connectorType, sC, tC);
      if (refined) {
        srcOut ??= refined.srcOut;
        tgtOut ??= refined.tgtOut;
      }
    }

    // 4. Final fallback: chord direction (covers single-shape connectors).
    if (!srcOut || !tgtOut) {
      const refSrc = sC ?? from;
      const refTgt = tC ?? to;
      const chord  = _unitOrNull(refTgt.x - refSrc.x, refTgt.y - refSrc.y);
      if (chord) {
        srcOut ??= chord;
        tgtOut ??= { x: -chord.x, y: -chord.y };
      }
    }

    // 5. Boundary hits along outward directions.
    if (src && sC && srcOut && !spec.sourcePortId) {
      from = src.rayBoundaryHit(sC, srcOut) ?? sC;
    } else if (src && !spec.sourcePortId) {
      from = src.getConnectionPoint(to.x, to.y) ?? from;
    }
    if (tgt && tC && tgtOut && !spec.targetPortId) {
      to = tgt.rayBoundaryHit(tC, tgtOut) ?? tC;
    } else if (tgt && !spec.targetPortId) {
      to = tgt.getConnectionPoint(from.x, from.y) ?? to;
    }

    return { from, to, fromAngle: fromAngleOut, toAngle: toAngleOut };
  }

  /**
   * Build a draft route between two shape centres and read back the curve's
   * outward tangent direction at each end. Used by the endpoint resolver to
   * decide where the curve actually wants to meet each shape's boundary.
   *
   * Returns `null` if the connector type isn't registered, or if the route
   * generation fails for any reason (we fall back to chord direction).
   */
  private _draftTangentDirections(
    spec: BaseConnectorSpec,
    connectorType: string,
    sC: Point,
    tC: Point,
  ): { srcOut: Point; tgtOut: Point } | null {
    const Ctor = this._connectorRegistry.get(connectorType);
    if (!Ctor) return null;
    try {
      // Build a draft connector with center-to-center endpoints. The draft is
      // never added to the scene; we only call its `route()` method to read
      // the curve's natural tangent directions.
      const draftSpec = { ...spec, from: sC, to: tC };
      const draft = new Ctor(draftSpec) as BaseConnector;
      draft._routerRegistry = this._routerRegistry;

      const rawWaypoints = (spec.vertices ?? spec.waypoints ?? []) as Point[];
      const routedWaypoints = _runDraftRouter(draft, sC, tC, rawWaypoints, this._routerRegistry);
      const route = draft.route(sC, tC, routedWaypoints);
      if (route.length === 0) return null;

      const startAngle = _startTangentAngleOfRoute(route, sC, tC);
      const endAngle   = _endTangentAngleOfRoute(route, sC, tC);

      // Tangent decoder:
      //   `startAngle` returns atan2(from - cp1) — i.e. the OPPOSITE of the
      //   curve's direction of travel at the start. So the source's outward
      //   normal (= direction of travel at start) is the unit vector at angle
      //   `startAngle + π`, which is `(-cos, -sin)`.
      //
      //   `endAngle` returns atan2(to - cp2) — the curve's direction of
      //   travel at the end (going INTO the target). The target's outward
      //   normal is the opposite, again `(-cos, -sin)`.
      const srcOut: Point = { x: -Math.cos(startAngle), y: -Math.sin(startAngle) };
      const tgtOut: Point = { x: -Math.cos(endAngle),   y: -Math.sin(endAngle)   };
      return { srcOut, tgtOut };
    } catch {
      return null;
    }
  }

  // ── Internal helpers (file-local) ─────────────────────────────────────────

  private _updateAttachedConnectors(movedShapeId: string): void {
    const connectorIds = this._shapeToConnectors.get(movedShapeId);
    if (!connectorIds) return;
    for (const connectorId of connectorIds) {
      const connObj = this._connectorPool.get(connectorId);
      if (!connObj) continue;
      const connector = connObj.element as BaseConnector;
      const spec      = connector.spec;
      const type      = connector._connectorType ?? 'straight';
      const resolved  = this._resolveConnectorEndpoints(spec, type);
      this.updateConnector(connectorId, {
        from:      resolved.from,
        to:        resolved.to,
        fromAngle: resolved.fromAngle,
        toAngle:   resolved.toAngle,
      });
    }
  }

  // ── Pointer event handlers ────────────────────────────────────────────────

  private _hitTest(wx: number, wy: number): { id: string; type: 'shape' | 'connector' } | null {
    const shape = this._shapePool.hitTest(wx, wy);
    if (shape) return { id: shape.id, type: 'shape' };
    const connector = this._connectorPool.hitTest(wx, wy);
    if (connector) return { id: connector.id, type: 'connector' };
    return null;
  }

  private _fields(
    id: string,
    type: 'shape' | 'connector',
    wx: number,
    wy: number,
    nativeEvent: PointerEvent,
  ) {
    const obj = type === 'shape' ? this._shapePool.get(id) : this._connectorPool.get(id);
    return {
      elementId:   id,
      elementType: type,
      worldX:      wx,
      worldY:      wy,
      nativeEvent,
      data:        obj?.element.spec.data,
    } as const;
  }

  private _onPointerMove(wx: number, wy: number, e: PointerEvent): void {
    const hit = this._hitTest(wx, wy);

    if (this._lastHoverId && (!hit || hit.id !== this._lastHoverId)) {
      const prevType = this._shapePool.has(this._lastHoverId) ? 'shape' : 'connector' as const;
      this._ctx.events.emit(
        'shape:pointerout',
        new ShapePointerOutEvent(this._fields(this._lastHoverId, prevType, wx, wy, e)),
      );
      this._lastHoverId = null;
    }

    if (hit && hit.id !== this._lastHoverId) {
      this._ctx.events.emit(
        'shape:pointerover',
        new ShapePointerOverEvent(this._fields(hit.id, hit.type, wx, wy, e)),
      );
      this._lastHoverId = hit.id;
    }

    if (hit) {
      this._ctx.events.emit(
        'shape:pointermove',
        new ShapePointerMoveEvent(this._fields(hit.id, hit.type, wx, wy, e)),
      );
    }

    if (this._dragState) {
      const { id, lastX, lastY } = this._dragState;
      const isShape = this._shapePool.has(id);
      const type: 'shape' | 'connector' = isShape ? 'shape' : 'connector';
      const dx = wx - lastX, dy = wy - lastY;
      this._dragState.lastX = wx;
      this._dragState.lastY = wy;
      this._ctx.events.emit(
        'shape:dragmove',
        new ShapeDragMoveEvent({ ...this._fields(id, type, wx, wy, e), dx, dy }),
      );
      if (isShape) {
        const { grabOffsetX, grabOffsetY } = this._dragState!;
        this.updateShape(id, { x: wx - grabOffsetX, y: wy - grabOffsetY });
        this._updateAttachedConnectors(id);
      }
    }
  }

  private _onPointerDown(wx: number, wy: number, e: PointerEvent): void {
    const hit = this._hitTest(wx, wy);
    if (!hit) return;
    this._ctx.events.emit(
      'shape:pointerdown',
      new ShapePointerDownEvent(this._fields(hit.id, hit.type, wx, wy, e)),
    );
    const obj = this._shapePool.get(hit.id) ?? this._connectorPool.get(hit.id);
    if (obj?.element.spec.draggable) {
      const center = this._shapePool.has(hit.id)
        ? (obj.element as BaseShape).getCenter()
        : { x: (obj.element.spec as BaseConnectorSpec).from.x, y: (obj.element.spec as BaseConnectorSpec).from.y };
      this._dragState = { id: hit.id, lastX: wx, lastY: wy, grabOffsetX: wx - center.x, grabOffsetY: wy - center.y };
      this._ctx.camera.lockPan();
      this._ctx.events.emit(
        'shape:dragstart',
        new ShapeDragStartEvent({ ...this._fields(hit.id, hit.type, wx, wy, e), dx: 0, dy: 0 }),
      );
    }
  }

  private _onPointerUp(wx: number, wy: number, e: PointerEvent): void {
    if (this._dragState) {
      const { id } = this._dragState;
      const type: 'shape' | 'connector' = this._shapePool.has(id) ? 'shape' : 'connector';
      this._dragState = null;
      this._ctx.camera.unlockPan();
      this._ctx.events.emit(
        'shape:dragend',
        new ShapeDragEndEvent({ ...this._fields(id, type, wx, wy, e), dx: 0, dy: 0 }),
      );
    }
    const hit = this._hitTest(wx, wy);
    if (!hit) return;
    this._ctx.events.emit(
      'shape:pointerup',
      new ShapePointerUpEvent(this._fields(hit.id, hit.type, wx, wy, e)),
    );
  }

  private _onPointerClick(wx: number, wy: number, e: PointerEvent): void {
    const hit = this._hitTest(wx, wy);
    if (!hit) return;
    this._ctx.events.emit('shape:click', new ShapeClickEvent(this._fields(hit.id, hit.type, wx, wy, e)));
  }

  private _onPointerDblClick(wx: number, wy: number, e: PointerEvent): void {
    const hit = this._hitTest(wx, wy);
    if (!hit) return;
    this._ctx.events.emit('shape:dblclick', new ShapeDblClickEvent(this._fields(hit.id, hit.type, wx, wy, e)));
  }

  private _onPointerContextMenu(wx: number, wy: number, e: PointerEvent): void {
    const hit = this._hitTest(wx, wy);
    if (!hit) return;
    this._ctx.events.emit('shape:contextmenu', new ShapeContextMenuEvent(this._fields(hit.id, hit.type, wx, wy, e)));
  }
}

// ── Backward-compatibility alias ─────────────────────────────────────────────
/** @deprecated Use {@link ShapesPlugin} instead. */
export { ShapesPlugin as GraphPlugin };

// ── File-local helpers ───────────────────────────────────────────────────────

/** Normalise a 2-vector. Returns `null` for zero-length input. */
function _unitOrNull(x: number, y: number): Point | null {
  const len = Math.sqrt(x * x + y * y);
  if (len < 1e-9) return null;
  return { x: x / len, y: y / len };
}

/**
 * Run the draft connector's router stage (if any) so the route reflects the
 * waypoints the user expects. Mirrors `BaseConnector._runRouter`.
 */
function _runDraftRouter(
  draft: BaseConnector,
  from: Point,
  to: Point,
  rawWaypoints: Point[],
  routerRegistry: Map<string, RouterFn>,
): Point[] {
  const routerField = draft.spec.router;
  if (!routerField) return rawWaypoints;
  const name = typeof routerField === 'string' ? routerField : routerField.name;
  const args = typeof routerField === 'object' ? routerField.args : undefined;
  const fn = routerRegistry.get(name);
  if (!fn) return rawWaypoints;
  return fn(from, to, rawWaypoints, args);
}

/**
 * Direction of the curve's tangent at the **start** of a route, expressed as
 * the angle of the vector pointing from the first control point back toward
 * `from`. Mirrors `BaseConnector._startTangentAngle`.
 */
function _startTangentAngleOfRoute(
  route: ReadonlyArray<{ cmd: string } & Record<string, number | string>>,
  from: Point,
  to: Point,
): number {
  const first = route[1] as
    | undefined
    | { cmd: 'L'; x: number; y: number }
    | { cmd: 'C'; cp1x: number; cp1y: number; cp2x: number; cp2y: number; x: number; y: number }
    | { cmd: 'Q'; cpx: number; cpy: number; x: number; y: number }
    | { cmd: 'Z' };
  if (!first) return Math.atan2(to.y - from.y, to.x - from.x);
  if (first.cmd === 'C') return Math.atan2(from.y - first.cp1y, from.x - first.cp1x);
  if (first.cmd === 'Q') return Math.atan2(from.y - first.cpy,  from.x - first.cpx);
  if (first.cmd !== 'Z' && 'x' in first) return Math.atan2(from.y - first.y, from.x - first.x);
  return Math.atan2(to.y - from.y, to.x - from.x);
}

/**
 * Direction of the curve's tangent at the **end** of a route, expressed as
 * the angle of the vector pointing from the last control point toward `to`
 * (i.e. the curve's direction of travel into the target).
 * Mirrors `BaseConnector._endTangentAngle`.
 */
function _endTangentAngleOfRoute(
  route: ReadonlyArray<{ cmd: string } & Record<string, number | string>>,
  from: Point,
  to: Point,
): number {
  const last = route[route.length - 1] as
    | undefined
    | { cmd: 'M' | 'L'; x: number; y: number }
    | { cmd: 'C'; cp1x: number; cp1y: number; cp2x: number; cp2y: number; x: number; y: number }
    | { cmd: 'Q'; cpx: number; cpy: number; x: number; y: number }
    | { cmd: 'Z' };
  if (!last) return Math.atan2(to.y - from.y, to.x - from.x);
  if (last.cmd === 'C') return Math.atan2(last.y - last.cp2y, last.x - last.cp2x);
  if (last.cmd === 'Q') return Math.atan2(last.y - last.cpy,  last.x - last.cpx);
  const prev = route[route.length - 2] as undefined | { x?: number; y?: number };
  const px = prev && typeof prev.x === 'number' ? prev.x : from.x;
  const py = prev && typeof prev.y === 'number' ? prev.y : from.y;
  return Math.atan2(to.y - py, to.x - px);
}
