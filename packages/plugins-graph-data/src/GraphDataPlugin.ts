// ── GraphDataPlugin ────────────────────────────────────────────────────────────
// High-level graph data management plugin for @invana/canvas.
// Wraps an owned ShapesPlugin instance and exposes a clean data-oriented API.

import type { CanvasPlugin, PluginContext } from '@invana/canvas';
import {
  ShapesPlugin,
  type ShapeCtor,
  type ConnectorCtor,
  type RouterFn,
  type BaseShape,
  type DrawContext,
  type ArrowSpec,
  type Point,
  type BaseShapeSpec,
  type BaseConnectorSpec,
  ShapeObject,
} from '@invana/plugins-shapes';
import type {
  INodeData,
  IEdgeData,
  ICanvasData,
  IGraphStyles,
  GraphDataPluginOptions,
  NodeShape,
  EdgePathType,
} from './graph-types.js';

// Backward-compat type aliases for public API
/** @deprecated Use {@link ShapeCtor} from @invana/plugins-shapes. */
export type NodeCtor = ShapeCtor;
/** @deprecated Use {@link ConnectorCtor} from @invana/plugins-shapes. */
export type EdgeCtor = ConnectorCtor;

/**
 * `GraphDataPlugin` — high-level graph data management plugin.
 *
 * @remarks
 * Wraps an internal {@link ShapesPlugin} instance to provide a data-centric API.
 * Call {@link setData} with `ICanvasData` to render a full graph. Use CRUD methods
 * for incremental updates. Supports style overrides via {@link setStyles}.
 *
 * @example
 * ```ts
 * const graph = new GraphDataPlugin({ fitOnRender: true });
 * await canvas.plugins.register(graph);
 *
 * graph.setData({
 *   nodes: [{ id: 'n1', x: 0, y: 0, shape: 'circle', size: 40, label: 'A' }],
 *   edges: [{ id: 'e1', source: 'n1', target: 'n2', pathType: 'bezier' }],
 * });
 * ```
 */
export class GraphDataPlugin implements CanvasPlugin {
  readonly id: string;

  /** @internal Owned ShapesPlugin — not exposed publicly. */
  private _elements: ShapesPlugin;

  /** @internal Stored node data. D3 layout plugin mutates x/y in-place. */
  private _nodeStore = new Map<string, INodeData>();
  /** @internal Stored edge data. */
  private _edgeStore = new Map<string, IEdgeData>();

  /** @internal Current styles. */
  private _styles: IGraphStyles = {};

  private _fitOnRender: boolean;
  private _fitPadding: number;
  private _initialData?: ICanvasData;
  private _initialStyles?: IGraphStyles;

  constructor(options: GraphDataPluginOptions = {}) {
    this.id            = options.key        ?? 'graph-data';
    this._fitOnRender  = options.fitOnRender ?? false;
    this._fitPadding   = options.fitPadding  ?? 40;
    this._initialData  = options.data;
    this._initialStyles = options.styles;

    this._elements = new ShapesPlugin({ key: `${this.id}-elements` });
  }

  // ── CanvasPlugin lifecycle ────────────────────────────────────────────────

  register(ctx: PluginContext): void {
    this._elements.register(ctx);
    if (this._initialData) {
      this.setData(this._initialData);
    }
    if (this._initialStyles) {
      this.setStyles(this._initialStyles);
    }
  }

  destroy(): void {
    this._elements.destroy();
    this._nodeStore.clear();
    this._edgeStore.clear();
  }

  // ── Data API ──────────────────────────────────────────────────────────────

  /**
   * Replace the entire graph dataset.
   */
  setData(data: ICanvasData): void {
    this._clearAll();
    for (const node of data.nodes) {
      this._nodeStore.set(node.id, node);
    }
    for (const edge of data.edges) {
      this._edgeStore.set(edge.id, edge);
    }
    this._renderAll();
    if (this._fitOnRender) {
      this._elements.fitContent(this._fitPadding);
    }
  }

  /**
   * Merge style overrides and re-render all elements.
   * Existing properties not present in `styles` are preserved.
   */
  setStyles(styles: IGraphStyles): void {
    this._styles = {
      node: styles.node !== undefined
        ? { ...this._styles.node, ...styles.node }
        : this._styles.node,
      edge: styles.edge !== undefined
        ? { ...this._styles.edge, ...styles.edge }
        : this._styles.edge,
    };
    this._clearAll();
    this._renderAll();
  }

  // ── Node CRUD ─────────────────────────────────────────────────────────────

  /** Add a node. Throws if an id already exists. */
  addNode(node: INodeData): void {
    if (this._nodeStore.has(node.id)) {
      console.warn(`[GraphDataPlugin] addNode(): node "${node.id}" already exists.`);
      return;
    }
    this._nodeStore.set(node.id, node);
    const shape = node.shape ?? 'circle';
    this._elements.addShape(shape, this._buildNodeSpec(node));
  }

