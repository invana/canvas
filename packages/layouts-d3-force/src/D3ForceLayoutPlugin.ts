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
  forceCollide,
  type Simulation,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
  // forceCenter,
  forceX,
  // forceX,
  forceY,
  forceCenter,
  // forceY,
  // forceX,
  // forceCenter,
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
    console.log('[D3ForceLayout] Found GraphDataPlugin by ID:', !!this._graphPlugin);
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
      
      // If still not found, throw error
      if (!this._graphPlugin) {
        console.error('[D3ForceLayout] GraphDataPlugin not found in registered plugins');
        throw new Error('GraphDataPlugin not found. D3ForceLayoutPlugin requires GraphDataPlugin.');
      }
    }
    
    console.log('[D3ForceLayout] GraphDataPlugin instance found:', !!this._graphPlugin);
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
    // const renderer = this._graphPlugin.renderer;
    // if (!renderer) {
    //   throw new Error('GraphDataPlugin has no renderer');
    // }

    // Get nodes and edges directly from renderer
    console.log("====this._graphPlugin", this._graphPlugin)
    const nodesDataMap = this._graphPlugin.getNodeData();
    const nodesDataList = Array.from(nodesDataMap.values()) as D3Node[];
    const edgesData = this._graphPlugin.getEdgeData();
    const edgesDataList = Array.from(edgesData.values())


    // Get canvas dimensions for centering
    const canvasWidth = this._canvas.width;
    const canvasHeight = this._canvas.height;

    console.log('[D3ForceLayout] Canvas size:', { width: canvasWidth, height: canvasHeight });
    // Prepare D3 links - extract source/target from renderer edge structure
    const d3Links: D3Link[] = edgesDataList.map((edge: any) => ({
      source:  edge.source as string,
      target:  edge.target as string,
    }));

    console.log('[D3ForceLayout] Creating simulation with options:', this._options);

    // Setup drag event listeners on nodes after they're rendered
    this.setupDragListeners();

    // Create simulation using renderer nodes directly
    const simulation = forceSimulation<D3Node, D3Link>(nodesDataList)
      .force('link', forceLink<D3Node, D3Link>(d3Links).id(d => d.id))
      .force("x",forceX(d => d.x ?? 0))
      .force("y", forceY(d => d.y ?? 0))
      .force('charge', forceManyBody().strength(-350)) //.distanceMin(100))
      .force('collide', forceCollide<D3Node>()
        .radius(d => d.size)  // Use half size (radius) + padding
        // .iterations(3)  // More iterations = stronger collision
        // .strength(0.9)
      )  // How strongly to enforce separation
      .force('center', forceCenter(canvasWidth / 2, canvasHeight / 2)) 
      // .tick(this._options.iterations);

    let tickCount = 0;
    
    simulation.on('tick', () => {
      tickCount++;
      if (tickCount % 10 === 0) {
        console.log(`[D3ForceLayout] Tick ${tickCount}, alpha: ${simulation.alpha().toFixed(4)}`);
      }
      // Only update positions on each tick if animating
      if (this._options.animate) {
        this.updateNodePositions(simulation.nodes() as any[]);
      }
      // Let D3's natural alpha decay stop the simulation instead of hard iteration limit
      // This allows drag operations to restart the simulation properly
    });

    this._simulation = simulation;
    this._isRunning = true;

    this._simulation.on('end', () => {
      console.log(`[D3ForceLayout] Simulation ended after ${tickCount} ticks`);
      this._isRunning = false;
      this.updateNodePositions(simulation.nodes() as any[]);
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
  private updateNodePositions(nodes: any[]): void {
    if (!this._graphPlugin) {
      console.error('[D3ForceLayout] GraphDataPlugin not found!');
      return;
    }
    
    // Use batch update for better performance
    const updates = nodes
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
  private _handleDragStart(event: any): void {
    if (!this._simulation) return;
    
    // Keep simulation hot during drag (alphaTarget maintains minimum energy level)
    // This ensures collision forces can push nodes apart during the entire drag operation
    this._simulation.alphaTarget(0.3).restart();
    
    // Fix the dragged node's position so it stays under cursor
    const rendererNode = event.node || event.target;
    const nodeId = rendererNode?._data?.id || rendererNode?.data?.id || rendererNode?.id;
    
    if (nodeId) {
      const node = this._simulation.nodes().find(n => n.id === nodeId);
      if (node) {
        node.x = node.x;
        node.y = node.y;
      }
    }
  }

  /**
   * Handle node drag - update fixed position
   */
  private _handleDrag(event: any): void {
    if (!this._simulation) return;
    
    const rendererNode = event.node || event.target;
    const nodeId = rendererNode?._data?.id || rendererNode?.data?.id || rendererNode?.id;
    const x = event.x ?? rendererNode?.x;
    const y = event.y ?? rendererNode?.y;
    
    if (!nodeId || x === undefined || y === undefined) return;
    
    const node = this._simulation.nodes().find(n => n.id === nodeId);
    if (node) {
      // Update FIXED position - this keeps node under cursor while
      // collision forces push other nodes out of the way
      node.fx = x;
      node.fy = y;
      node.x = x;  // Also update actual position for immediate feedback
      node.y = y;
      
      // Immediately update visual position - don't wait for next tick
      if (this._graphPlugin) {
        this._graphPlugin.updateNodePositions([{ id: nodeId, x, y }]);
      }
    }
  }

  /**
   * Handle drag end - unfix node and cool simulation
   */
  private _handleDragEnd(event: any): void {
    if (!this._simulation) return;
    
    // Unfix the dragged node so it can move freely again
    const rendererNode = event.node || event.target;
    const nodeId = rendererNode?._data?.id || rendererNode?.data?.id || rendererNode?.id;
    
    if (nodeId) {
      const node = this._simulation.nodes().find(n => n.id === nodeId);
      if (node) {
        node.fx = null;
        node.fy = null;
      }
    }
    
    // Cool simulation back down
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
  }
}
