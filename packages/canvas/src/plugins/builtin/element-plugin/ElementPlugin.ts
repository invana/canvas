// ── ElementPlugin ─────────────────────────────────────────────────────────────
// High-level canvas plugin for solid elements and connector elements.
// Designed to eventually replace ShapePlugin when the feature set is complete.

import type { Ticker } from 'pixi.js';
import type { CanvasPlugin, PluginContext } from '../../types.js';
import { ElementPool } from './ElementPool.js';
import { ElementScene } from './ElementScene.js';
import { ElementObject } from './ElementObject.js';
import { BaseSolid } from './BaseSolid.js';
import { BaseConnector } from './BaseConnector.js';
import type { BaseSolidSpec, BaseConnectorSpec, BBox, Point, RouterFn, ArrowSpec } from './spec/index.js';
import { CameraTracker } from './CameraTracker.js';
import { LODController, type LODThresholds } from './LODController.js';
import { AnimationRegistry } from './AnimationRegistry.js';
import type { AnimationHandler } from './AnimationRegistry.js';
import { ElementHaloPool } from './ElementHaloPool.js';
import { defaultRegistry } from './handlers/index.js';
import type { ElementAnimations } from './spec/animations.js';
import {
  ElementClickEvent,
  ElementDblClickEvent,
  ElementContextMenuEvent,
  ElementPointerOverEvent,
  ElementPointerOutEvent,
  ElementPointerMoveEvent,
  ElementPointerDownEvent,
  ElementPointerUpEvent,
  ElementDragStartEvent,
  ElementDragMoveEvent,
  ElementDragEndEvent,
  ElementStateChangeEvent,
  ElementAddedEvent,
  ElementRemovedEvent,
} from './ElementEvents.js';

// Built-in solid types
import { CircleElement } from './elements/CircleElement.js';
import { RectElement } from './elements/RectElement.js';
import { EllipseElement } from './elements/EllipseElement.js';
import { PolygonElement } from './elements/PolygonElement.js';
import { DiamondElement } from './elements/DiamondElement.js';
import { StarElement } from './elements/StarElement.js';
import { HexagonElement } from './elements/HexagonElement.js';
// Built-in connector types
import { StraightConnector } from './connectors/StraightConnector.js';
import { BezierConnector } from './connectors/BezierConnector.js';
import { OrthogonalConnector } from './connectors/OrthogonalConnector.js';
import { QuadraticConnector } from './connectors/QuadraticConnector.js';
import { RoundedConnector } from './connectors/RoundedConnector.js';
import { SmoothConnector } from './connectors/SmoothConnector.js';
// Built-in routers
import { BUILTIN_ROUTERS } from './routers/builtins.js';
import type { DrawContext } from './DrawContext.js';

// ── Options ───────────────────────────────────────────────────────────────────

/**
 * Construction options for {@link ElementPlugin}.
 */
export interface ElementPluginOptions {
  /**
   * Plugin instance key.  Must be unique if multiple instances are registered.
   * Used as the layer id prefix and the plugin id.  Defaults to `'elements'`.
   */
  key?: string;
  /** z-index for the connector layer (default: 5). Solid layer = zIndex + 1. */
  zIndex?: number;
  /** Override LOD zoom thresholds. */
  lod?: Partial<LODThresholds>;
  /** Automatically fit the camera after `setData()` (default: false). */
  fitOnRender?: boolean;
  /** World-space padding used by `fit()` (default: 60). */
  fitPadding?: number;
  /**
   * Custom animation registry.  Defaults to {@link defaultRegistry} which is
   * pre-loaded with all built-in handlers.  Pass a new `AnimationRegistry` for
   * fully isolated animation type sets.
   */
  animationRegistry?: AnimationRegistry;
}

// ── Element constructor types ─────────────────────────────────────────────────

/** Constructor signature for solid element classes. */
export type SolidCtor = new (spec: BaseSolidSpec) => BaseSolid;
/** Constructor signature for connector element classes. */
export type ConnectorCtor = new (spec: BaseConnectorSpec) => BaseConnector;

// ── ElementPlugin ─────────────────────────────────────────────────────────────

