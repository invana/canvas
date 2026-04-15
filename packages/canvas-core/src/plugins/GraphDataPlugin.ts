/**
 * GraphDataPlugin
 * 
 * Plugin for rendering graph data (nodes and edges) on the canvas.
 * This plugin owns all graph visualization logic - data storage, styling, and rendering.
 * 
 * @example
 * ```typescript
 * const canvas = new Canvas({ container });
 * await canvas.init();
 * 
 * const graphPlugin = new GraphDataPlugin();
 * canvas.registerPlugin(graphPlugin, { key: 'graph' });
 * 
 * graphPlugin.setData({
 *   nodes: [
 *     { id: 'n1', x: 100, y: 100, shape: 'circle' },
 *     { id: 'n2', x: 300, y: 200, shape: 'rect' },
 *   ],
 *   edges: [
 *     { id: 'e1', source: 'n1', target: 'n2', pathType: 'bezier' },
 *   ],
 * });
 * 
 * graphPlugin.setStyles({
 *   node: { fill: '#1890ff' },
 *   edge: { stroke: '#ccc' },
 * });
 * ```
 */

import type { Canvas } from '../core/Canvas';
import type { CanvasPlugin } from './types';
import { Renderer, type CanvasNode, type CanvasEdge } from '../rendering/Renderer';
import type { LayerGroupConfig } from './types';
import type { RendererNodeBase } from '../elements/nodes/RendererNodeBase';
import type { RendererEdgeBase } from '../elements/edges/RendererEdgeBase';

/** Edge direction filter for neighbor traversal */
export type TraversalDirection = 'both' | 'in' | 'out';
import { type FunctionBasedNodeStyle, type FunctionBasedEdgeStyle, resolveNodeStyle, resolveEdgeStyle } from '../style/FunctionBasedStyle';
import { type NodeStyle } from '../elements/nodes';
import { type EdgeStyle } from '../elements/edges';
import { DEFAULT_NODE_STYLE } from '../defaults/nodes';
import { DEFAULT_EDGE_STYLE } from '../defaults/edges';

/**
 * Graph data structure
 */
export interface GraphData {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

/**
 * Graph styles (supports function-based properties)
 */
export interface GraphStyles {
  node?: Partial<FunctionBasedNodeStyle>;
  edge?: Partial<FunctionBasedEdgeStyle>;
}

/**
 * Options for GraphDataPlugin
 */
export interface GraphDataPluginOptions {
  /** Initial graph data */
  data?: GraphData;
  /** Default styles */
  styles?: GraphStyles;
  /** Fit content after rendering */
  fitOnRender?: boolean;
  /** Padding for fit content */
  fitPadding?: number;
  /** Edge boundary offset */
  edgeBoundaryOffset?: number;
}

/**
 * Plugin for graph visualization
 */
export class GraphDataPlugin implements CanvasPlugin {
  readonly id = 'graph-data';
  
  private _canvas: Canvas | null = null;
  private _renderer: Renderer | null = null;
  private _options: GraphDataPluginOptions;
  
  // Data storage - single source of truth for graph data
  private _nodeData: Map<string, CanvasNode> = new Map();
  private _edgeData: Map<string, CanvasEdge> = new Map();
  
  // Styles
  private _nodeStyle: Partial<FunctionBasedNodeStyle> = {};
  private _edgeStyle: Partial<FunctionBasedEdgeStyle> = {};

  constructor(options: GraphDataPluginOptions = {}) {
    this._options = options;
    
    // Set initial styles
    if (options.styles?.node) {
      this._nodeStyle = options.styles.node;
    }
    if (options.styles?.edge) {
      this._edgeStyle = options.styles.edge;
    }
  }

  /**
   * Define layer groups this plugin needs
   */
  getLayers(): LayerGroupConfig[] {
    return [
      {
        id: 'graph-edges',
        zIndex: 20,
        layers: [{ id: 'shapes', type: 'shapes' }]
      },
      {
        id: 'graph-nodes',
        zIndex: 30,
        layers: [
          { id: 'shapes', type: 'shapes' },
          { id: 'labels', type: 'labels' },
          { id: 'badges', type: 'badges' },
        ]
      },
    ];
  }

