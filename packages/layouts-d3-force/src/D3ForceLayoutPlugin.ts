/**
 * D3ForceLayoutPlugin
 * 
 * Force-directed graph layout using D3's simulation.
 * Computes node positions based on forces (charge, collision, links).
 * 
 * @example
 * ```typescript
 * import { Canvas, GraphDataPlugin } from '@invana/canvas-core';
 * import { D3ForceLayoutPlugin } from '@invana/layouts-d3-force';
 * 
 * const canvas = new Canvas({ container });
 * await canvas.init();
 * 
 * const graphPlugin = new GraphDataPlugin();
 * await canvas.registerPlugin(graphPlugin);
 * 
 * const layoutPlugin = new D3ForceLayoutPlugin({
 *   charge: -300,
 *   linkDistance: 100,
 *   collisionRadius: 30
 * });
 * await canvas.registerPlugin(layoutPlugin);
 * 
 * // Set initial data
 * graphPlugin.setData({ nodes, edges });
 * 
 * // Run layout
 * await layoutPlugin.start();
 * ```
 */

import {
  forceSimulation,
  forceManyBody,
  forceLink,
  forceCenter,
  forceCollide,
  type Simulation,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force';
import type { Canvas, CanvasPlugin } from '@invana/canvas-core';

// ============================================================================
// TYPES
// ============================================================================

/**
 * D3 Force Layout configuration
 */
export interface D3ForceLayoutOptions {
  /** Charge force strength (negative = repulsion) */
  charge?: number;
  /** Link distance */
  linkDistance?: number;
  /** Collision radius for nodes */
  collisionRadius?: number;
  /** Center force strength */
  centerStrength?: number;
  /** Alpha decay rate (how quickly simulation cools) */
  alphaDecay?: number;
  /** Velocity decay (friction) */
  velocityDecay?: number;
  /** Enable real-time animation */
  animate?: boolean;
  /** Max iterations if not animating */
  iterations?: number;
}

/**
 * Node with D3 simulation properties
 */
interface D3Node extends SimulationNodeDatum {
  id: string;
  size: number;  // Node size for collision and charge calculations
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

/**
 * Link for D3 simulation
 */
interface D3Link extends SimulationLinkDatum<D3Node> {
  source: string | D3Node;
  target: string | D3Node;
}

// ============================================================================
// PLUGIN
// ============================================================================

export class D3ForceLayoutPlugin implements CanvasPlugin {
  readonly id = 'layout-d3-force';

  private _canvas: Canvas | null = null;
  private _graphPlugin: any = null;  // Reference to GraphDataPlugin
  private _simulation: Simulation<D3Node, D3Link> | null = null;
  private _options: Required<D3ForceLayoutOptions>;
  private _isRunning: boolean = false;
  private _animationFrameId: number | null = null;
  private _d3Nodes: D3Node[] = [];  // Store D3 nodes for drag handling

  constructor(options: D3ForceLayoutOptions = {}) {
    this._options = {
      charge: options.charge ?? undefined as any,  // Use D3 default
      linkDistance: options.linkDistance ?? undefined as any,  // Use D3 default
      collisionRadius: options.collisionRadius ?? undefined as any, // No collision by default
      centerStrength: options.centerStrength ?? undefined as any, // Use D3 default
      alphaDecay: options.alphaDecay ?? undefined as any,  // Use D3 default
      velocityDecay: options.velocityDecay ?? undefined as any, // Use D3 default
      animate: options.animate ?? true,
      iterations: options.iterations ?? 300,
    };
  }

  /**
   * Plugin doesn't need layers (it only computes positions)
   */
  getLayers() {
    return [];
  }

  /**
   * Initialize plugin
   */
  async init(canvas: Canvas): Promise<void> {
    this._canvas = canvas;
    
    // Find GraphDataPlugin - check by ID first, then try all plugins
    this._graphPlugin = canvas.getPlugin('graph-data');
    if (!this._graphPlugin) {
      // Search through all registered plugins
      const plugins = (canvas as any)._plugins;
      if (plugins) {
        for (const plugin of plugins.values()) {
          if (plugin.id === 'graph-data') {
            this._graphPlugin = plugin;
            break;
          }
        }
      }
    }
  }

  /**
   * Start layout simulation
   * 
   * @returns Promise that resolves when layout is complete
   */
  async start(): Promise<void> {
    if (!this._canvas) {
      throw new Error('D3ForceLayoutPlugin not initialized');
    }

    if (!this._graphPlugin) {
      throw new Error('GraphDataPlugin not found. D3ForceLayoutPlugin requires GraphDataPlugin.');
    }

    // Get nodes and edges from renderer
    const renderer = this._graphPlugin.renderer;
    if (!renderer) {
      throw new Error('GraphDataPlugin has no renderer');
    }

  // The force simulation mutates links and nodes, so create a copy
  // so that re-evaluating this cell produces the same result.
    const nodes = renderer.getNodes().map((d: any) => ({...d}));
    const edges = renderer.getEdges().map((d: any) => ({...d}));

    if (nodes.length === 0) {
      console.warn('[D3ForceLayout] No nodes to layout');
      return;
    }

    console.log('[D3ForceLayout] Sample renderer node (keys):', Object.keys(nodes[0]));
    console.log('[D3ForceLayout] Node has _data?:', '_data' in nodes[0]);
    console.log('[D3ForceLayout] Node has id?:', 'id' in nodes[0]);
    if (nodes[0]._data) {
      console.log('[D3ForceLayout] Node._data keys:', Object.keys(nodes[0]._data));
      console.log('[D3ForceLayout] Node._data.id:', nodes[0]._data.id);
    }

    // Get canvas dimensions for centering
    const canvasWidth = this._canvas.width;
    const canvasHeight = this._canvas.height;

    console.log('[D3ForceLayout] Canvas size:', { width: canvasWidth, height: canvasHeight });

    // Prepare D3 nodes - extract ID from renderer node structure
    const d3Nodes: D3Node[] = nodes.map((node: any, idx: number) => {
      // Renderer nodes have their data in _data property
      const nodeId = node._data?.id || node.id;
      const nodeSize = node._data?.size ?? 25;
      
      if (idx === 0) {
        console.log('[D3ForceLayout] First node mapping:', { 
          nodeId, 
          nodeSize,
          hasData: !!node._data,
          dataId: node._data?.id,
          directId: node.id
        });
      }
      
      return {
        id: nodeId as string,
        size: nodeSize,
          x: node._data?.x,
        y: node._data?.y,
        // Don't pass x,y - let D3 initialize them for better layout
      };
    });

    // Prepare D3 links - extract source/target from renderer edge structure
    const d3Links: D3Link[] = edges.map((edge: any) => ({
      source: (edge._data?.source || edge.source) as string,
      target: (edge._data?.target || edge.target) as string,
    }));

    console.log('[D3ForceLayout] Creating simulation with options:', {
      animate: this._options.animate,
      charge: this._options.charge,
      linkDistance: this._options.linkDistance,
      iterations: this._options.iterations
    });

    // Store d3Nodes for drag handling
    this._d3Nodes = d3Nodes;
    
    // Setup drag event listeners on nodes after they're rendered
    this.setupDragListeners();

    // Create simulation - EXACTLY like Observable example
    const simulation = forceSimulation<D3Node, D3Link>(d3Nodes)
      .force('link', forceLink<D3Node, D3Link>(d3Links).id(d => d.id))
      .force('charge', forceManyBody())
      .force('center', forceCenter(canvasWidth / 2, canvasHeight / 2))
      // .alphaDecay(0);  // Slower decay = forces stay strong longer

    let tickCount = 0;
    const maxIterations = this._options.iterations;
    
    simulation.on('tick', () => {
      tickCount++;
      if (tickCount % 10 === 0) {
        console.log(`[D3ForceLayout] Tick ${tickCount}/${maxIterations}, alpha: ${simulation.alpha().toFixed(4)}`);
      }
      // Only update positions on each tick if animating
      if (this._options.animate) {
        this.updateNodePositions(d3Nodes);
      }      
      // Stop after max iterations if specified
      if (tickCount >= maxIterations) {
        console.log(`[D3ForceLayout] Reached max iterations (${maxIterations}), stopping simulation`);
        simulation.stop();
      }
    });

    this._simulation = simulation;
    this._isRunning = true;

    this._simulation.on('end', () => {
      console.log(`[D3ForceLayout] Simulation ended after ${tickCount} ticks`);
      this._isRunning = false;
      this.updateNodePositions(d3Nodes);
    });
    
    console.log('[D3ForceLayout] Simulation started');
    return;
  }

  /**
   * Stop the running simulation
   */
  stop(): void {
    if (this._simulation) {
      this._simulation.stop();
      this._isRunning = false;
    }
    if (this._animationFrameId !== null) {
      cancelAnimationFrame(this._animationFrameId);
      this._animationFrameId = null;
    }
  }

  /**
   * Update node positions using GraphDataPlugin's batch method
   */
  private updateNodePositions(d3Nodes: D3Node[]): void {
    if (!this._graphPlugin) {
      console.error('[D3ForceLayout] GraphDataPlugin not found!');
      return;
    }
    
    // Use batch update for better performance
    const updates = d3Nodes
      .filter(node => node.x !== undefined && node.y !== undefined)
      .map(node => ({ id: node.id, x: node.x!, y: node.y! }));
    
    // Debug: Log first update to verify it's being called
    if (updates.length > 0 && !this._hasLoggedFirstUpdate) {
      console.log('[D3ForceLayout] First position update:', {
        totalNodes: updates.length,
        sample: updates.slice(0, 2)
      });
      this._hasLoggedFirstUpdate = true;
    }
    
    this._graphPlugin.updateNodePositions(updates);
  }
  
  private _hasLoggedFirstUpdate = false;

  /**
   * Update layout options
   */
  setOptions(options: Partial<D3ForceLayoutOptions>): void {
    Object.assign(this._options, options);

    // Update simulation forces if running
    if (this._simulation) {
      if (options.charge !== undefined) {
        this._simulation.force('charge', forceManyBody().strength(options.charge));
      }
      if (options.linkDistance !== undefined) {
        const linkForce = this._simulation.force('link') as any;
        if (linkForce) {
          linkForce.distance(options.linkDistance);
        }
      }
      if (options.collisionRadius !== undefined) {
        this._simulation.force('collide', forceCollide<D3Node>(options.collisionRadius));
      }
      if (options.centerStrength !== undefined) {
        const centerForce = this._simulation.force('center') as any;
        if (centerForce) {
          centerForce.strength(options.centerStrength);
        }
      }
      if (options.alphaDecay !== undefined) {
        this._simulation.alphaDecay(options.alphaDecay);
      }
      if (options.velocityDecay !== undefined) {
        this._simulation.velocityDecay(options.velocityDecay);
      }

      // Reheat simulation to apply changes
      this._simulation.alpha(0.3).restart();
    }
  }

  /**
   * Get current options
   */
  getOptions(): Required<D3ForceLayoutOptions> {
    return { ...this._options };
  }

  /**
   * Check if simulation is running
   */
  isRunning(): boolean {
    return this._isRunning;
  }

  /**
   * Setup drag event listeners on renderer nodes
   */
  private setupDragListeners(): void {
    if (!this._graphPlugin?.renderer) return;
    
    const nodes = this._graphPlugin.renderer.getNodes();
    nodes.forEach((node: any) => {
      node.on('dragstart', this._handleDragStart.bind(this));
      node.on('drag', this._handleDrag.bind(this));
      node.on('dragend', this._handleDragEnd.bind(this));
    });
  }

  /**
   * Handle node drag start - keep simulation hot during drag
   */
  private _handleDragStart(): void {
    if (!this._simulation || !this._isRunning) return;
    
    // Reheat simulation during drag, but don't fix position
    // This allows forces to still influence the node
    // this._simulation.alphaTarget(0.3).restart();
  }

  /**
   * Handle node drag - update position but let forces apply
   */
  private _handleDrag(event: any): void {
    const node = event.node || event.target;
    const nodeId = node?._data?.id || node?.data?.id || node?.id;
    const x = event.x ?? node?.x;
    const y = event.y ?? node?.y;
    
    if (!nodeId || x === undefined || y === undefined) return;
    
    const d3Node = this._d3Nodes.find(n => n.id === nodeId);
    if (d3Node) {
      // Update position directly without fixing (no fx/fy)
      // Node can still be influenced by forces
      d3Node.x = x;
      d3Node.y = y;
      // Dampen velocity so it doesn't fly away when released
      if (d3Node.vx) d3Node.vx *= 0.5;
      if (d3Node.vy) d3Node.vy *= 0.5;
    }
  }

  /**
   * Handle drag end - let simulation cool back down
   */
  private _handleDragEnd(): void {
    if (!this._simulation || !this._isRunning) return;
    
    // Cool simulation back down after drag
    this._simulation.alphaTarget(0);
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stop();
    
    // Remove event listeners from nodes
    if (this._graphPlugin?.renderer) {
      const nodes = this._graphPlugin.renderer.getNodes();
      nodes.forEach((node: any) => {
        node.off('dragstart', this._handleDragStart.bind(this));
        node.off('dragstart', this._handleDragStart.bind(this));
        node.off('drag', this._handleDrag.bind(this));
        node.off('dragend', this._handleDragEnd.bind(this));
      });
    }
    
    this._simulation = null;
    this._canvas = null;
    this._d3Nodes = [];
  }
}