/**
 * `ElementPlugin` — a typed, class-based canvas plugin for rendering solid shapes
 * and path connectors with full state management, LOD, and a clean event system.
 *
 * @remarks
 * **Relationship to `ShapePlugin`:** `ElementPlugin` is designed as the long-term
 * replacement for `ShapePlugin`.  Once it reaches feature parity (animations,
 * texture support, halo pool), `ShapePlugin` can be removed and this plugin
 * renamed.  Both can coexist on the same canvas during migration.
 *
 * **Three built-in solid types:** `'circle'`, `'rect'`, `'ellipse'`, `'polygon'`,
 * `'diamond'`, `'star'`.
 * **Three built-in connector types:** `'straight'`, `'bezier'`, `'orthogonal'`.
 * Register custom types via {@link registerElement} / {@link registerConnector}.
 *
 * @example
 * ```ts
 * const elements = new ElementPlugin({ fitOnRender: true });
 * await canvas.plugins.register(elements);
 *
 * elements.addSolid('circle', {
 *   id: 'n1', x: 0, y: 0, radius: 30,
 *   style: { fill: '#3fcbeb', stroke: '#ffffff', strokeWidth: 2 },
 *   label: 'Node', interactive: true,
 * });
 *
 * elements.addConnector('bezier', {
 *   id: 'e1', from: { x: 30, y: 0 }, to: { x: 170, y: 0 },
 *   style: { stroke: '#58a6ff', strokeWidth: 2 },
 * });
 *
 * canvas.events.on('element:click', ({ elementId, elementType }) => {
 *   console.log('clicked', elementId, elementType);
 * });
 * ```
 */
export class ElementPlugin implements CanvasPlugin {
  readonly id: string;

  private _zIndex:      number;
  private _lodOptions:  Partial<LODThresholds>;
  private _fitOnRender: boolean;
  private _fitPadding:  number;

  // Sub-systems (initialised in register())
  private _solidPool!:     ElementPool;
  private _connPool!:      ElementPool;
  private _solidScene!:    ElementScene;
  private _connScene!:     ElementScene;
  private _lod!:           LODController;
  private _cameraTracker!: CameraTracker;
  private _ctx!:           PluginContext;

  // Animation frame ticker
  private _ticker: Ticker | null = null;
  private _animSet = new Set<string>(); // ids of elements with active animations
  private _boundTick: ((t: Ticker) => void) | null = null;
  private _animRegistry: AnimationRegistry;
  private _halos!: ElementHaloPool;

  // Pointer state
  private _lastHoverId:    string | null = null;
  // grabOffsetX/Y = pointer world position minus element center at the moment of pointerdown.
  // Used to compute absolute element position each frame so the click point stays under the pointer.
  private _dragState: { id: string; lastX: number; lastY: number; grabOffsetX: number; grabOffsetY: number } | null = null;

  // Batch flag — suppresses per-element flush during setData()
  private _batchingAdd = false;

  // Reverse index: solidId → Set of connectorIds that have sourceId or targetId pointing to it.
  // Used to efficiently update connector endpoints when a solid is dragged.
  private _solidToConns = new Map<string, Set<string>>();

  // ── Registries ────────────────────────────────────────────────────────────

  /** @internal — type alias for custom marker functions. */
  private _markerRegistry = new Map<
    string,
    (ctx: DrawContext, tip: Point, angle: number, spec: ArrowSpec) => void
  >();

  /** @internal — router function registry (built-ins + user-registered). */
  private _routerRegistry = new Map<string, RouterFn>(BUILTIN_ROUTERS);

  private _solidRegistry = new Map<string, SolidCtor>([
    ['circle',   CircleElement   as unknown as SolidCtor],
    ['rect',     RectElement     as unknown as SolidCtor],
    ['ellipse',  EllipseElement  as unknown as SolidCtor],
    ['polygon',  PolygonElement  as unknown as SolidCtor],
    ['diamond',  DiamondElement  as unknown as SolidCtor],
    ['star',     StarElement     as unknown as SolidCtor],
    ['hexagon',  HexagonElement  as unknown as SolidCtor],
  ]);

  private _connRegistry = new Map<string, ConnectorCtor>([
    ['straight',    StraightConnector   as unknown as ConnectorCtor],
    ['bezier',      BezierConnector     as unknown as ConnectorCtor],
    ['orthogonal',  OrthogonalConnector as unknown as ConnectorCtor],
    ['quadratic',   QuadraticConnector  as unknown as ConnectorCtor],
    ['rounded',     RoundedConnector    as unknown as ConnectorCtor],
    ['smooth',      SmoothConnector     as unknown as ConnectorCtor],
  ]);