  /**
   * Initialize plugin with canvas context
   */
  async init(canvas: Canvas): Promise<void> {
    this._canvas = canvas;
    
    // Get layer containers
    const edgeLayer = canvas.layerManager.getGroup('graph-edges')?.getLayer('shapes')?.container;
    const nodeLayer = canvas.layerManager.getGroup('graph-nodes')?.getLayer('shapes')?.container;
    
    if (!edgeLayer || !nodeLayer) {
      throw new Error('GraphDataPlugin: Required layers not found');
    }
    
    // Create renderer
    this._renderer = new Renderer({
      canvas: this,
      edgeLayer,
      nodeLayer,
      registry: canvas.registry,
      edgeBoundaryOffset: this._options.edgeBoundaryOffset,
    });
    
    // Render initial data if provided
    if (this._options.data) {
      this.setData(this._options.data);
    }
  }

  /**
   * Set graph data and render
   */
  setData(data: GraphData): void {
    if (!this._renderer) {
      throw new Error('GraphDataPlugin not initialized');
    }
    
    // Clear existing
    this._renderer.clear();
    this._nodeData.clear();
    this._edgeData.clear();
    
    // Store data
    data.nodes.forEach(node => {
      this._nodeData.set(node.id as string, node);
    });
    data.edges.forEach(edge => {
      this._edgeData.set(edge.id as string, edge);
    });
    
    // Render
    this._renderer.addNodes(data.nodes);
    this._renderer.addEdges(data.edges);
    
    // Fit content if enabled
    if (this._options.fitOnRender && this._canvas) {
      const padding = this._options.fitPadding ?? 50;
      this._canvas.viewport?.fitContent(padding);
    }
  }

  /**
   * Update graph styles
   */
  setStyles(styles: GraphStyles): void {
    if (!this._renderer) {
      throw new Error('GraphDataPlugin not initialized');
    }
    
    // Update stored styles
    if (styles.node) {
      this._nodeStyle = { ...this._nodeStyle, ...styles.node };
    }
    if (styles.edge) {
      this._edgeStyle = { ...this._edgeStyle, ...styles.edge };
    }
    
    // Re-apply styles to all elements
    this._renderer.reapplyStylesToAll();
  }

  /**
   * Resolve node style (called by Renderer)
   * Merges default + global + individual styles
   */
  resolveNodeStyle(nodeId: string): Partial<NodeStyle> {
    const nodeData = this._nodeData.get(nodeId);
    if (!nodeData) {
      throw new Error(`Node ${nodeId} not found`);
    }

    return resolveNodeStyle(
      nodeData as any,
      DEFAULT_NODE_STYLE,
      this._nodeStyle,
      nodeData.style as any
    );
  }

  /**
   * Resolve edge style (called by Renderer)
   * Merges default + global + individual styles
   */
  resolveEdgeStyle(edgeId: string): Partial<EdgeStyle> {
    const edgeData = this._edgeData.get(edgeId);
    if (!edgeData) {
      throw new Error(`Edge ${edgeId} not found`);
    }

    return resolveEdgeStyle(
      edgeData as any,
      DEFAULT_EDGE_STYLE,
      this._edgeStyle,
      edgeData.style as any
    );
  }

  /**
   * Get the renderer (for advanced usage)
   */
  get renderer(): Renderer | null {
    return this._renderer;
  }

  /**
   * Delegate events bus to the real Canvas — required by Renderer to wire node/edge interaction events
   */
  get events() {
    return this._canvas?.events;
  }

  /**
   * Delegate viewport to the real Canvas — required by Renderer to resolve pointer positions
   */
  get viewport() {
    return this._canvas?.viewport;
  }

  /**
   * Get node data
   */
  getNodeData(): Map<string, CanvasNode> {
    return this._nodeData;
  }

  /**
   * Get edge data
   */
  getEdgeData(): Map<string, CanvasEdge> {
    return this._edgeData;
  }

  /**
   * Update node position
   * @param nodeId - Node ID to update
   * @param x - New x coordinate
   * @param y - New y coordinate
   */
  updateNodePosition(nodeId: string, x: number, y: number): void {
    if (!this._renderer) {
      throw new Error('GraphDataPlugin not initialized');
    }

    // Update the underlying data (source of truth)
    // const node = this._nodeData.get(nodeId);
    // if (node) {
    //   node.x = x;
    //   node.y = y;
    // }

    // Update renderer - this handles position update and connected edge redrawing
    this._renderer.updateNode(nodeId, { x, y });
  }

