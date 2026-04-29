// ── GraphDataPlugin ────────────────────────────────────────────────────────────
// High-level graph data management plugin for @invana/canvas.
// Wraps an owned GraphPlugin instance and exposes a clean data-oriented API.

import type { CanvasPlugin, PluginContext } from '@invana/canvas';
import { GraphPlugin } from './GraphPlugin.js';
import type { NodeCtor, EdgeCtor, RouterFn } from './GraphPlugin.js';
import type { BaseNode } from './BaseNode.js';
import type { DrawContext } from './DrawContext.js';
import type { ArrowSpec as ArrowSpec, Point, BaseNodeSpec, BaseEdgeSpec } from './spec/index.js';
import { GraphObject } from './GraphObject.js';
import type {
  INodeData,
  IEdgeData,
  ICanvasData,
  IGraphStyles,
  GraphDataPluginOptions,
  NodeShape,
  EdgePathType,
} from './graph-types.js';

/**
 * `GraphDataPlugin` — high-level graph data management plugin.
 *
 * @remarks
 * Wraps an internal {@link GraphPlugin} instance to provide a data-centric API.
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

  /** @internal Owned GraphPlugin — not exposed publicly. */
  private _elements: GraphPlugin;

  /** @internal Stored node data. D3 layout plugin mutates x/y in-place. */
  private _nodeStore = new Map<string, INodeData>();
  /** @internal Stored edge data. */
  private _edgeStore = new Map<string, IEdgeData>();

  /** @internal Current styles. */
  private _styles: IGraphStyles = {};

  private _fitOnRender: boolean;
  private _fitPadding: number;

  constructor(options: GraphDataPluginOptions = {}) {
    this.id            = options.key        ?? 'graph-data';
    this._fitOnRender  = options.fitOnRender ?? false;
    this._fitPadding   = options.fitPadding  ?? 40;

    this._elements = new GraphPlugin({ key: `${this.id}-elements` });
  }

  // ── CanvasPlugin lifecycle ────────────────────────────────────────────────

  register(ctx: PluginContext): void {
    return this._elements.register(ctx);
  }

  destroy(): void {
    this._elements.destroy();
    this._nodeStore.clear();
    this._edgeStore.clear();
  }

  // ── Data API ──────────────────────────────────────────────────────────────

  /**
   * Replace the entire graph dataset.
   * Clears all existing nodes/edges then renders the new data.
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

  /** Replace active style overrides and re-render all elements. */
  setStyles(styles: IGraphStyles): void {
    this._styles = styles;
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
    this._elements.addNode(shape, this._buildNodeSpec(node));
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
    this._elements.updateNode(id, this._buildNodeSpec(updated));
  }

  /** Remove a node and all its connected edges. */
  removeNode(id: string): void {
    if (!this._nodeStore.has(id)) return;
    this._nodeStore.delete(id);
    this._elements.removeNode(id);
    // Remove connected edges
    for (const [eid, edge] of this._edgeStore) {
      if (edge.source === id || edge.target === id) {
        this._edgeStore.delete(eid);
        this._elements.removeEdge(eid);
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
   * Returns the live rendered node element for a given id, or `undefined` if
   * the node has not been added yet. Use `.width` / `.height` on the returned
   * element to get the actual shape dimensions for layout plugins.
   */
  getNodeElement(id: string): BaseNode | undefined {
    const obj = this._elements.getNode(id);
    return obj ? (obj.element as BaseNode) : undefined;
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
    this._elements.addEdge(pathType, this._buildEdgeSpec(edge));
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
    this._elements.updateEdge(id, this._buildEdgeSpec(updated));
  }

  /** Remove an edge by id. */
  removeEdge(id: string): void {
    if (!this._edgeStore.has(id)) return;
    this._edgeStore.delete(id);
    this._elements.removeEdge(id);
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
   * Accepts a plain object map of `id → { x, y }`.
   */
  updateNodePositions(positions: Map<string, { x: number; y: number }>): void {
    for (const [id, pos] of positions) {
      const node = this._nodeStore.get(id);
      if (!node) continue;
      node.x = pos.x;
      node.y = pos.y;
      this._elements.updateNode(id, { x: pos.x, y: pos.y });
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
  registerNode(type: string, cls: NodeCtor): void {
    this._elements.registerNode(type, cls);
  }

  /** Register a custom edge class. */
  registerEdge(type: string, cls: EdgeCtor): void {
    this._elements.registerEdge(type, cls);
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
    for (const id of this._nodeStore.keys()) this._elements.removeNode(id);
    for (const id of this._edgeStore.keys()) this._elements.removeEdge(id);
  }

  private _renderAll(): void {
    // Add nodes first so edges can resolve sourceId/targetId
    for (const node of this._nodeStore.values()) {
      const shape: NodeShape = node.shape ?? 'circle';
      this._elements.addNode(shape, this._buildNodeSpec(node));
    }
    for (const edge of this._edgeStore.values()) {
      const pathType: EdgePathType = edge.pathType ?? 'bezier';
      this._elements.addEdge(pathType, this._buildEdgeSpec(edge));
    }
  }

  // ── Low-level spec API ────────────────────────────────────────────────────

  /** Add a node by type and raw spec. For the data-centric API use {@link addNode}. */
  addNodeSpec(type: string, spec: BaseNodeSpec): void {
    this._elements.addNode(type, spec);
  }

  /** Add an edge by type and raw spec. For the data-centric API use {@link addEdge}. */
  addEdgeSpec(type: string, spec: BaseEdgeSpec): void {
    this._elements.addEdge(type, spec);
  }

  /** Merge a raw spec patch into an existing node. */
  updateNodeSpec(id: string, spec: Partial<BaseNodeSpec>): void {
    this._elements.updateNode(id, spec);
  }

  /** Merge a raw spec patch into an existing edge. */
  updateEdgeSpec(id: string, spec: Partial<BaseEdgeSpec>): void {
    this._elements.updateEdge(id, spec);
  }

  /**
   * Bulk-load raw spec arrays, replacing all current elements.
   * Equivalent to the former `GraphPlugin.setData()`.
   */
  setDataSpec(
    solids: Array<{ type: string; spec: BaseNodeSpec }>,
    connectors: Array<{ type: string; spec: BaseEdgeSpec }> = [],
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

  /** Get the raw {@link GraphObject} for a node (for advanced use). */
  getNode(id: string): GraphObject | undefined {
    return this._elements.getNode(id);
  }

  /** Get the raw {@link GraphObject} for an edge (for advanced use). */
  getEdge(id: string): GraphObject | undefined {
    return this._elements.getEdge(id);
  }

  /** Remove all nodes and edges, stop animations, and reset state. */
  clear(): void {
    this._elements.clear();
    this._nodeStore.clear();
    this._edgeStore.clear();
  }

  /** Build a node spec from INodeData + current styles. */
  private _buildNodeSpec(node: INodeData): BaseNodeSpec {
    const ns = this._styles.node ?? {};
    const size = node.size ?? 40;
    const shape: NodeShape = node.shape ?? 'circle';

    // Geometry based on shape
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
      },
      ...geometry,
    } as BaseNodeSpec;
  }

  /** Build an GraphPlugin edge spec from IEdgeData + current styles. */
  private _buildEdgeSpec(edge: IEdgeData): BaseEdgeSpec {
    const es = this._styles.edge ?? {};
    const stroke  = typeof es.stroke      === 'function' ? es.stroke(edge)      : es.stroke;
    const sw      = typeof es.strokeWidth === 'function' ? es.strokeWidth(edge) : es.strokeWidth;
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
      },
    } as BaseEdgeSpec;
  }
}