  /** Merge partial update into an existing node. */
  updateNode(id: string, partial: Partial<INodeData>): void {
    const existing = this._nodeStore.get(id);
    if (!existing) {
      console.warn(`[GraphDataPlugin] updateNode(): node "${id}" not found.`);
      return;
    }
    const updated = { ...existing, ...partial };
    this._nodeStore.set(id, updated);
    this._elements.updateShape(id, this._buildNodeSpec(updated));
  }

  /** Remove a node and all its connected edges. */
  removeNode(id: string): void {
    if (!this._nodeStore.has(id)) return;
    this._nodeStore.delete(id);
    this._elements.removeShape(id);
    // Remove connected edges
    for (const [eid, edge] of this._edgeStore) {
      if (edge.source === id || edge.target === id) {
        this._edgeStore.delete(eid);
        this._elements.removeConnector(eid);
      }
    }
  }

  /** Get stored node data by id. */
  getNodeData(id: string): INodeData | undefined {
    return this._nodeStore.get(id);
  }

  /** Returns the internal node store directly (for in-place layout mutation). */
  getNodeStore(): Map<string, INodeData> {
    return this._nodeStore;
  }

  /**
   * Returns the live rendered shape element for a given id.
   */
  getNodeElement(id: string): BaseShape | undefined {
    const obj = this._elements.getShape(id);
    return obj ? (obj.element as BaseShape) : undefined;
  }

  // ── Edge CRUD ─────────────────────────────────────────────────────────────

  /** Add an edge. */
  addEdge(edge: IEdgeData): void {
    if (this._edgeStore.has(edge.id)) {
      console.warn(`[GraphDataPlugin] addEdge(): edge "${edge.id}" already exists.`);
      return;
    }
    this._edgeStore.set(edge.id, edge);
    const pathType = edge.pathType ?? 'bezier';
    this._elements.addConnector(pathType, this._buildEdgeSpec(edge));
  }

  /** Merge partial update into an existing edge. */
  updateEdge(id: string, partial: Partial<IEdgeData>): void {
    const existing = this._edgeStore.get(id);
    if (!existing) {
      console.warn(`[GraphDataPlugin] updateEdge(): edge "${id}" not found.`);
      return;
    }
    const updated = { ...existing, ...partial };
    this._edgeStore.set(id, updated);
    this._elements.updateConnector(id, this._buildEdgeSpec(updated));
  }

  /** Remove an edge by id. */
  removeEdge(id: string): void {
    if (!this._edgeStore.has(id)) return;
    this._edgeStore.delete(id);
    this._elements.removeConnector(id);
  }

  /** Get stored edge data by id. */
  getEdgeData(id: string): IEdgeData | undefined {
    return this._edgeStore.get(id);
  }

  /** Returns the internal edge store directly. */
  getEdgeStore(): Map<string, IEdgeData> {
    return this._edgeStore;
  }

  // ── Layout contract ───────────────────────────────────────────────────────

  /**
   * Bulk-update node positions (used by layout plugins like D3Force).
   */
  updateNodePositions(positions: Map<string, { x: number; y: number }>): void {
    for (const [id, pos] of positions) {
      const node = this._nodeStore.get(id);
      if (!node) continue;
      node.x = pos.x;
      node.y = pos.y;
      this._elements.updateShape(id, { x: pos.x, y: pos.y });
    }
  }

  // ── Viewport ──────────────────────────────────────────────────────────────

  /** Fit the camera to show all graph elements. */
  fitContent(padding?: number): void {
    this._elements.fitContent(padding ?? this._fitPadding);
  }

  // ── State management delegation ───────────────────────────────────────────

  /** Activate a state on a node or edge. */
  addState(id: string, state: string): void {
    this._elements.setState(id, state, true);
  }

  /** Deactivate a state from a node or edge. */
  removeState(id: string, state: string): void {
    this._elements.setState(id, state, false);
  }

  /** Get all active states for a node or edge. */
  getStates(id: string): string[] {
    return this._elements.getStates(id);
  }

  // ── Animation delegation ──────────────────────────────────────────────────

  /** Start animations on a node element. */
  animate(id: string, spec: Record<string, unknown>): void {
    this._elements.animate(id, spec as never);
  }

  /** Stop one or all animations on a node element. */
  clearAnimation(id: string, type?: string): void {
    this._elements.clearAnimation(id, type);
  }

  // ── Registry delegation ───────────────────────────────────────────────────

  /** Register a custom node class. */
  registerNode(type: string, cls: ShapeCtor): void {
    this._elements.registerShape(type, cls);
  }

  /** Register a custom edge class. */
  registerEdge(type: string, cls: ConnectorCtor): void {
    this._elements.registerConnector(type, cls);
  }