  /**
   * Update multiple node positions in batch
   * @param updates - Array of {id, x, y} updates
   */
  updateNodePositions(updates: Array<{ id: string; x: number; y: number }>): void {
    if (!this._renderer) {
      throw new Error('GraphDataPlugin not initialized');
    }

    // Update all node positions
    for (const { id, x, y } of updates) {
      // Update the underlying data (source of truth)
      const node = this._nodeData.get(id);
      if (node) {
        node.x = x;
        node.y = y;
      }

      // Update renderer - this automatically handles position and connected edges
      const rendererNode = this._renderer.updateNode(id, { x, y });
      if (!rendererNode) {
        console.warn(`[GraphDataPlugin] Failed to update node ${id}`);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Rendered element accessors

  /** Get a rendered node by ID. */
  getRenderedNode(id: string): RendererNodeBase | undefined {
    return this._renderer?.getNode(id);
  }

  /** Get all rendered nodes. */
  getRenderedNodes(): RendererNodeBase[] {
    return this._renderer?.getNodes() ?? [];
  }

  /** Get a rendered edge by ID. */
  getRenderedEdge(id: string): RendererEdgeBase | undefined {
    return this._renderer?.getEdge(id);
  }

  /** Get all rendered edges. */
  getRenderedEdges(): RendererEdgeBase[] {
    return this._renderer?.getEdges() ?? [];
  }

  /** Get all rendered edges connected to a node. */
  getNodeEdges(nodeId: string): RendererEdgeBase[] {
    return this._renderer?.getNodeEdges(nodeId) ?? [];
  }

  // ---------------------------------------------------------------------------
  // Graph traversal

  /**
   * BFS traversal returning all nodes and edges within `degree` hops of
   * `source`. The source element itself is excluded from the result.
   *
   * @param source  - Starting node or edge (renderer instance).
   * @param degree  - Number of hops to expand (0 returns an empty result).
   * @param direction - Edge direction filter ('both' | 'in' | 'out').
   */
  getNeighborElements(
    source: RendererNodeBase | RendererEdgeBase,
    degree: number,
    direction: TraversalDirection = 'both',
  ): { nodes: RendererNodeBase[]; edges: RendererEdgeBase[] } {
    if (!this._renderer || degree === 0) {
      return { nodes: [], edges: [] };
    }

    const resultNodes = new Set<RendererNodeBase>();
    const resultEdges = new Set<RendererEdgeBase>();
    const visitedNodes = new Set<string>();
    const visitedEdges = new Set<string>();

    // Seed the BFS frontier from the source element
    let frontier: RendererNodeBase[] = [];
    const addNodeToFrontier = (n: RendererNodeBase) => {
      if (!visitedNodes.has(n.id)) {
        visitedNodes.add(n.id);
        frontier.push(n);
      }
    };

    const isNode = (el: RendererNodeBase | RendererEdgeBase): el is RendererNodeBase =>
      (el as RendererNodeBase).getBoundaryPoint !== undefined;

    if (isNode(source)) {
      addNodeToFrontier(source as RendererNodeBase);
    } else {
      // Edge source: seed from both endpoint nodes using raw edge data
      const edgeData = this._edgeData.get((source as RendererEdgeBase).id);
      visitedEdges.add((source as RendererEdgeBase).id);
      if (edgeData) {
        const srcId = typeof edgeData.source === 'string' ? edgeData.source : undefined;
        const tgtId = typeof edgeData.target === 'string' ? edgeData.target : undefined;
        for (const nodeId of [srcId, tgtId]) {
          if (nodeId) {
            const node = this._renderer.getNode(nodeId);
            if (node) addNodeToFrontier(node);
          }
        }
      }
    }

    for (let hop = 0; hop < degree; hop++) {
      const nextFrontier: RendererNodeBase[] = [];

      for (const node of frontier) {
        for (const edge of this._renderer.getNodeEdges(node.id)) {
          const edgeData = this._edgeData.get(edge.id);
          if (!edgeData) continue;

          const srcId = typeof edgeData.source === 'string' ? edgeData.source : undefined;
          const tgtId = typeof edgeData.target === 'string' ? edgeData.target : undefined;
          const isSource = srcId === node.id;

          if (direction === 'out' && !isSource) continue;
          if (direction === 'in'  &&  isSource) continue;

          if (!visitedEdges.has(edge.id)) {
            visitedEdges.add(edge.id);
            resultEdges.add(edge);
          }

          const neighborId = isSource ? tgtId : srcId;
          if (neighborId && !visitedNodes.has(neighborId)) {
            const neighborNode = this._renderer.getNode(neighborId);
            if (neighborNode) {
              visitedNodes.add(neighborId);
              resultNodes.add(neighborNode);
              nextFrontier.push(neighborNode);
            }
          }
        }
      }

      frontier = nextFrontier;
      if (frontier.length === 0) break;
    }

    return { nodes: Array.from(resultNodes), edges: Array.from(resultEdges) };
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this._renderer?.destroy();
    this._renderer = null;
    this._nodeData.clear();
    this._edgeData.clear();
    this._canvas = null;
  }
}