  constructor(options: ElementPluginOptions = {}) {
    this.id              = options.key               ?? 'elements';
    this._zIndex         = options.zIndex            ?? 5;
    this._lodOptions     = options.lod               ?? {};
    this._fitOnRender    = options.fitOnRender        ?? false;
    this._fitPadding     = options.fitPadding         ?? 60;
    this._animRegistry   = options.animationRegistry ?? defaultRegistry;
  }

  // ── CanvasPlugin lifecycle ────────────────────────────────────────────────

  /**
   * Called by {@link PluginSystem} when the plugin is registered on the canvas.
   * Wires all sub-systems and starts listening to canvas pointer events.
   */
  register(ctx: PluginContext): void {
    this._ctx = ctx;

    // Three layers: connectors → solids → halos
    const connLayer  = ctx.createLayer({ id: `${this.id}-conn`,  zIndex: this._zIndex,     label: 'Connectors' });
    const solidLayer = ctx.createLayer({ id: `${this.id}-solid`, zIndex: this._zIndex + 1, label: 'Solids'     });
    const haloLayer  = ctx.createLayer({ id: `${this.id}-halos`, zIndex: this._zIndex + 2, label: 'Halos'      });
    this._halos = new ElementHaloPool(haloLayer);

    this._solidPool  = new ElementPool();
    this._connPool   = new ElementPool();
    this._lod        = new LODController(this._lodOptions);
    this._solidScene = new ElementScene(solidLayer, this._solidPool);
    this._connScene  = new ElementScene(connLayer,  this._connPool);

    // Sync LOD to camera scale at startup
    this._lod.update(ctx.camera.scale);
    this._solidScene.onDetailChanged(this._lod.current);
    this._connScene.onDetailChanged(this._lod.current);

    // LOD tracking
    ctx.events.on('camera:zoom', ({ scale }) => {
      if (this._lod.update(scale)) {
        this._solidScene.onDetailChanged(this._lod.current);
        this._connScene.onDetailChanged(this._lod.current);
      }
    });

    // Viewport culling
    this._cameraTracker = new CameraTracker(
      ctx.camera,
      ctx.events,
      (bounds) => {
        this._solidScene.onCameraChanged(bounds);
        this._connScene.onCameraChanged(bounds);
      },
    );

    // Pointer events → element:* events
    ctx.events.on('canvas:pointermove',  (e) => this._onPointerMove(e.worldX, e.worldY, e.nativeEvent));
    ctx.events.on('canvas:pointerdown',  (e) => this._onPointerDown(e.worldX, e.worldY, e.nativeEvent));
    ctx.events.on('canvas:pointerup',    (e) => this._onPointerUp(e.worldX, e.worldY, e.nativeEvent));
    ctx.events.on('canvas:clicked',      (e) => this._onPointerClick(e.worldX, e.worldY, e.nativeEvent));
    ctx.events.on('canvas:dblclicked',   (e) => this._onPointerDblClick(e.worldX, e.worldY, e.nativeEvent));
    ctx.events.on('canvas:contextmenu',  (e) => this._onPointerContextMenu(e.worldX, e.worldY, e.nativeEvent));

    // PixiJS ticker for onAnimationTick
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
    this._solidScene?.clear();
    this._connScene?.clear();
    for (const obj of this._solidPool?.values() ?? []) obj.destroy();
    for (const obj of this._connPool?.values() ?? []) obj.destroy();
    this._solidPool?.clear();
    this._connPool?.clear();
    this._halos?.destroy();
  }

  // ── Element type registry ─────────────────────────────────────────────────

  /**
   * Register a custom solid element type.
   *
   * @example
   * ```ts
   * elementPlugin.registerElement('database', DatabaseNode);
   * elementPlugin.addSolid('database', { id: 'db1', x: 0, y: 0, ... });
   * ```
   */
  registerElement(type: string, cls: SolidCtor): void {
    this._solidRegistry.set(type, cls);
  }

  /**
   * Register a custom connector type.
   */
  registerConnector(type: string, cls: ConnectorCtor): void {
    this._connRegistry.set(type, cls);
  }

