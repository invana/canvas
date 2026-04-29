// ── GraphPlugin ───────────────────────────────────────────────────────────────
// Internal rendering engine for graph nodes and edges.
// Used by GraphDataPlugin as its rendering backend.

import type { Ticker } from 'pixi.js';
import type { CanvasPlugin, PluginContext } from '@invana/canvas';
import { GraphPool } from './GraphPool.js';
import { GraphScene } from './GraphScene.js';
import { GraphObject } from './GraphObject.js';
import { BaseNode } from './BaseNode.js';
import { BaseEdge } from './BaseEdge.js';
import type { BaseNodeSpec, BaseEdgeSpec, BBox, Point, RouterFn, ArrowSpec } from './spec/index.js';
export type { RouterFn };
import { CameraTracker } from './CameraTracker.js';
import { LODController, type LODThresholds } from './LODController.js';
import { AnimationRegistry } from './AnimationRegistry.js';
import type { AnimationHandler } from './AnimationRegistry.js';
import { HaloPool } from './HaloPool.js';
import { defaultRegistry } from './handlers/index.js';
import type { ElementAnimations } from './spec/animations.js';
import {
  GraphClickEvent,
  GraphDblClickEvent,
  GraphContextMenuEvent,
  GraphPointerOverEvent,
  GraphPointerOutEvent,
  GraphPointerMoveEvent,
  GraphPointerDownEvent,
  GraphPointerUpEvent,
  GraphDragStartEvent,
  GraphDragMoveEvent,
  GraphDragEndEvent,
  GraphStateChangeEvent,
  GraphAddedEvent,
  GraphRemovedEvent,
} from './GraphEvents.js';

// Built-in node types
import { CircleNode } from './nodes/CircleNode.js';
import { RectNode } from './nodes/RectNode.js';
import { EllipseNode } from './nodes/EllipseNode.js';
import { PolygonNode } from './nodes/PolygonNode.js';
import { DiamondNode } from './nodes/DiamondNode.js';
import { StarNode } from './nodes/StarNode.js';
import { HexagonNode } from './nodes/HexagonNode.js';
// Built-in edge types
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
 * Construction options for {@link GraphPlugin}.
 */
export interface GraphPluginOptions {
  /**
   * Plugin instance key.  Must be unique if multiple instances are registered.
   * Defaults to `'graph'`.
   */
  key?: string;
  /** z-index for the edge layer (default: 5). Node layer = zIndex + 1. */
  zIndex?: number;
  /** Override LOD zoom thresholds. */
  lod?: Partial<LODThresholds>;
  /**
   * Custom animation registry.  Defaults to {@link defaultRegistry}.
   */
  animationRegistry?: AnimationRegistry;
}

// ── Node/Edge constructor types ───────────────────────────────────────────────

/** Constructor signature for node element classes. */
export type NodeCtor = new (spec: BaseNodeSpec) => BaseNode;
/** Constructor signature for edge element classes. */
export type EdgeCtor = new (spec: BaseEdgeSpec) => BaseEdge;

// ── GraphPlugin ───────────────────────────────────────────────────────────────

/**
 * `GraphPlugin` — internal rendering engine for graph nodes and edges.
 * Used by `GraphDataPlugin` as its rendering backend.
 *
 * @remarks
 * **Node types:** `'circle'`, `'rect'`, `'ellipse'`, `'polygon'`,
 * `'diamond'`, `'star'`, `'hexagon'`.
 * **Edge types:** `'straight'`, `'bezier'`, `'orthogonal'`, `'quadratic'`,
 * `'rounded'`, `'smooth'`.
 * Register custom types via {@link registerNode} / {@link registerEdge}.
 *
 * @example
 * ```ts
 * const graph = new GraphPlugin();
 * await canvas.plugins.register(graph);
 *
 * graph.addNode('circle', {
 *   id: 'n1', x: 0, y: 0, radius: 30,
 *   style: { fill: '#3fcbeb', stroke: '#ffffff', strokeWidth: 2 },
 *   label: 'Node', interactive: true,
 * });
 *
 * graph.addEdge('bezier', {
 *   id: 'e1', from: { x: 30, y: 0 }, to: { x: 170, y: 0 },
 *   style: { stroke: '#58a6ff', strokeWidth: 2 },
 * });
 *
 * canvas.events.on('graph:click', ({ elementId, elementType }) => {
 *   console.log('clicked', elementId, elementType);
 * });
 * ```
 */