  /** Register a custom edge router function. */
  registerRouter(name: string, fn: RouterFn): void {
    this._elements.registerRouter(name, fn);
  }

  /** Register a custom arrow marker function. */
  registerMarker(name: string, fn: (ctx: DrawContext, tip: Point, angle: number, spec: ArrowSpec) => void): void {
    this._elements.registerMarker(name, fn);
  }

  // ── Internal helpers ──────────────────────────────────────────────────────

  private _clearAll(): void {
    for (const id of this._nodeStore.keys()) this._elements.removeShape(id);
    for (const id of this._edgeStore.keys()) this._elements.removeConnector(id);
  }

  private _renderAll(): void {
    for (const node of this._nodeStore.values()) {
      const shape: NodeShape = node.shape ?? 'circle';
      this._elements.addShape(shape, this._buildNodeSpec(node));
    }
    for (const edge of this._edgeStore.values()) {
      const pathType: EdgePathType = edge.pathType ?? 'bezier';
      this._elements.addConnector(pathType, this._buildEdgeSpec(edge));
    }
  }

  // ── Low-level spec API ────────────────────────────────────────────────────

  /** Add a node by type and raw spec. For the data-centric API use {@link addNode}. */
  addNodeSpec(type: string, spec: BaseShapeSpec): void {
    this._elements.addShape(type, spec);
  }

  /** Add an edge by type and raw spec. For the data-centric API use {@link addEdge}. */
  addEdgeSpec(type: string, spec: BaseConnectorSpec): void {
    this._elements.addConnector(type, spec);
  }

  /** Merge a raw spec patch into an existing node. */
  updateNodeSpec(id: string, spec: Partial<BaseShapeSpec>): void {
    this._elements.updateShape(id, spec);
  }

  /** Merge a raw spec patch into an existing edge. */
  updateEdgeSpec(id: string, spec: Partial<BaseConnectorSpec>): void {
    this._elements.updateConnector(id, spec);
  }

  /**
   * Bulk-load raw spec arrays, replacing all current elements.
   */
  setDataSpec(
    solids: Array<{ type: string; spec: BaseShapeSpec }>,
    connectors: Array<{ type: string; spec: BaseConnectorSpec }> = [],
  ): void {
    this._elements.setData(solids, connectors);
  }

  // ── Convenience state helpers ─────────────────────────────────────────────

  /** Activate or deactivate a named state on a node or edge. */
  setState(id: string, state: string, active: boolean): void {
    this._elements.setState(id, state, active);
  }

  /** Deactivate a named state. Equivalent to `setState(id, state, false)`. */
  clearState(id: string, state: string): void {
    this._elements.setState(id, state, false);
  }

  // ── Element access ────────────────────────────────────────────────────────

  /** Get the world-space centre of a node element. */
  getCenter(id: string): Point | null {
    return this._elements.getCenter(id);
  }

  /** Get the perimeter attachment point on a node closest to `(toX, toY)`. */
  getConnectionPoint(id: string, toX: number, toY: number): Point | null {
    return this._elements.getConnectionPoint(id, toX, toY);
  }

  /** Get the raw {@link ShapeObject} for a node (for advanced use). */
  getNode(id: string): ShapeObject | undefined {
    return this._elements.getShape(id);
  }

  /** Get the raw {@link ShapeObject} for an edge (for advanced use). */
  getEdge(id: string): ShapeObject | undefined {
    return this._elements.getConnector(id);
  }

  /** Remove all nodes and edges, stop animations, and reset state. */
  clear(): void {
    this._elements.clear();
    this._nodeStore.clear();
    this._edgeStore.clear();
  }

