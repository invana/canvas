/**
 * Canvas - Main entry point for the rendering engine
 */

import type {
  Bounds,
  CanvasConfig,
  CanvasSnapshot,
  EdgeData,
  EdgeShapeType,
  GraphData,
  InteractionConfig,
  NodeData,
  NodeShapeType,
  Point,
  ViewportConfig,
  ViewportState,
} from '../types/index.js';
import type { Theme, ThemeName } from '../types/theme.js';
import type { Plugin } from '../types/plugin.js';

import { Graph } from '../graph/Graph.js';
import { PixiRenderer } from '../renderer/PixiRenderer.js';
import { Viewport } from './Viewport.js';
import { EventEmitter } from '../events/EventEmitter.js';
import { CanvasEvents } from '../events/CanvasEvents.js';
import { NodeStateManager, EdgeStateManager, SelectionManager } from '../state/index.js';
import { InteractionManager } from '../interaction/InteractionManager.js';
import { ThemeManager } from '../theming/ThemeManager.js';
import { PluginManager } from '../plugins/PluginManager.js';

// Node shapes
import { CircleNode } from '../shapes/nodes/CircleNode.js';
import { RectangleNode } from '../shapes/nodes/RectangleNode.js';
import { PolygonNode } from '../shapes/nodes/PolygonNode.js';
import type { BaseNodeShape } from '../shapes/nodes/BaseNodeShape.js';

// Edge shapes
import { StraightEdge } from '../shapes/edges/StraightEdge.js';
import { BezierEdge } from '../shapes/edges/BezierEdge.js';
import { OrthogonalEdge } from '../shapes/edges/OrthogonalEdge.js';
import type { BaseEdgeShape } from '../shapes/edges/BaseEdgeShape.js';

const VERSION = '0.0.1';

export interface CanvasOptions extends Omit<CanvasConfig, 'container'> {
  theme?: Theme | ThemeName;
}

export class Canvas {
  private _container: HTMLElement;
  private _canvas: HTMLCanvasElement;
  private _config: CanvasOptions;

  // Core systems
  private _renderer: PixiRenderer;
  private _graph: Graph;
  private _viewport: Viewport;
  private _events: EventEmitter;

  // State
  private _nodeStates: NodeStateManager;
  private _edgeStates: EdgeStateManager;
  private _selection: SelectionManager;

  // Managers
  private _interactions: InteractionManager;
  private _theme: ThemeManager;
  private _plugins: PluginManager;

  // Shape instances
  private _nodeShapes: Map<string, BaseNodeShape> = new Map();
  private _edgeShapes: Map<string, BaseEdgeShape> = new Map();

  // Status
  private _initialized = false;
  private _destroyed = false;