export class GraphPlugin implements CanvasPlugin {
  readonly id: string;

  private _zIndex:      number;
  private _lodOptions:  Partial<LODThresholds>;

  private _nodePool!:      GraphPool;
  private _edgePool!:      GraphPool;
  private _nodeScene!:     GraphScene;
  private _edgeScene!:     GraphScene;
  private _lod!:           LODController;
  private _cameraTracker!: CameraTracker;
  private _ctx!:           PluginContext;

  private _ticker: Ticker | null = null;
  private _animSet = new Set<string>();
  private _boundTick: ((t: Ticker) => void) | null = null;
  private _animRegistry: AnimationRegistry;
  private _halos!: HaloPool;

  private _lastHoverId:    string | null = null;
  private _dragState: { id: string; lastX: number; lastY: number; grabOffsetX: number; grabOffsetY: number } | null = null;

  private _batchingAdd = false;

  // Reverse index: nodeId → Set of edgeIds attached to it.
  private _nodeToEdges = new Map<string, Set<string>>();

  // ── Registries ────────────────────────────────────────────────────────────

  private _markerRegistry = new Map<
    string,
    (ctx: DrawContext, tip: Point, angle: number, spec: ArrowSpec) => void
  >();

  private _routerRegistry = new Map<string, RouterFn>(BUILTIN_ROUTERS);

  private _nodeRegistry = new Map<string, NodeCtor>([
    ['circle',   CircleNode   as unknown as NodeCtor],
    ['rect',     RectNode     as unknown as NodeCtor],
    ['ellipse',  EllipseNode  as unknown as NodeCtor],
    ['polygon',  PolygonNode  as unknown as NodeCtor],
    ['diamond',  DiamondNode  as unknown as NodeCtor],
    ['star',     StarNode     as unknown as NodeCtor],
    ['hexagon',  HexagonNode  as unknown as NodeCtor],
  ]);

  private _edgeRegistry = new Map<string, EdgeCtor>([
    ['straight',    StraightConnector   as unknown as EdgeCtor],
    ['bezier',      BezierConnector     as unknown as EdgeCtor],
    ['orthogonal',  OrthogonalConnector as unknown as EdgeCtor],
    ['quadratic',   QuadraticConnector  as unknown as EdgeCtor],
    ['rounded',     RoundedConnector    as unknown as EdgeCtor],
    ['smooth',      SmoothConnector     as unknown as EdgeCtor],
  ]);

  constructor(options: GraphPluginOptions = {}) {
    this.id              = options.key               ?? 'graph';
    this._zIndex         = options.zIndex            ?? 5;
    this._lodOptions     = options.lod               ?? {};
    this._animRegistry   = options.animationRegistry ?? defaultRegistry;
  }

  // ── CanvasPlugin lifecycle ────────────────────────────────────────────────