  /** Build a shape spec from INodeData + current styles. */
  private _buildNodeSpec(node: INodeData): BaseShapeSpec {
    const ns = this._styles.node ?? {};
    const size = node.size ?? 40;
    const shape: NodeShape = node.shape ?? 'circle';

    let geometry: Record<string, number> = {};
    switch (shape) {
      case 'circle':
        geometry = { radius: size / 2 };
        break;
      case 'rect':
        geometry = { width: size, height: size };
        break;
      case 'ellipse':
        geometry = { radiusX: size / 2, radiusY: size / 3 };
        break;
      case 'polygon':
      case 'diamond':
      case 'star':
      case 'hexagon':
        geometry = { radius: size / 2 };
        break;
    }

    const fill    = typeof ns.fill    === 'function' ? ns.fill(node)    : ns.fill;
    const stroke  = typeof ns.stroke  === 'function' ? ns.stroke(node)  : ns.stroke;
    const sw      = typeof ns.strokeWidth === 'function' ? ns.strokeWidth(node) : ns.strokeWidth;
    const sa      = typeof ns.strokeAlpha === 'function' ? ns.strokeAlpha(node) : ns.strokeAlpha;
    const sc      = typeof ns.strokeCap === 'function' ? ns.strokeCap(node) : ns.strokeCap;
    const sj      = typeof ns.strokeJoin === 'function' ? ns.strokeJoin(node) : ns.strokeJoin;
    const sal     = typeof ns.strokeAlignment === 'function' ? ns.strokeAlignment(node) : ns.strokeAlignment;
    const sml     = typeof ns.strokeMiterLimit === 'function' ? ns.strokeMiterLimit(node) : ns.strokeMiterLimit;
    const opacity = typeof ns.opacity === 'function' ? ns.opacity(node) : (ns.opacity ?? node.opacity);

    return {
      id:          node.id,
      x:           node.x ?? 0,
      y:           node.y ?? 0,
      label:       node.label,
      interactive: node.interactive ?? true,
      draggable:   node.draggable   ?? true,
      states:      node.states,
      zIndex:      node.zIndex,
      cursor:      node.cursor,
      opacity:     opacity as number | undefined,
      data:        node.data,
      style: {
        ...(fill   !== undefined ? { fill }        : {}),
        ...(stroke !== undefined ? { stroke }      : {}),
        ...(sw     !== undefined ? { strokeWidth: sw } : {}),
        ...(sa     !== undefined ? { strokeAlpha: sa } : {}),
        ...(sc     !== undefined ? { strokeCap: sc } : {}),
        ...(sj     !== undefined ? { strokeJoin: sj } : {}),
        ...(sal    !== undefined ? { strokeAlignment: sal } : {}),
        ...(sml    !== undefined ? { strokeMiterLimit: sml } : {}),
      },
      ...geometry,
    } as BaseShapeSpec;
  }

  /** Build a connector spec from IEdgeData + current styles. */
  private _buildEdgeSpec(edge: IEdgeData): BaseConnectorSpec {
    const es = this._styles.edge ?? {};
    const stroke  = typeof es.stroke      === 'function' ? es.stroke(edge)      : es.stroke;
    const sw      = typeof es.strokeWidth === 'function' ? es.strokeWidth(edge) : es.strokeWidth;
    const sa      = typeof es.strokeAlpha === 'function' ? es.strokeAlpha(edge) : es.strokeAlpha;
    const sc      = typeof es.strokeCap === 'function' ? es.strokeCap(edge) : es.strokeCap;
    const sj      = typeof es.strokeJoin === 'function' ? es.strokeJoin(edge) : es.strokeJoin;
    const sal     = typeof es.strokeAlignment === 'function' ? es.strokeAlignment(edge) : es.strokeAlignment;
    const sml     = typeof es.strokeMiterLimit === 'function' ? es.strokeMiterLimit(edge) : es.strokeMiterLimit;
    const opacity = typeof es.opacity     === 'function' ? es.opacity(edge)     : (es.opacity ?? edge.opacity);

    return {
      id:          edge.id,
      sourceId:    edge.source,
      targetId:    edge.target,
      label:       edge.label,
      interactive: edge.interactive ?? false,
      draggable:   edge.draggable   ?? false,
      states:      edge.states,
      zIndex:      edge.zIndex,
      cursor:      edge.cursor,
      opacity:     opacity as number | undefined,
      data:        edge.data,
      ...(edge.router        !== undefined ? { router:       edge.router }        : {}),
      ...(edge.vertices      !== undefined ? { vertices:     edge.vertices }      : {}),
      ...(edge.sourceRadius  !== undefined ? { sourceRadius: edge.sourceRadius }  : {}),
      ...(edge.targetRadius  !== undefined ? { targetRadius: edge.targetRadius }  : {}),
      ...(edge.sourceOffset  !== undefined ? { sourceOffset: edge.sourceOffset }  : {}),
      ...(edge.targetOffset  !== undefined ? { targetOffset: edge.targetOffset }  : {}),
      ...(edge.startMarker   !== undefined ? { startMarker:  edge.startMarker }   : {}),
      ...(edge.endMarker     !== undefined ? { endMarker:    edge.endMarker }     : {}),
      style: {
        ...(stroke !== undefined ? { stroke }              : {}),
        ...(sw     !== undefined ? { strokeWidth: sw }     : {}),
        ...(sa     !== undefined ? { strokeAlpha: sa }     : {}),
        ...(sc     !== undefined ? { strokeCap: sc }       : {}),
        ...(sj     !== undefined ? { strokeJoin: sj }     : {}),
        ...(sal    !== undefined ? { strokeAlignment: sal } : {}),
        ...(sml    !== undefined ? { strokeMiterLimit: sml } : {}),
      },
      from: { x: 0, y: 0 },
      to:   { x: 0, y: 0 },
    } as BaseConnectorSpec;
  }
}