  constructor(container: HTMLElement | string, options: CanvasOptions = {}) {
    // Resolve container
    if (typeof container === 'string') {
      const el = document.querySelector(container);
      if (!el) {
        throw new Error(`Container element not found: ${container}`);
      }
      this._container = el as HTMLElement;
    } else {
      this._container = container;
    }

    this._config = options;

    // Create canvas element
    this._canvas = document.createElement('canvas');
    this._canvas.style.width = '100%';
    this._canvas.style.height = '100%';
    this._canvas.style.display = 'block';
    this._container.appendChild(this._canvas);

    // Initialize core systems
    this._events = new EventEmitter();
    this._graph = new Graph();
    this._renderer = new PixiRenderer();
    this._viewport = null!; // Will be set after renderer init

    // Initialize state managers
    this._nodeStates = new NodeStateManager();
    this._edgeStates = new EdgeStateManager();
    this._selection = new SelectionManager();

    // Initialize managers (will be fully set up after renderer init)
    this._theme = new ThemeManager(options.theme);
    this._plugins = new PluginManager(this._events);
    this._interactions = null!; // Will be set after renderer init

    // Setup state change listeners
    this._setupStateListeners();
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  async initialize(): Promise<void> {
    if (this._initialized) {
      console.warn('Canvas already initialized');
      return;
    }

    const width = this._config.width ?? this._container.clientWidth;
    const height = this._config.height ?? this._container.clientHeight;

    this._canvas.width = width;
    this._canvas.height = height;

    // Initialize renderer
    await this._renderer.initialize(this._canvas, this._config.renderer);

    // Set background color from theme
    this._renderer.setBackgroundColor(this._theme.colors.background);

    // Create viewport
    this._viewport = new Viewport(
      this._renderer.viewport,
      this._config.viewport,
    );
    this._viewport.setSize(width, height);

    // Setup viewport change listener
    this._viewport.onChange((state) => {
      this._events.emit(CanvasEvents.VIEWPORT_CHANGED, { viewport: state });
    });

    // Create interaction manager
    this._interactions = new InteractionManager({
      viewport: this._viewport,
      stage: this._renderer.stage,
      getNodes: () => this._nodeShapes,
      getEdges: () => this._edgeShapes,
      events: this._events,
    });

    if (this._config.interactions) {
      this._interactions.configure(this._config.interactions);
    }

    // Update connected edges when nodes are dragged
    this._events.on(CanvasEvents.NODE_DRAG, (data) => {
      const { node } = data as { node: { id: string } };
      this._updateConnectedEdges(node.id);
    });

    // Set canvas reference in plugin manager
    this._plugins.setCanvas(this);

    // Setup render loop
    this._renderer.onRender((deltaTime) => {
      this._updateAnimations(deltaTime);
      this._plugins.onRender(deltaTime);
    });

    // Setup auto-resize if enabled
    if (this._config.autoResize !== false) {
      this._setupAutoResize();
    }

    // Import initial data if provided
    if (this._config.data) {
      this.import(this._config.data);
    }

    // Start rendering
    this._renderer.start();

    this._initialized = true;
    this._events.emit(CanvasEvents.INITIALIZED, { canvas: this });
  }

  private _setupStateListeners(): void {
    // Sync node states with shapes
    this._nodeStates.onChange((id, newStates) => {
      const shape = this._nodeShapes.get(id);
      if (shape) {
        shape.setStates(Array.from(newStates));
      }
      this._events.emit(CanvasEvents.NODE_STATE_CHANGED, {
        nodeId: id,
        states: Array.from(newStates),
      });
    });

    // Sync edge states with shapes
    this._edgeStates.onChange((id, newStates) => {
      const shape = this._edgeShapes.get(id);
      if (shape) {
        shape.setStates(Array.from(newStates));
      }
      this._events.emit(CanvasEvents.EDGE_STATE_CHANGED, {
        edgeId: id,
        states: Array.from(newStates),
      });
    });

    // Sync selection with states
    this._selection.onChange((nodes, edges, prevNodes, prevEdges) => {
      // Remove selected state from deselected items
      for (const id of prevNodes) {
        if (!nodes.includes(id)) {
          this._nodeStates.removeState(id, 'selected');
        }
      }
      for (const id of prevEdges) {
        if (!edges.includes(id)) {
          this._edgeStates.removeState(id, 'selected');
        }
      }

      // Add selected state to newly selected items
      for (const id of nodes) {
        this._nodeStates.addState(id, 'selected');
      }
      for (const id of edges) {
        this._edgeStates.addState(id, 'selected');
      }

      this._events.emit(CanvasEvents.SELECTION_CHANGED, {
        selectedNodes: nodes,
        selectedEdges: edges,
        previousSelectedNodes: prevNodes,
        previousSelectedEdges: prevEdges,
      });
    });
  }

  private _setupAutoResize(): void {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        this.resize(width, height);
      }
    });
    resizeObserver.observe(this._container);
  }

  // ============================================================================
  // Public API - Data
  // ============================================================================

  import(data: GraphData): void {
    this.clear();

    // Add nodes
    for (const nodeData of data.nodes) {
      this.addNode(nodeData);
    }

    // Add edges
    for (const edgeData of data.edges) {
      this.addEdge(edgeData);
    }

    this._events.emit(CanvasEvents.DATA_IMPORTED, { data });
  }

  export(): GraphData {
    return this._graph.export();
  }

  clear(): void {
    // Remove all shapes
    for (const shape of this._nodeShapes.values()) {
      this._renderer.viewport.removeChild(shape.container);
      shape.destroy();
    }
    for (const shape of this._edgeShapes.values()) {
      this._renderer.viewport.removeChild(shape.container);
      shape.destroy();
    }

    this._nodeShapes.clear();
    this._edgeShapes.clear();
    this._nodeStates.clear();
    this._edgeStates.clear();
    this._selection.clearSelection();
    this._graph.clear();

    this._events.emit(CanvasEvents.DATA_CLEARED, {});
  }

  // ============================================================================
  // Public API - Nodes
  // ============================================================================

  addNode(data: NodeData): void {
    // Add to graph
    this._graph.addNode(data);

    // Get themed style
    const themedStyle = this._theme.getNodeStyle(data.type);
    const mergedStyle = { ...themedStyle, ...data.style };

    // Create shape based on type
    const shape = this._createNodeShape(data, mergedStyle);

    // Apply theme state styles
    const stateStyles = ['hovered', 'selected', 'highlighted', 'muted', 'locked', 'disabled'] as const;
    for (const state of stateStyles) {
      const stateStyle = this._theme.getNodeStateStyle(state);
      if (stateStyle) {
        shape.setStateStyle(state, stateStyle);
      }
    }

    // Draw and add to viewport
    shape.draw();
    this._renderer.viewport.addChild(shape.container);
    this._nodeShapes.set(data.id, shape);

    this._events.emit(CanvasEvents.NODE_ADDED, { node: data });

    // Update connected edges
    this._updateConnectedEdges(data.id);
  }

  updateNode(id: string, updates: Partial<NodeData>): void {
    this._graph.updateNode(id, updates);

    const shape = this._nodeShapes.get(id);
    if (shape) {
      shape.updateData(updates);
      this._updateConnectedEdges(id);
    }

    this._events.emit(CanvasEvents.NODE_UPDATED, {
      node: this._graph.getNode(id),
    });
  }

  removeNode(id: string): void {
    const node = this._graph.getNode(id);
    if (!node) return;

    // Remove shape
    const shape = this._nodeShapes.get(id);
    if (shape) {
      this._renderer.viewport.removeChild(shape.container);
      shape.destroy();
      this._nodeShapes.delete(id);
    }

    // Remove states
    this._nodeStates.remove(id);
    this._selection.deselectNode(id);

    // Remove from graph (also removes connected edges)
    this._graph.removeNode(id);

    this._events.emit(CanvasEvents.NODE_REMOVED, { node });
  }

  getNode(id: string): NodeData | undefined {
    return this._graph.getNode(id);
  }

  getNodes(): NodeData[] {
    return this._graph.nodes;
  }

  getNodeShape(id: string): BaseNodeShape | undefined {
    return this._nodeShapes.get(id);
  }

  private _createNodeShape(data: NodeData, style: NodeData['style']): BaseNodeShape {
    const shape: NodeShapeType = style?.shape ?? 'circle';
    const config = { data, style };

    switch (shape) {
      case 'circle':
        return new CircleNode(config);

      case 'rectangle':
      case 'roundedRectangle':
        return new RectangleNode(config);

      case 'square':
        return new RectangleNode({
          ...config,
          style: { ...style, width: style?.size ?? 40, height: style?.size ?? 40 },
        });

      case 'triangle':
        return PolygonNode.triangle(config);

      case 'diamond':
        return PolygonNode.diamond(config);

      case 'pentagon':
        return PolygonNode.pentagon(config);

      case 'hexagon':
        return PolygonNode.hexagon(config);

      case 'octagon':
        return PolygonNode.octagon(config);

      default:
        return new CircleNode(config);
    }
  }

  // ============================================================================
  // Public API - Edges
  // ============================================================================

  addEdge(data: EdgeData): void {
    // Add to graph
    this._graph.addEdge(data);

    // Get themed style
    const themedStyle = this._theme.getEdgeStyle(data.type);
    const mergedStyle = { ...themedStyle, ...data.style };

    // Create shape based on type
    const shape = this._createEdgeShape(data, mergedStyle);

    // Apply theme state styles
    const stateStyles = ['hovered', 'selected', 'highlighted', 'muted', 'locked', 'disabled'] as const;
    for (const state of stateStyles) {
      const stateStyle = this._theme.getEdgeStateStyle(state);
      if (stateStyle) {
        shape.setStateStyle(state, stateStyle);
      }
    }

    // Set endpoints based on node positions
    this._updateEdgeEndpoints(shape, data);

    // Draw and add to viewport (edges should be behind nodes)
    shape.draw();
    this._renderer.viewport.addChildAt(shape.container, 0);
    this._edgeShapes.set(data.id, shape);

    this._events.emit(CanvasEvents.EDGE_ADDED, { edge: data });
  }

  updateEdge(id: string, updates: Partial<EdgeData>): void {
    this._graph.updateEdge(id, updates);

    const shape = this._edgeShapes.get(id);
    const edgeData = this._graph.getEdge(id);
    if (shape && edgeData) {
      shape.updateData(updates);
      this._updateEdgeEndpoints(shape, edgeData);
    }

    this._events.emit(CanvasEvents.EDGE_UPDATED, {
      edge: this._graph.getEdge(id),
    });
  }

  removeEdge(id: string): void {
    const edge = this._graph.getEdge(id);
    if (!edge) return;

    // Remove shape
    const shape = this._edgeShapes.get(id);
    if (shape) {
      this._renderer.viewport.removeChild(shape.container);
      shape.destroy();
      this._edgeShapes.delete(id);
    }

    // Remove states
    this._edgeStates.remove(id);
    this._selection.deselectEdge(id);

    // Remove from graph
    this._graph.removeEdge(id);

    this._events.emit(CanvasEvents.EDGE_REMOVED, { edge });
  }

  getEdge(id: string): EdgeData | undefined {
    return this._graph.getEdge(id);
  }

  getEdges(): EdgeData[] {
    return this._graph.edges;
  }

  getEdgeShape(id: string): BaseEdgeShape | undefined {
    return this._edgeShapes.get(id);
  }

  private _createEdgeShape(data: EdgeData, style: EdgeData['style']): BaseEdgeShape {
    const type: EdgeShapeType = style?.type ?? 'straight';
    const config = { data, style };

    switch (type) {
      case 'bezier':
      case 'quadratic':
        return new BezierEdge(config);

      case 'orthogonal':
        return new OrthogonalEdge(config);

      case 'straight':
      default:
        return new StraightEdge(config);
    }
  }

  private _updateEdgeEndpoints(shape: BaseEdgeShape, data: EdgeData): void {
    const sourceNode = this._nodeShapes.get(data.source);
    const targetNode = this._nodeShapes.get(data.target);

    if (sourceNode && targetNode) {
      shape.setEndpoints(sourceNode.position, targetNode.position);
    }
  }

  private _updateConnectedEdges(nodeId: string): void {
    const edges = this._graph.getConnectedEdges(nodeId);
    for (const edge of edges) {
      const shape = this._edgeShapes.get(edge.id);
      if (shape) {
        this._updateEdgeEndpoints(shape, edge);
      }
    }
  }

  // ============================================================================
  // Public API - Viewport
  // ============================================================================

  get viewport(): Viewport {
    return this._viewport;
  }

  panTo(x: number, y: number): void {
    this._viewport.panTo(x, y);
  }

  panBy(dx: number, dy: number): void {
    this._viewport.panBy(dx, dy);
  }

  zoomTo(zoom: number, center?: Point): void {
    this._viewport.zoomTo(zoom, center);
  }

  zoomIn(center?: Point): void {
    this._viewport.zoomIn(center);
  }

  zoomOut(center?: Point): void {
    this._viewport.zoomOut(center);
  }

  fitToContent(padding = 50): void {
    const bounds = this._calculateContentBounds();
    if (bounds) {
      this._viewport.zoomToFit(bounds, padding);
    }
  }

  resetView(): void {
    this._viewport.reset();
  }

  getViewportState(): ViewportState {
    return this._viewport.state;
  }

  setViewportState(state: Partial<ViewportState>): void {
    this._viewport.setState(state);
  }

  configureViewport(config: Partial<ViewportConfig>): void {
    this._viewport.configure(config);
  }

  private _calculateContentBounds(): Bounds | null {
    if (this._nodeShapes.size === 0) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const shape of this._nodeShapes.values()) {
      const bounds = shape.getBounds();
      minX = Math.min(minX, bounds.x);
      minY = Math.min(minY, bounds.y);
      maxX = Math.max(maxX, bounds.x + bounds.width);
      maxY = Math.max(maxY, bounds.y + bounds.height);
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  // ============================================================================
  // Public API - Selection
  // ============================================================================

  get selection(): SelectionManager {
    return this._selection;
  }

  selectNode(id: string, additive = false): void {
    this._selection.selectNode(id, additive);
  }

  selectNodes(ids: string[], additive = false): void {
    this._selection.selectNodes(ids, additive);
  }

  selectEdge(id: string, additive = false): void {
    this._selection.selectEdge(id, additive);
  }

  selectEdges(ids: string[], additive = false): void {
    this._selection.selectEdges(ids, additive);
  }

  selectAll(): void {
    const nodeIds = this._graph.nodes.map((n) => n.id);
    const edgeIds = this._graph.edges.map((e) => e.id);
    this._selection.selectAll(nodeIds, edgeIds);
  }

  clearSelection(): void {
    this._selection.clearSelection();
  }

  getSelectedNodes(): NodeData[] {
    return this._selection.selectedNodes
      .map((id) => this._graph.getNode(id))
      .filter((n): n is NodeData => n !== undefined);
  }

  getSelectedEdges(): EdgeData[] {
    return this._selection.selectedEdges
      .map((id) => this._graph.getEdge(id))
      .filter((e): e is EdgeData => e !== undefined);
  }

  // ============================================================================
  // Public API - States
  // ============================================================================

  setNodeState(id: string, state: string, value: boolean): void {
    if (value) {
      this._nodeStates.addState(id, state as import('../types/index.js').NodeState);
    } else {
      this._nodeStates.removeState(id, state as import('../types/index.js').NodeState);
    }
  }

  setEdgeState(id: string, state: string, value: boolean): void {
    if (value) {
      this._edgeStates.addState(id, state as import('../types/index.js').EdgeState);
    } else {
      this._edgeStates.removeState(id, state as import('../types/index.js').EdgeState);
    }
  }

  highlightNodes(ids: string[]): void {
    // Mute all nodes except highlighted ones
    for (const [id] of this._nodeShapes) {
      if (ids.includes(id)) {
        this._nodeStates.addState(id, 'highlighted');
        this._nodeStates.removeState(id, 'muted');
      } else {
        this._nodeStates.addState(id, 'muted');
        this._nodeStates.removeState(id, 'highlighted');
      }
    }
  }

  clearHighlights(): void {
    for (const [id] of this._nodeShapes) {
      this._nodeStates.removeState(id, 'highlighted');
      this._nodeStates.removeState(id, 'muted');
    }
    for (const [id] of this._edgeShapes) {
      this._edgeStates.removeState(id, 'highlighted');
      this._edgeStates.removeState(id, 'muted');
    }
  }

  // ============================================================================
  // Public API - Interactions
  // ============================================================================

  get interactions(): InteractionManager {
    return this._interactions;
  }

  configureInteractions(config: Partial<InteractionConfig>): void {
    this._interactions.configure(config);
  }

  disableInteractions(): void {
    this._interactions.disable();
  }

  enableInteractions(): void {
    this._interactions.enable();
  }

  // ============================================================================
  // Public API - Theme
  // ============================================================================

  get theme(): ThemeManager {
    return this._theme;
  }

  setTheme(theme: Theme | ThemeName): void {
    this._theme.setTheme(theme);
    this._renderer.setBackgroundColor(this._theme.colors.background);
    this._refreshStyles();
    this._events.emit(CanvasEvents.THEME_CHANGED, { theme: this._theme.current });
  }

  private _refreshStyles(): void {
    // Re-apply styles to all nodes
    for (const [id, shape] of this._nodeShapes) {
      const data = this._graph.getNode(id);
      if (data) {
        const themedStyle = this._theme.getNodeStyle(data.type);
        shape.setStyle({ ...themedStyle, ...data.style });
      }
    }

    // Re-apply styles to all edges
    for (const [id, shape] of this._edgeShapes) {
      const data = this._graph.getEdge(id);
      if (data) {
        const themedStyle = this._theme.getEdgeStyle(data.type);
        shape.setStyle({ ...themedStyle, ...data.style });
      }
    }
  }

  // ============================================================================
  // Public API - Plugins
  // ============================================================================

  get plugins(): PluginManager {
    return this._plugins;
  }

  use<T extends Record<string, unknown>>(plugin: Plugin<T>): void {
    this._plugins.install(plugin);
  }

  // ============================================================================
  // Public API - Events
  // ============================================================================

  on(event: string, handler: (data: unknown) => void): () => void {
    return this._events.on(event, handler);
  }

  once(event: string, handler: (data: unknown) => void): () => void {
    return this._events.once(event, handler);
  }

  off(event: string, handler: (data: unknown) => void): void {
    this._events.off(event, handler);
  }

  // ============================================================================
  // Public API - Rendering
  // ============================================================================

  resize(width: number, height: number): void {
    this._canvas.width = width;
    this._canvas.height = height;
    this._renderer.resize(width, height);
    this._viewport.setSize(width, height);
    this._plugins.onResize(width, height);
    this._events.emit(CanvasEvents.RESIZED, { width, height });
  }

  render(): void {
    this._renderer.render();
  }

  start(): void {
    this._renderer.start();
  }

  stop(): void {
    this._renderer.stop();
  }

  private _updateAnimations(deltaTime: number): void {
    for (const shape of this._nodeShapes.values()) {
      shape.updateAnimation(deltaTime);
    }
    for (const shape of this._edgeShapes.values()) {
      shape.updateAnimation(deltaTime);
    }
  }

  // ============================================================================
  // Public API - Serialization
  // ============================================================================

  serialize(): CanvasSnapshot {
    return {
      version: VERSION,
      timestamp: Date.now(),
      nodes: this._graph.nodes,
      edges: this._graph.edges,
      viewport: this._viewport.serialize(),
      selectedNodes: this._selection.selectedNodes,
      selectedEdges: this._selection.selectedEdges,
      plugins: this._plugins.serialize(),
    };
  }

  deserialize(snapshot: CanvasSnapshot): void {
    // Clear current state
    this.clear();

    // Import data
    this.import({ nodes: snapshot.nodes, edges: snapshot.edges });

    // Restore viewport
    this._viewport.deserialize(snapshot.viewport);

    // Restore selection
    this._selection.deserialize({
      nodes: snapshot.selectedNodes,
      edges: snapshot.selectedEdges,
    });

    // Restore plugin states
    this._plugins.deserialize(snapshot.plugins);
  }

  // ============================================================================
  // Public API - Utilities
  // ============================================================================

  get graph(): Graph {
    return this._graph;
  }

  get isInitialized(): boolean {
    return this._initialized;
  }

  get isWebGPU(): boolean {
    return this._renderer.isWebGPU;
  }

  getSize(): { width: number; height: number } {
    return this._renderer.size;
  }

  screenToWorld(point: Point): Point {
    return this._viewport.screenToWorld(point);
  }

  worldToScreen(point: Point): Point {
    return this._viewport.worldToScreen(point);
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  destroy(): void {
    if (this._destroyed) return;

    this._events.emit(CanvasEvents.DESTROYED, {});

    // Cleanup
    this._plugins.destroy();
    this._interactions?.destroy();
    this.clear();
    this._renderer.destroy();
    this._events.removeAllListeners();

    // Remove canvas from container
    this._container.removeChild(this._canvas);

    this._destroyed = true;
    this._initialized = false;
  }
}
