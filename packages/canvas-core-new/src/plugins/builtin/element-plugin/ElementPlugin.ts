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
import type { BaseSolidSpec, BaseConnectorSpec, BBox, Point } from './spec/index.js';
import { CameraTracker } from '../shape-plugin/CameraTracker.js';
import { LODController } from '../shape-plugin/LODController.js';
import type { LODThresholds } from '../shape-plugin/LODController.js';
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
// Built-in connector types
import { StraightConnector } from './connectors/StraightConnector.js';
import { BezierConnector } from './connectors/BezierConnector.js';
import { OrthogonalConnector } from './connectors/OrthogonalConnector.js';

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

  // Animation frame ticker (for elements with onAnimationTick)
  private _ticker: Ticker | null = null;
  private _animSet = new Set<string>(); // ids of elements with onAnimationTick
  private _boundTick: ((t: Ticker) => void) | null = null;

  // Pointer state
  private _lastHoverId:    string | null = null;
  private _dragState: { id: string; lastX: number; lastY: number } | null = null;

  // ── Registries ────────────────────────────────────────────────────────────

  private _solidRegistry = new Map<string, SolidCtor>([
    ['circle',   CircleElement   as unknown as SolidCtor],
    ['rect',     RectElement     as unknown as SolidCtor],
    ['ellipse',  EllipseElement  as unknown as SolidCtor],
    ['polygon',  PolygonElement  as unknown as SolidCtor],
    ['diamond',  DiamondElement  as unknown as SolidCtor],
    ['star',     StarElement     as unknown as SolidCtor],
  ]);

  private _connRegistry = new Map<string, ConnectorCtor>([
    ['straight',    StraightConnector   as unknown as ConnectorCtor],
    ['bezier',      BezierConnector     as unknown as ConnectorCtor],
    ['orthogonal',  OrthogonalConnector as unknown as ConnectorCtor],
  ]);

  constructor(options: ElementPluginOptions = {}) {
    this.id            = options.key       ?? 'elements';
    this._zIndex       = options.zIndex    ?? 5;
    this._lodOptions   = options.lod       ?? {};
    this._fitOnRender  = options.fitOnRender ?? false;
    this._fitPadding   = options.fitPadding  ?? 60;
  }

  // ── CanvasPlugin lifecycle ────────────────────────────────────────────────

  /**
   * Called by {@link PluginSystem} when the plugin is registered on the canvas.
   * Wires all sub-systems and starts listening to canvas pointer events.
   */
  register(ctx: PluginContext): void {
    this._ctx = ctx;

    // Two layers: connectors below solids
    const connLayer  = ctx.createLayer({ id: `${this.id}-conn`,  zIndex: this._zIndex,     label: 'Connectors' });
    const solidLayer = ctx.createLayer({ id: `${this.id}-solid`, zIndex: this._zIndex + 1, label: 'Solids'     });

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
    this._cameraTracker.flush();
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
    const element = new Ctor(spec);
    const obj     = new ElementObject(element);
    this._connPool.add(obj);
    this._ctx.events.emit('element:added', new ElementAddedEvent({ elementId: spec.id, elementType: 'connector' }));
    if (element.onAnimationTick) this._animSet.add(spec.id);
    this._cameraTracker.flush();
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
    for (const { type, spec } of solids)     this.addSolid(type, spec);
    for (const { type, spec } of connectors) this.addConnector(type, spec);
    if (this._fitOnRender) this.fit(this._fitPadding);
    this._cameraTracker.flush();
  }

  /**
   * Remove all solids and connectors, stop animations, and reset state.
   */
  clear(): void {
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
      obj.element.onAnimationTick?.(dt);
      if (obj.isDirty) {
        const scene = this._solidPool.has(id) ? this._solidScene : this._connScene;
        scene.redraw(id);
      }
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
      const pool = this._solidPool.has(id) ? this._solidPool : this._connPool;
      const type: 'solid' | 'connector' = this._solidPool.has(id) ? 'solid' : 'connector';
      const dx = wx - lastX, dy = wy - lastY;
      this._dragState.lastX = wx;
      this._dragState.lastY = wy;
      this._ctx.events.emit(
        'element:dragmove',
        new ElementDragMoveEvent({ ...this._fields(id, type, wx, wy, e), dx, dy }),
      );
      void pool; // accessed via hitTest; pool reference kept for clarity
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
      this._dragState = { id: hit.id, lastX: wx, lastY: wy };
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
      this._ctx.events.emit(
        'element:dragend',
        new ElementDragEndEvent({ ...this._fields(id, type, wx, wy, e), dx: 0, dy: 0 }),
      );
      this._dragState = null;
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
