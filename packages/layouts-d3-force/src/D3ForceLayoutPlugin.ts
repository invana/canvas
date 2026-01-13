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
  private _simulation: Simulation<D3Node, D3Link> | null = null;
  private _options: Required<D3ForceLayoutOptions>;
  private _isRunning: boolean = false;
  private _animationFrameId: number | null = null;

  constructor(options: D3ForceLayoutOptions = {}) {
    console.log('[D3ForceLayout] Constructor - User options:', options);
    
    this._options = {
      charge: options.charge ?? -30,       // D3 default charge for natural clustering
      linkDistance: options.linkDistance ?? undefined as any,  // undefined = D3 uses adaptive distance
      collisionRadius: options.collisionRadius ?? 8, // Collision based on visual node radius
      centerStrength: options.centerStrength ?? 0.1,
      alphaDecay: options.alphaDecay ?? 0.0228,  // Standard D3 alpha decay
      velocityDecay: options.velocityDecay ?? 0.4, // Standard D3 velocity decay  
      animate: options.animate ?? true,
      iterations: options.iterations ?? 300,
    };
    
    console.log('[D3ForceLayout] Constructor - Final options:', this._options);
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

    // Get graph data plugin
    const graphPlugin = this._canvas.getPlugin('graph-data') as any;
    if (!graphPlugin) {
      throw new Error('GraphDataPlugin not found. D3ForceLayoutPlugin requires GraphDataPlugin.');
    }

    // Get nodes and edges from renderer
    const renderer = graphPlugin.renderer;
    if (!renderer) {
      throw new Error('GraphDataPlugin has no renderer');
    }

    const nodes = renderer.getNodes();
    const edges = renderer.getEdges();

    if (nodes.length === 0) {
      console.warn('[D3ForceLayout] No nodes to layout');
      return;
    }

    console.log(`[D3ForceLayout] Starting layout for ${nodes.length} nodes and ${edges.length} edges`);
    console.log('[D3ForceLayout] Options:', this._options);

    // Get canvas dimensions for centering
    const canvasWidth = (this._canvas as any).width || 800;
    const canvasHeight = (this._canvas as any).height || 600;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    
    console.log(`[D3ForceLayout] Canvas dimensions: ${canvasWidth}x${canvasHeight}, center: (${centerX}, ${centerY})`);

    // Prepare D3 nodes - let D3 initialize positions naturally
    // When x/y are undefined, D3 randomly initializes them with good spread
    const d3Nodes: D3Node[] = nodes.map((node: any) => ({
      id: node.id as string,
      // x and y intentionally undefined - D3 will initialize them
    }));

    // Prepare D3 links
    const d3Links: D3Link[] = edges.map((edge: any) => ({
      source: edge.source as string,
      target: edge.target as string,
    }));

    // Create simulation - following classic D3 force-directed layout pattern
    // See: https://blocks.roadtolarissa.com/mbostock/4062045 and https://observablehq.com/@d3/force-directed-graph/2
    const linkForce = forceLink<D3Node, D3Link>(d3Links).id((d) => d.id);
    
    // Only set distance if specified, otherwise D3 uses adaptive distance
    if (this._options.linkDistance !== undefined) {
      console.log(`[D3ForceLayout] Setting link distance: ${this._options.linkDistance}`);
      linkForce.distance(this._options.linkDistance);
    } else {
      console.log('[D3ForceLayout] Using D3 adaptive link distance');
    }
    
    console.log('[D3ForceLayout] Creating simulation with forces:');
    console.log(`  - charge: ${this._options.charge}`);
    console.log(`  - linkDistance: ${this._options.linkDistance ?? 'adaptive'}`);
    console.log(`  - collisionRadius: ${this._options.collisionRadius}`);
    console.log(`  - centerStrength: ${this._options.centerStrength}`);
    console.log(`  - alphaDecay: ${this._options.alphaDecay}`);
    console.log(`  - velocityDecay: ${this._options.velocityDecay}`);
    console.log(`  - animate: ${this._options.animate}`);
    
    this._simulation = forceSimulation<D3Node, D3Link>(d3Nodes)
      .force('charge', forceManyBody().strength(this._options.charge))
      .force('link', linkForce)
      .force('center', forceCenter(centerX, centerY))
      .force('collide', forceCollide<D3Node>(this._options.collisionRadius))
      .alphaDecay(this._options.alphaDecay)
      .velocityDecay(this._options.velocityDecay);

    this._isRunning = true;

    if (this._options.animate) {
      // Animate in real-time
      console.log('[D3ForceLayout] Starting animated simulation...');
      let tickCount = 0;
      return new Promise((resolve) => {
        this._simulation!.on('tick', () => {
          tickCount++;
          const alpha = this._simulation!.alpha();
          if (tickCount % 10 === 0 || alpha < 0.05) {
            console.log(`[D3ForceLayout] Tick ${tickCount}, alpha: ${alpha.toFixed(4)}`);
          }
          this.updateNodePositions(d3Nodes, renderer, tickCount, alpha);
        });

        this._simulation!.on('end', () => {
          console.log(`[D3ForceLayout] Simulation ended after ${tickCount} ticks`);
          this._isRunning = false;
          resolve();
        });
      });
    } else {
      // Run synchronously for N iterations
      console.log(`[D3ForceLayout] Running ${this._options.iterations} iterations synchronously...`);
      for (let i = 0; i < this._options.iterations; i++) {
        this._simulation.tick();
      }
      this.updateNodePositions(d3Nodes, renderer, this._options.iterations, this._simulation.alpha());
      this._simulation.stop();
      this._isRunning = false;
      console.log('[D3ForceLayout] Synchronous layout complete');
    }
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
   * Update node positions using GraphDataPlugin's method
   */
  private updateNodePositions(d3Nodes: D3Node[], renderer: any, tickCount?: number, alpha?: number): void {
    // Debug: Log available methods on first tick
    if (tickCount === 1) {
      console.log('[D3ForceLayout] Renderer methods:', Object.keys(renderer).filter(k => typeof renderer[k] === 'function'));
      const graphPlugin = this._canvas?.getPlugin('graph-data') as any;
      if (graphPlugin) {
        console.log('[D3ForceLayout] GraphPlugin methods:', Object.keys(graphPlugin).filter(k => typeof graphPlugin[k] === 'function'));
        console.log('[D3ForceLayout] GraphPlugin exists:', !!graphPlugin);
        console.log('[D3ForceLayout] updateNodePositions exists:', typeof graphPlugin.updateNodePositions);
      }
    }
    
    // Get the GraphDataPlugin
    const graphPlugin = this._canvas?.getPlugin('graph-data') as any;
    if (!graphPlugin) {
      console.error('[D3ForceLayout] GraphDataPlugin not found!');
      return;
    }
    
    // Prepare batch updates
    const updates = d3Nodes
      .filter(node => node.x !== undefined && node.y !== undefined)
      .map(node => ({
        id: node.id,
        x: node.x!,
        y: node.y!,
      }));
    
    if (tickCount === 1) {
      console.log('[D3ForceLayout] First tick - sample updates:', updates.slice(0, 3));
    }
    
    // Use GraphDataPlugin's batch update method
    if (graphPlugin.updateNodePositions && typeof graphPlugin.updateNodePositions === 'function') {
      graphPlugin.updateNodePositions(updates);
    } else {
      console.error('[D3ForceLayout] updateNodePositions method not found on GraphPlugin!');
      // Fallback: update one by one
      for (const update of updates) {
        if (graphPlugin.updateNodePosition && typeof graphPlugin.updateNodePosition === 'function') {
          graphPlugin.updateNodePosition(update.id, update.x, update.y);
        }
      }
    }
    
    // Log sample positions periodically
    if (tickCount && tickCount % 50 === 0 && d3Nodes.length > 0) {
      const sample = d3Nodes[0]!;
      console.log(`[D3ForceLayout] Tick ${tickCount}: Sample node '${sample.id}' at (${sample.x?.toFixed(1) ?? '?'}, ${sample.y?.toFixed(1) ?? '?'}), alpha: ${alpha?.toFixed(4)}`);
    }
  }

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
   * Cleanup
   */
  destroy(): void {
    this.stop();
    this._simulation = null;
    this._canvas = null;
  }
}