  register(ctx: PluginContext): void {
    this._ctx = ctx;

    const edgeLayer = ctx.createLayer({ id: `${this.id}-edges`, zIndex: this._zIndex,     label: 'Edges' });
    const nodeLayer = ctx.createLayer({ id: `${this.id}-nodes`, zIndex: this._zIndex + 1, label: 'Nodes' });
    const haloLayer = ctx.createLayer({ id: `${this.id}-halos`, zIndex: this._zIndex + 2, label: 'Halos' });
    this._halos = new HaloPool(haloLayer);

    this._nodePool  = new GraphPool();
    this._edgePool  = new GraphPool();
    this._lod       = new LODController(this._lodOptions);
    this._nodeScene = new GraphScene(nodeLayer, this._nodePool);
    this._edgeScene = new GraphScene(edgeLayer, this._edgePool);

    this._lod.update(ctx.camera.scale);
    this._nodeScene.onDetailChanged(this._lod.current);
    this._edgeScene.onDetailChanged(this._lod.current);

    ctx.events.on('camera:zoom', ({ scale }) => {
      if (this._lod.update(scale)) {
        this._nodeScene.onDetailChanged(this._lod.current);
        this._edgeScene.onDetailChanged(this._lod.current);
      }
    });

    this._cameraTracker = new CameraTracker(
      ctx.camera,
      ctx.events,
      (bounds) => {
        this._nodeScene.onCameraChanged(bounds);
        this._edgeScene.onCameraChanged(bounds);
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
    this._nodeScene?.clear();
    this._edgeScene?.clear();
    for (const obj of this._nodePool?.values() ?? []) obj.destroy();
    for (const obj of this._edgePool?.values() ?? []) obj.destroy();
    this._nodePool?.clear();
    this._edgePool?.clear();
    this._halos?.destroy();
  }

  // ── Type registry ─────────────────────────────────────────────────────────

  /**
   * Register a custom node type.
   *
   * @example
   * ```ts
   * graphPlugin.registerNode('database', DatabaseNode);
   * graphPlugin.addNode('database', { id: 'db1', x: 0, y: 0, ... });
   * ```
   */
  registerNode(type: string, cls: NodeCtor): void {
    this._nodeRegistry.set(type, cls);
  }

  /** Register a custom edge type. */
  registerEdge(type: string, cls: EdgeCtor): void {
    this._edgeRegistry.set(type, cls);
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

  // ── Node CRUD ─────────────────────────────────────────────────────────────

  /** Add a node of the given type. */
  addNode(type: string, spec: BaseNodeSpec): void {
    const Ctor = this._nodeRegistry.get(type);
    if (!Ctor) {
      console.warn(`[GraphPlugin] Unknown node type: "${type}". Register it via registerNode().`);
      return;
    }
    const node = new Ctor(spec);
    const obj  = new GraphObject(node);
    this._nodePool.add(obj);
    this._ctx.events.emit('graph:added', new GraphAddedEvent({ elementId: spec.id, elementType: 'node' }));
    if (node.onAnimationTick) this._animSet.add(spec.id);
    if (!this._batchingAdd) this._cameraTracker.flush();
  }

  /** Partially update a node's spec by id. */
  updateNode(id: string, partial: Partial<BaseNodeSpec>): void {
    const obj = this._nodePool.get(id);
    if (!obj) return;
    const prev = { ...obj.element.spec };
    const next = { ...obj.element.spec, ...partial } as BaseNodeSpec;
    obj.element.spec = next;
    (obj.element as BaseNode).onUpdate?.(prev as never, next as never);
    this._nodePool.updateBBox(obj);
    obj.markDirty();
    this._nodeScene.redraw(id);
    if (partial.x !== undefined || partial.y !== undefined) {
      this._updateAttachedEdges(id);
    }
  }

  /** Remove a node by id. */
  removeNode(id: string): void {
    this.clearAnimation(id);
    this._nodeToEdges.delete(id);
    this._nodeScene.evict(id);
    this._animSet.delete(id);
    const obj = this._nodePool.get(id);
    this._nodePool.remove(id);
    obj?.destroy();
    this._ctx.events.emit('graph:removed', new GraphRemovedEvent({ elementId: id, elementType: 'node' }));
  }

  /** Get the raw `GraphObject` wrapper for a node by id. */
  getNode(id: string): GraphObject | undefined {
    return this._nodePool.get(id);
  }

  // ── Edge CRUD ─────────────────────────────────────────────────────────────

  /** Add an edge of the given type. */
  addEdge(type: string, spec: BaseEdgeSpec): void {
    const Ctor = this._edgeRegistry.get(type);
    if (!Ctor) {
      console.warn(`[GraphPlugin] Unknown edge type: "${type}". Register it via registerEdge().`);
      return;
    }
    const resolved = this._resolveEdgeEndpoints(spec);
    const resolvedSpec = { ...spec, from: resolved.from, to: resolved.to };
    const edge = new Ctor(resolvedSpec);
    (edge as BaseEdge)._routerRegistry = this._routerRegistry;
    (edge as BaseEdge)._markerRegistry = this._markerRegistry;
    const obj  = new GraphObject(edge);
    this._edgePool.add(obj);
    this._registerEdgeAttachment(resolvedSpec);
    this._ctx.events.emit('graph:added', new GraphAddedEvent({ elementId: spec.id, elementType: 'edge' }));
    if (edge.onAnimationTick) this._animSet.add(spec.id);
    if (!this._batchingAdd) this._cameraTracker.flush();
  }

  /** Partially update an edge's spec by id. */
  updateEdge(id: string, partial: Partial<BaseEdgeSpec>): void {
    const obj = this._edgePool.get(id);
    if (!obj) return;
    const prev = { ...obj.element.spec };
    const next = { ...obj.element.spec, ...partial } as BaseEdgeSpec;
    obj.element.spec = next;
    (obj.element as BaseEdge).onUpdate?.(prev as never, next as never);
    this._edgePool.updateBBox(obj);
    obj.markDirty();
    this._edgeScene.redraw(id);
  }

  /** Remove an edge by id. */
  removeEdge(id: string): void {
    this._unregisterEdge(id);
    this._edgeScene.evict(id);
    this._animSet.delete(id);
    const obj = this._edgePool.get(id);
    this._edgePool.remove(id);
    obj?.destroy();
    this._ctx.events.emit('graph:removed', new GraphRemovedEvent({ elementId: id, elementType: 'edge' }));
  }

  /** Get the raw `GraphObject` wrapper for an edge by id. */
  getEdge(id: string): GraphObject | undefined {
    return this._edgePool.get(id);
  }

  // ── Geometry queries ──────────────────────────────────────────────────────

  /** Bounding box for a node or edge.  Returns `null` if not found. */
  getBBox(id: string): BBox | null {
    return this._nodePool.get(id)?.getBBox()
        ?? this._edgePool.get(id)?.getBBox()
        ?? null;
  }

  /** World-space centre of a node. */
  getCenter(id: string): Point | null {
    const obj = this._nodePool.get(id);
    if (!obj) return null;
    return (obj.element as BaseNode).getCenter();
  }

  /** Perimeter connection point for a node in the direction of `(toX, toY)`. */
  getConnectionPoint(id: string, toX: number, toY: number): Point | null {
    const obj = this._nodePool.get(id);
    if (!obj) return null;
    return (obj.element as BaseNode).getConnectionPoint(toX, toY);
  }

  // ── State API ─────────────────────────────────────────────────────────────

  /** Set a named state on a node or edge. */
  setState(id: string, state: string, active: boolean): void {
    const pool  = this._nodePool.has(id) ? this._nodePool  : this._edgePool;
    const scene = this._nodePool.has(id) ? this._nodeScene : this._edgeScene;
    const obj = pool.get(id);
    if (!obj) return;
    obj.element.setState(state, active);
    scene.redraw(id);
    this._ctx.events.emit(
      'graph:statechange',
      new GraphStateChangeEvent({ elementId: id, state, active }),
    );
  }

  /** Deactivate a single state on an element. */
  clearState(id: string, state: string): void {
    this.setState(id, state, false);
  }

  /** Deactivate all active states on an element. */
  clearAllStates(id: string): void {
    const obj = this._nodePool.get(id) ?? this._edgePool.get(id);
    if (!obj) return;
    for (const state of [...obj.element.activeStates]) {
      this.setState(id, state, false);
    }
  }

  /** Return the list of currently active state names for an element. */
  getStates(id: string): string[] {
    const obj = this._nodePool.get(id) ?? this._edgePool.get(id);
    return obj ? [...obj.element.activeStates] : [];
  }

  // ── Bulk API ──────────────────────────────────────────────────────────────

  /**
   * Replace all current elements with the provided sets.
   */
  setData(
    nodes:     Array<{ type: string; spec: BaseNodeSpec }>,
    edges: Array<{ type: string; spec: BaseEdgeSpec }> = [],
  ): void {
    this.clear();
    this._batchingAdd = true;
    try {
      for (const { type, spec } of nodes) this.addNode(type, spec);
      for (const { type, spec } of edges) this.addEdge(type, spec);
    } finally {
      this._batchingAdd = false;
    }
    this._cameraTracker.flush();
  }

  /** Remove all nodes and edges, stop animations, and reset state. */
  clear(): void {
    this._halos?.returnAll();
    this._nodeScene.clear();
    this._edgeScene.clear();
    for (const obj of this._nodePool.values()) obj.destroy();
    for (const obj of this._edgePool.values())  obj.destroy();
    this._nodePool.clear();
    this._edgePool.clear();
    this._animSet.clear();
    this._lastHoverId = null;
    this._dragState   = null;
  }

  /**
   * Fit the camera to the bounding box of all elements.
   * @param padding - Extra world-space padding (default: 60).
   */
  fitContent(padding = 60): void {
    const boxes = [
      ...this._nodePool.allBBoxes(),
      ...this._edgePool.allBBoxes(),
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
      const obj = this._nodePool.get(id) ?? this._edgePool.get(id);
      if (!obj) { this._animSet.delete(id); continue; }

      const element = obj.element;
      let dirty = false;

      if (element instanceof BaseNode && element._animSlots.size > 0) {
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
        const scene = this._nodePool.has(id) ? this._nodeScene : this._edgeScene;
        scene.redraw(id);
      }

      if (
        element instanceof BaseNode &&
        element._animSlots.size === 0 &&
        !element.onAnimationTick
      ) {
        this._animSet.delete(id);
      }
    }
  }

  /**
   * Start one or more animations on a node.
   *
   * @example
   * ```ts
   * graphPlugin.animate('n1', { breathe: { amplitude: 0.12 } });
   * ```
   */
  animate(id: string, spec: ElementAnimations): void {
    const obj = this._nodePool.get(id);
    if (!obj) {
      console.warn(`[GraphPlugin] animate(): node "${id}" not found.`);
      return;
    }
    const element = obj.element as BaseNode;

    for (const [type, opts] of Object.entries(spec)) {
      if (opts === undefined || opts === null) continue;
      const handler = this._animRegistry.get(type) as AnimationHandler | undefined;
      if (!handler) {
        console.warn(`[GraphPlugin] animate(): no handler registered for type "${type}".`);
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
   * Stop one or all animations on a node.
   *
   * @param id   - Node id.
   * @param type - Animation type to stop.  Omit to stop all animations.
   */
  clearAnimation(id: string, type?: string): void {
    const obj = this._nodePool.get(id);
    if (!obj) return;
    const element = obj.element as BaseNode;
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

  private _applyContainerOverrides(obj: GraphObject, element: BaseNode): void {
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

  // ── Edge attachment helpers ───────────────────────────────────────────────

  private _registerEdgeAttachment(spec: BaseEdgeSpec): void {
    for (const nodeId of [spec.sourceId, spec.targetId]) {
      if (!nodeId) continue;
      if (!this._nodeToEdges.has(nodeId)) this._nodeToEdges.set(nodeId, new Set());
      this._nodeToEdges.get(nodeId)!.add(spec.id);
    }
  }

  private _unregisterEdge(edgeId: string): void {
    for (const set of this._nodeToEdges.values()) set.delete(edgeId);
  }

  private _resolveEdgeEndpoints(spec: BaseEdgeSpec): { from: Point; to: Point } {
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

  private _updateAttachedEdges(movedNodeId: string): void {
    const edgeIds = this._nodeToEdges.get(movedNodeId);
    if (!edgeIds) return;
    for (const edgeId of edgeIds) {
      const edgeObj = this._edgePool.get(edgeId);
      if (!edgeObj) continue;
      const spec   = edgeObj.element.spec as BaseEdgeSpec;
      const patch: Partial<BaseEdgeSpec> = {};

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
      if (patch.from || patch.to) this.updateEdge(edgeId, patch);
    }
  }

  // ── Pointer event handlers ────────────────────────────────────────────────

  private _hitTest(wx: number, wy: number): { id: string; type: 'node' | 'edge' } | null {
    const node = this._nodePool.hitTest(wx, wy);
    if (node) return { id: node.id, type: 'node' };
    const edge = this._edgePool.hitTest(wx, wy);
    if (edge) return { id: edge.id, type: 'edge' };
    return null;
  }

  private _fields(
    id: string,
    type: 'node' | 'edge',
    wx: number,
    wy: number,
    nativeEvent: PointerEvent,
  ) {
    const obj = type === 'node' ? this._nodePool.get(id) : this._edgePool.get(id);
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
      const prevObj  = this._nodePool.get(this._lastHoverId) ?? this._edgePool.get(this._lastHoverId);
      const prevType = this._nodePool.has(this._lastHoverId) ? 'node' : 'edge' as const;
      prevObj?.element.setState('hovered', false);
      const scene = this._nodePool.has(this._lastHoverId) ? this._nodeScene : this._edgeScene;
      scene.redraw(this._lastHoverId);
      this._ctx.events.emit(
        'graph:pointerout',
        new GraphPointerOutEvent(this._fields(this._lastHoverId, prevType, wx, wy, e)),
      );
      this._lastHoverId = null;
    }

    if (hit && hit.id !== this._lastHoverId) {
      const obj = this._nodePool.get(hit.id) ?? this._edgePool.get(hit.id);
      obj?.element.setState('hovered', true);
      const scene = hit.type === 'node' ? this._nodeScene : this._edgeScene;
      scene.redraw(hit.id);
      this._ctx.events.emit(
        'graph:pointerover',
        new GraphPointerOverEvent(this._fields(hit.id, hit.type, wx, wy, e)),
      );
      this._lastHoverId = hit.id;
    }

    if (hit) {
      this._ctx.events.emit(
        'graph:pointermove',
        new GraphPointerMoveEvent(this._fields(hit.id, hit.type, wx, wy, e)),
      );
    }

    if (this._dragState) {
      const { id, lastX, lastY } = this._dragState;
      const isNode = this._nodePool.has(id);
      const type: 'node' | 'edge' = isNode ? 'node' : 'edge';
      const dx = wx - lastX, dy = wy - lastY;
      this._dragState.lastX = wx;
      this._dragState.lastY = wy;
      this._ctx.events.emit(
        'graph:dragmove',
        new GraphDragMoveEvent({ ...this._fields(id, type, wx, wy, e), dx, dy }),
      );
      if (isNode) {
        const { grabOffsetX, grabOffsetY } = this._dragState!;
        this.updateNode(id, { x: wx - grabOffsetX, y: wy - grabOffsetY });
        this._updateAttachedEdges(id);
      }
    }
  }

  private _onPointerDown(wx: number, wy: number, e: PointerEvent): void {
    const hit = this._hitTest(wx, wy);
    if (!hit) return;
    this._ctx.events.emit(
      'graph:pointerdown',
      new GraphPointerDownEvent(this._fields(hit.id, hit.type, wx, wy, e)),
    );
    const obj = this._nodePool.get(hit.id) ?? this._edgePool.get(hit.id);
    if (obj?.element.spec.draggable) {
      const center = this._nodePool.has(hit.id)
        ? (obj.element as BaseNode).getCenter()
        : { x: (obj.element.spec as BaseEdgeSpec).from.x, y: (obj.element.spec as BaseEdgeSpec).from.y };
      this._dragState = { id: hit.id, lastX: wx, lastY: wy, grabOffsetX: wx - center.x, grabOffsetY: wy - center.y };
      this._ctx.camera.lockPan();
      this._ctx.events.emit(
        'graph:dragstart',
        new GraphDragStartEvent({ ...this._fields(hit.id, hit.type, wx, wy, e), dx: 0, dy: 0 }),
      );
    }
  }

  private _onPointerUp(wx: number, wy: number, e: PointerEvent): void {
    if (this._dragState) {
      const { id } = this._dragState;
      const type: 'node' | 'edge' = this._nodePool.has(id) ? 'node' : 'edge';
      this._dragState = null;
      this._ctx.camera.unlockPan();
      this._ctx.events.emit(
        'graph:dragend',
        new GraphDragEndEvent({ ...this._fields(id, type, wx, wy, e), dx: 0, dy: 0 }),
      );
    }
    const hit = this._hitTest(wx, wy);
    if (!hit) return;
    this._ctx.events.emit(
      'graph:pointerup',
      new GraphPointerUpEvent(this._fields(hit.id, hit.type, wx, wy, e)),
    );
  }

  private _onPointerClick(wx: number, wy: number, e: PointerEvent): void {
    const hit = this._hitTest(wx, wy);
    if (!hit) return;
    this._ctx.events.emit('graph:click', new GraphClickEvent(this._fields(hit.id, hit.type, wx, wy, e)));
  }

  private _onPointerDblClick(wx: number, wy: number, e: PointerEvent): void {
    const hit = this._hitTest(wx, wy);
    if (!hit) return;
    this._ctx.events.emit('graph:dblclick', new GraphDblClickEvent(this._fields(hit.id, hit.type, wx, wy, e)));
  }

  private _onPointerContextMenu(wx: number, wy: number, e: PointerEvent): void {
    const hit = this._hitTest(wx, wy);
    if (!hit) return;
    this._ctx.events.emit('graph:contextmenu', new GraphContextMenuEvent(this._fields(hit.id, hit.type, wx, wy, e)));
  }
}