  /**
   * Register a custom router function under `name`.
   * After registration, connectors can use it via `router: name` or
   * `router: { name, args: { ... } }`.
   */
  registerRouter(name: string, fn: RouterFn): void {
    this._routerRegistry.set(name, fn);
  }

  /**
   * Register a custom marker (arrowhead) drawing function under `name`.
   * The function is called with the `DrawContext`, the tip `Point`, the
   * approach angle (radians), and the full `ArrowSpec`.
   */
  registerMarker(
    name: string,
    fn: (ctx: DrawContext, tip: Point, angle: number, spec: ArrowSpec) => void,
  ): void {
    this._markerRegistry.set(name, fn);
  }

  // ── Solid CRUD ────────────────────────────────────────────────────────────

  /**
   * Add a solid element of the given type.
   *
   * @param type - Registered solid type (e.g. `'circle'`, `'rect'`).
   * @param spec - Spec for the element.
   */
  addSolid(type: string, spec: BaseSolidSpec): void {
    const Ctor = this._solidRegistry.get(type);
    if (!Ctor) {
      console.warn(`[ElementPlugin] Unknown solid type: "${type}". Register it via registerElement().`);
      return;
    }
    const element = new Ctor(spec);
    const obj     = new ElementObject(element);
    this._solidPool.add(obj);
    this._ctx.events.emit('element:added', new ElementAddedEvent({ elementId: spec.id, elementType: 'solid' }));
    if (element.onAnimationTick) this._animSet.add(spec.id);
    if (!this._batchingAdd) this._cameraTracker.flush();
  }

  /**
   * Partially update a solid element's spec by id.
   * Merges the partial spec, recomputes the bbox, and triggers a redraw.
   */
  updateSolid(id: string, partial: Partial<BaseSolidSpec>): void {
    const obj = this._solidPool.get(id);
    if (!obj) return;
    const prev = { ...obj.element.spec };
    const next = { ...obj.element.spec, ...partial } as BaseSolidSpec;
    obj.element.spec = next;
    (obj.element as BaseSolid).onUpdate?.(prev as never, next as never);
    this._solidPool.updateBBox(obj);
    obj.markDirty();
    this._solidScene.redraw(id);
  }

  /** Remove a solid element by id. */
  removeSolid(id: string): void {
    this.clearAnimation(id); // stop all animations and return halo graphics
    this._solidToConns.delete(id);
    this._solidScene.evict(id);
    this._animSet.delete(id);
    const obj = this._solidPool.get(id);
    this._solidPool.remove(id);
    obj?.destroy();
    this._ctx.events.emit('element:removed', new ElementRemovedEvent({ elementId: id, elementType: 'solid' }));
  }

  /** Get the raw `ElementObject` wrapper for a solid by id. */
  getSolid(id: string): ElementObject | undefined {
    return this._solidPool.get(id);
  }

  // ── Connector CRUD ────────────────────────────────────────────────────────

  /**
   * Add a connector element of the given type.
   *
   * @param type - Registered connector type (e.g. `'straight'`, `'bezier'`).
   * @param spec - Spec for the connector.
   */
  addConnector(type: string, spec: BaseConnectorSpec): void {
    const Ctor = this._connRegistry.get(type);
    if (!Ctor) {
      console.warn(`[ElementPlugin] Unknown connector type: "${type}". Register it via registerConnector().`);
      return;
    }
    // Resolve from/to via getConnectionPoint when sourceId/targetId are provided
    const resolved = this._resolveConnEndpoints(spec);
    const resolvedSpec = { ...spec, from: resolved.from, to: resolved.to };
    const element = new Ctor(resolvedSpec);
    // Inject router and marker registries so the connector's draw() can use them
    (element as BaseConnector)._routerRegistry = this._routerRegistry;
    (element as BaseConnector)._markerRegistry = this._markerRegistry;
    const obj     = new ElementObject(element);
    this._connPool.add(obj);
    // Register in reverse index so drag updates keep this connector in sync
    this._registerConnAttachment(resolvedSpec);
    this._ctx.events.emit('element:added', new ElementAddedEvent({ elementId: spec.id, elementType: 'connector' }));
    if (element.onAnimationTick) this._animSet.add(spec.id);
    if (!this._batchingAdd) this._cameraTracker.flush();
  }

  /**
   * Partially update a connector element's spec by id.
   */
  updateConnector(id: string, partial: Partial<BaseConnectorSpec>): void {
    const obj = this._connPool.get(id);
    if (!obj) return;
    const prev = { ...obj.element.spec };
    const next = { ...obj.element.spec, ...partial } as BaseConnectorSpec;
    obj.element.spec = next;
    (obj.element as BaseConnector).onUpdate?.(prev as never, next as never);
    this._connPool.updateBBox(obj);
    obj.markDirty();
    this._connScene.redraw(id);
  }

  /** Remove a connector element by id. */
  removeConnector(id: string): void {
    this._unregisterConn(id);
    this._connScene.evict(id);
    this._animSet.delete(id);
    const obj = this._connPool.get(id);
    this._connPool.remove(id);
    obj?.destroy();
    this._ctx.events.emit('element:removed', new ElementRemovedEvent({ elementId: id, elementType: 'connector' }));
  }

  /** Get the raw `ElementObject` wrapper for a connector by id. */
  getConnector(id: string): ElementObject | undefined {
    return this._connPool.get(id);
  }

  // ── Geometry queries ──────────────────────────────────────────────────────

  /**
   * Bounding box for a solid element.  Returns `null` if not found.
   */
  getBBox(id: string): BBox | null {
    return this._solidPool.get(id)?.getBBox()
        ?? this._connPool.get(id)?.getBBox()
        ?? null;
  }

  /**
   * World-space centre of a solid element.
   * Used by `plugin-graph` for initial connector routing.
   */
  getCenter(id: string): Point | null {
    const obj = this._solidPool.get(id);
    if (!obj) return null;
    return (obj.element as BaseSolid).getCenter();
  }

  /**
   * Perimeter connection point for a solid element in the direction of `(toX, toY)`.
   * Used by `plugin-graph` to produce clean connector attachment positions.
   */
  getConnectionPoint(id: string, toX: number, toY: number): Point | null {
    const obj = this._solidPool.get(id);
    if (!obj) return null;
    return (obj.element as BaseSolid).getConnectionPoint(toX, toY);
  }

  // ── State API ─────────────────────────────────────────────────────────────

  /**
   * Set a named state on a solid or connector element.
   *
   * @remarks
   * Triggers style re-resolve, a redraw, and an `element:statechange` event.
   * Built-in states used by `ElementPlugin` automatically: `'hovered'`, `'selected'`.
   */
  setState(id: string, state: string, active: boolean): void {
    const pool = this._solidPool.has(id) ? this._solidPool : this._connPool;
    const scene = this._solidPool.has(id) ? this._solidScene : this._connScene;
    const obj = pool.get(id);
    if (!obj) return;
    obj.element.setState(state, active);
    scene.redraw(id);
    this._ctx.events.emit(
      'element:statechange',
      new ElementStateChangeEvent({ elementId: id, state, active }),
    );
  }

  /** Deactivate a single state on an element. */
  clearState(id: string, state: string): void {
    this.setState(id, state, false);
  }

  /** Deactivate all active states on an element. */
  clearAllStates(id: string): void {
    const obj = this._solidPool.get(id) ?? this._connPool.get(id);
    if (!obj) return;
    for (const state of [...obj.element.activeStates]) {
      this.setState(id, state, false);
    }
  }

  /** Return the list of currently active state names for an element. */
  getStates(id: string): string[] {
    const obj = this._solidPool.get(id) ?? this._connPool.get(id);
    return obj ? [...obj.element.activeStates] : [];
  }

  // ── Bulk API ──────────────────────────────────────────────────────────────

  /**
   * Replace all current elements with the provided sets.
   * Clears all existing elements, adds each spec, optionally fits the camera,
   * then flushes the camera tracker.
   */
  setData(
    solids:     Array<{ type: string; spec: BaseSolidSpec }>,
    connectors: Array<{ type: string; spec: BaseConnectorSpec }> = [],
  ): void {
    this.clear();
    this._batchingAdd = true;
    try {
      for (const { type, spec } of solids)     this.addSolid(type, spec);
      for (const { type, spec } of connectors) this.addConnector(type, spec);
    } finally {
      this._batchingAdd = false;
    }
    if (this._fitOnRender) this.fit(this._fitPadding);
    this._cameraTracker.flush();
  }

  /**
   * Remove all solids and connectors, stop animations, and reset state.
   */
  clear(): void {
    this._halos?.returnAll();
    this._solidScene.clear();
    this._connScene.clear();
    for (const obj of this._solidPool.values()) obj.destroy();
    for (const obj of this._connPool.values())  obj.destroy();
    this._solidPool.clear();
    this._connPool.clear();
    this._animSet.clear();
    this._lastHoverId = null;
    this._dragState   = null;
  }

  /**
   * Fit the camera to the bounding box of all solid elements.
   * @param padding - Extra world-space padding (default: 60).
   */
  fit(padding = 60): void {
    const boxes = [
      ...this._solidPool.allBBoxes(),
      ...this._connPool.allBBoxes(),
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
      const obj = this._solidPool.get(id) ?? this._connPool.get(id);
      if (!obj) { this._animSet.delete(id); continue; }

      const element = obj.element;
      let dirty = false;

      // Registry-based animations (BaseSolid only)
      if (element instanceof BaseSolid && element._animSlots.size > 0) {
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

      // Legacy per-element callback (both solids and connectors)
      element.onAnimationTick?.(dt);
      dirty = dirty || obj.isDirty;

      if (dirty) {
        obj.markDirty();
        const scene = this._solidPool.has(id) ? this._solidScene : this._connScene;
        scene.redraw(id);
      }

      // Remove from animSet when no more work to do
      if (
        element instanceof BaseSolid &&
        element._animSlots.size === 0 &&
        !element.onAnimationTick
      ) {
        this._animSet.delete(id);
      }
    }
  }

  /**
   * Start one or more animations on a solid element.
   *
   * @remarks
   * Multiple animations can run simultaneously. Calling `animate()` for a type
   * that is already running stops the current instance and restarts it.
   *
   * @param id   - Solid element id.
   * @param spec - Map of animation type → options.
   *
   * @example
   * ```ts
   * elements.animate('n1', { breathe: { amplitude: 0.12 } });
   * elements.animate('n1', { fadeIn: { duration: 500 }, colorCycle: { colors: ['#f00', '#0f0'] } });
   * ```
   */
  animate(id: string, spec: ElementAnimations): void {
    const obj = this._solidPool.get(id);
    if (!obj) {
      console.warn(`[ElementPlugin] animate(): solid element "${id}" not found.`);
      return;
    }
    const element = obj.element as BaseSolid;

    for (const [type, opts] of Object.entries(spec)) {
      if (opts === undefined || opts === null) continue;
      const handler = this._animRegistry.get(type) as AnimationHandler | undefined;
      if (!handler) {
        console.warn(`[ElementPlugin] animate(): no handler registered for type "${type}".`);
        continue;
      }
      // Stop existing slot for this type before restarting
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
   * Stop one or all animations on a solid element.
   *
   * @param id   - Solid element id.
   * @param type - Animation type to stop.  Omit to stop all animations.
   */
  clearAnimation(id: string, type?: string): void {
    const obj = this._solidPool.get(id);
    if (!obj) return;
    const element = obj.element as BaseSolid;
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

    // Apply resets to the container immediately
    this._applyContainerOverrides(obj, element);

    if (element._animSlots.size === 0 && !element.onAnimationTick) {
      this._animSet.delete(id);
    }
  }

  /**
   * Apply `_animOverrides` scale and alpha to the PixiJS Container.
   * Called after all handlers have run for a frame, and immediately after
   * {@link clearAnimation} to flush resets.
   * @internal
   */
  private _applyContainerOverrides(obj: ElementObject, element: BaseSolid): void {
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

  /**
   * Register a connector in the reverse solid→connector index.
   * Called by {@link addConnector} when the spec has `sourceId` or `targetId`.
   */
  private _registerConnAttachment(spec: BaseConnectorSpec): void {
    for (const solidId of [spec.sourceId, spec.targetId]) {
      if (!solidId) continue;
      if (!this._solidToConns.has(solidId)) this._solidToConns.set(solidId, new Set());
      this._solidToConns.get(solidId)!.add(spec.id);
    }
  }

  /**
   * Remove a connector from the reverse index.
   * Called by {@link removeConnector}.
   */
  private _unregisterConn(connId: string): void {
    for (const set of this._solidToConns.values()) set.delete(connId);
  }

  /**
   * Compute `from`/`to` endpoints for a connector spec that carries
   * `sourceId`/`targetId`, using each solid's `getConnectionPoint()`.
   * Falls back to the raw `spec.from`/`spec.to` when an id is not found.
   */
  private _resolveConnEndpoints(spec: BaseConnectorSpec): { from: Point; to: Point } {
    let from = spec.from;
    let to   = spec.to;
    if (spec.sourceId && spec.targetId) {
      const srcCenter = this.getCenter(spec.sourceId);
      const tgtCenter = this.getCenter(spec.targetId);
      if (srcCenter && tgtCenter) {
        from = this.getConnectionPoint(spec.sourceId, tgtCenter.x, tgtCenter.y) ?? from;
        to   = this.getConnectionPoint(spec.targetId, srcCenter.x, srcCenter.y) ?? to;
      }
    } else if (spec.sourceId) {
      from = this.getConnectionPoint(spec.sourceId, to.x, to.y) ?? from;
    } else if (spec.targetId) {
      to = this.getConnectionPoint(spec.targetId, from.x, from.y) ?? to;
    }
    return { from, to };
  }

  /**
   * Recompute `from`/`to` for every connector attached to `movedSolidId`.
   * Called automatically after a solid is repositioned during drag.
   */
  private _updateAttachedConnectors(movedSolidId: string): void {
    const connIds = this._solidToConns.get(movedSolidId);
    if (!connIds) return;
    for (const connId of connIds) {
      const connObj = this._connPool.get(connId);
      if (!connObj) continue;
      const spec   = connObj.element.spec as BaseConnectorSpec;
      const patch: Partial<BaseConnectorSpec> = {};

      if (spec.sourceId) {
        const tgtCenter = spec.targetId ? this.getCenter(spec.targetId) : spec.to;
        const dir = tgtCenter ?? spec.to;
        const cp = this.getConnectionPoint(spec.sourceId, dir.x, dir.y);
        if (cp) patch.from = cp;
      }
      if (spec.targetId) {
        const srcCenter = spec.sourceId ? this.getCenter(spec.sourceId) : spec.from;
        const dir = srcCenter ?? spec.from;
        const cp = this.getConnectionPoint(spec.targetId, dir.x, dir.y);
        if (cp) patch.to = cp;
      }
      if (patch.from || patch.to) this.updateConnector(connId, patch);
    }
  }

  // ── Pointer event handlers ────────────────────────────────────────────────

  private _hitTest(wx: number, wy: number): { id: string; type: 'solid' | 'connector' } | null {
    const solid = this._solidPool.hitTest(wx, wy);
    if (solid) return { id: solid.id, type: 'solid' };
    const conn = this._connPool.hitTest(wx, wy);
    if (conn)  return { id: conn.id,  type: 'connector' };
    return null;
  }

  private _fields(
    id: string,
    type: 'solid' | 'connector',
    wx: number,
    wy: number,
    nativeEvent: PointerEvent,
  ) {
    const obj = type === 'solid' ? this._solidPool.get(id) : this._connPool.get(id);
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

    // Hover leave
    if (this._lastHoverId && (!hit || hit.id !== this._lastHoverId)) {
      const prevObj  = this._solidPool.get(this._lastHoverId) ?? this._connPool.get(this._lastHoverId);
      const prevType = this._solidPool.has(this._lastHoverId) ? 'solid' : 'connector' as const;
      prevObj?.element.setState('hovered', false);
      const scene = this._solidPool.has(this._lastHoverId) ? this._solidScene : this._connScene;
      scene.redraw(this._lastHoverId);
      this._ctx.events.emit(
        'element:pointerout',
        new ElementPointerOutEvent(this._fields(this._lastHoverId, prevType, wx, wy, e)),
      );
      this._lastHoverId = null;
    }

    // Hover enter
    if (hit && hit.id !== this._lastHoverId) {
      const obj = this._solidPool.get(hit.id) ?? this._connPool.get(hit.id);
      obj?.element.setState('hovered', true);
      const scene = hit.type === 'solid' ? this._solidScene : this._connScene;
      scene.redraw(hit.id);
      this._ctx.events.emit(
        'element:pointerover',
        new ElementPointerOverEvent(this._fields(hit.id, hit.type, wx, wy, e)),
      );
      this._lastHoverId = hit.id;
    }

    // Pointermove on hovered element
    if (hit) {
      this._ctx.events.emit(
        'element:pointermove',
        new ElementPointerMoveEvent(this._fields(hit.id, hit.type, wx, wy, e)),
      );
    }

    // Drag move
    if (this._dragState) {
      const { id, lastX, lastY } = this._dragState;
      const isSolid = this._solidPool.has(id);
      const type: 'solid' | 'connector' = isSolid ? 'solid' : 'connector';
      const dx = wx - lastX, dy = wy - lastY;
      this._dragState.lastX = wx;
      this._dragState.lastY = wy;
      this._ctx.events.emit(
        'element:dragmove',
        new ElementDragMoveEvent({ ...this._fields(id, type, wx, wy, e), dx, dy }),
      );
      // Move the solid using absolute pointer position minus grab offset so the
      // clicked point stays under the pointer regardless of per-frame floating-point drift.
      if (isSolid) {
        const { grabOffsetX, grabOffsetY } = this._dragState!;
        this.updateSolid(id, { x: wx - grabOffsetX, y: wy - grabOffsetY });
        this._updateAttachedConnectors(id);
      }
    }
  }

  private _onPointerDown(wx: number, wy: number, e: PointerEvent): void {
    const hit = this._hitTest(wx, wy);
    if (!hit) return;
    this._ctx.events.emit(
      'element:pointerdown',
      new ElementPointerDownEvent(this._fields(hit.id, hit.type, wx, wy, e)),
    );
    const obj = this._solidPool.get(hit.id) ?? this._connPool.get(hit.id);
    if (obj?.element.spec.draggable) {
      // Record the offset from pointer to element center so the clicked point
      // stays under the pointer throughout the drag (absolute positioning each frame).
      const center = this._solidPool.has(hit.id)
        ? (obj.element as BaseSolid).getCenter()
        : { x: (obj.element.spec as BaseConnectorSpec).from.x, y: (obj.element.spec as BaseConnectorSpec).from.y };
      this._dragState = { id: hit.id, lastX: wx, lastY: wy, grabOffsetX: wx - center.x, grabOffsetY: wy - center.y };
      // Suspend viewport pan so it doesn't fight the element drag
      this._ctx.camera.lockPan();
      this._ctx.events.emit(
        'element:dragstart',
        new ElementDragStartEvent({ ...this._fields(hit.id, hit.type, wx, wy, e), dx: 0, dy: 0 }),
      );
    }
  }

  private _onPointerUp(wx: number, wy: number, e: PointerEvent): void {
    if (this._dragState) {
      const { id } = this._dragState;
      const type: 'solid' | 'connector' = this._solidPool.has(id) ? 'solid' : 'connector';
      this._dragState = null;
      // Resume viewport pan now that element drag is done
      this._ctx.camera.unlockPan();
      this._ctx.events.emit(
        'element:dragend',
        new ElementDragEndEvent({ ...this._fields(id, type, wx, wy, e), dx: 0, dy: 0 }),
      );
    }
    const hit = this._hitTest(wx, wy);
    if (!hit) return;
    this._ctx.events.emit(
      'element:pointerup',
      new ElementPointerUpEvent(this._fields(hit.id, hit.type, wx, wy, e)),
    );
  }

  private _onPointerClick(wx: number, wy: number, e: PointerEvent): void {
    const hit = this._hitTest(wx, wy);
    if (!hit) return;
    this._ctx.events.emit(
      'element:click',
      new ElementClickEvent(this._fields(hit.id, hit.type, wx, wy, e)),
    );
  }

  private _onPointerDblClick(wx: number, wy: number, e: PointerEvent): void {
    const hit = this._hitTest(wx, wy);
    if (!hit) return;
    this._ctx.events.emit(
      'element:dblclick',
      new ElementDblClickEvent(this._fields(hit.id, hit.type, wx, wy, e)),
    );
  }

  private _onPointerContextMenu(wx: number, wy: number, e: PointerEvent): void {
    const hit = this._hitTest(wx, wy);
    if (!hit) return;
    this._ctx.events.emit(
      'element:contextmenu',
      new ElementContextMenuEvent(this._fields(hit.id, hit.type, wx, wy, e)),
    );
  }
}
