/**
 * D3ForceLayoutPlugin
 *
 * Force-directed graph layout using D3's simulation.
 * Requires {@link GraphDataPlugin} to be registered first.
 *
 * @example
 * ```typescript
 * import { Canvas } from '@invana/canvas';
 * import { GraphDataPlugin } from '@invana/plugins-graph-data';
 * import { D3ForceLayoutPlugin } from '@invana/plugin-layouts-d3-force';
 *
 * const canvas = new Canvas({ container });
 * await canvas.init();
 *
 * const graphPlugin = new GraphDataPlugin();
 * await canvas.plugins.register(graphPlugin);
 *
 * const layoutPlugin = new D3ForceLayoutPlugin({ charge: -300 });
 * await canvas.plugins.register(layoutPlugin);
 *
 * graphPlugin.setData({ nodes, edges });
 * await layoutPlugin.start();
 * ```
 */

import {
  forceSimulation,
  forceManyBody,
  forceLink,
  forceCollide,
  forceX,
  forceY,
  forceCenter,
  type Simulation,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force';
import type { CanvasPlugin, PluginContext } from '@invana/canvas';
import type { GraphDataPlugin } from '@invana/plugins-graph-data';

// ============================================================================
// TYPES
// ============================================================================

export interface D3ForceLayoutOptions {
  /** Charge force strength (negative = repulsion). */
  charge?: number;
  /** Link distance. */
  linkDistance?: number;
  /** Collision radius for nodes. */
  collisionRadius?: number;
  /** Enable real-time animation (default: true). */
  animate?: boolean;
  /** Max iterations if not animating. */
  iterations?: number;
}

interface D3Node extends SimulationNodeDatum {
  id: string;
  size: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

interface D3Link extends SimulationLinkDatum<D3Node> {
  source: string | D3Node;
  target: string | D3Node;
}

// ============================================================================
// PLUGIN
// ============================================================================

export class D3ForceLayoutPlugin implements CanvasPlugin {
  readonly id = 'layout-d3-force';

  private _ctx: PluginContext | null = null;
  private _graphPlugin: GraphDataPlugin | null = null;
  private _simulation: Simulation<D3Node, D3Link> | null = null;
  private _options: D3ForceLayoutOptions;
  private _isRunning = false;

  constructor(options: D3ForceLayoutOptions = {}) {
    this._options = {
      charge:          options.charge          ?? -350,
      linkDistance:    options.linkDistance,
      collisionRadius: options.collisionRadius,
      animate:         options.animate         ?? true,
      iterations:      options.iterations      ?? 300,
    };
  }

  register(ctx: PluginContext): void {
    this._ctx = ctx;
    this._graphPlugin = ctx.getPlugin<GraphDataPlugin>('graph-data') ?? null;

    if (!this._graphPlugin) {
      console.warn('[D3ForceLayout] GraphDataPlugin ("graph-data") not found. Call canvas.plugins.register(graphPlugin) before this plugin.');
    }

    // Listen to drag events so simulation reheats during drags
    ctx.events.on('graph:dragmove', (e) => {
      if (!this._simulation) return;
      const node = this._simulation.nodes().find(n => n.id === e.elementId);
      if (node) {
        node.fx = e.worldX;
        node.fy = e.worldY;
        node.x  = e.worldX;
        node.y  = e.worldY;
        this._simulation.alphaTarget(0.3).restart();
      }
    });

    ctx.events.on('graph:dragend', (e) => {
      if (!this._simulation) return;
      const node = this._simulation.nodes().find(n => n.id === e.elementId);
      if (node) {
        node.fx = null;
        node.fy = null;
      }
      this._simulation.alphaTarget(0);
    });
  }

  destroy(): void {
    this.stop();
    this._simulation = null;
    this._ctx = null;
    this._graphPlugin = null;
  }

  // ── Public API ────────────────────────────────────────────────────────────

  async start(): Promise<void> {
    const gp = this._graphPlugin;
    if (!gp) throw new Error('[D3ForceLayout] GraphDataPlugin not found.');

    const nodesDataList = Array.from(gp.getNodeStore().values()) as D3Node[];
    const edgesDataList = Array.from(gp.getEdgeStore().values());

    const d3Links: D3Link[] = edgesDataList.map((edge) => ({
      source: (edge as { source: string }).source,
      target: (edge as { target: string }).target,
    }));

    const canvasWidth  = (this._ctx as unknown as { canvasElement: HTMLElement }).canvasElement?.clientWidth  ?? 800;
    const canvasHeight = (this._ctx as unknown as { canvasElement: HTMLElement }).canvasElement?.clientHeight ?? 600;

    const simulation = forceSimulation<D3Node, D3Link>(nodesDataList)
      .force('link',    forceLink<D3Node, D3Link>(d3Links).id(d => d.id)
                          .distance(this._options.linkDistance ?? 100))
      .force('charge',  forceManyBody().strength(this._options.charge ?? -350))
      .force('x',       forceX(canvasWidth  / 2).strength(0.05))
      .force('y',       forceY(canvasHeight / 2).strength(0.05))
      .force('center',  forceCenter(canvasWidth / 2, canvasHeight / 2));

    if (this._options.collisionRadius !== undefined) {
      simulation.force('collide', forceCollide<D3Node>(this._options.collisionRadius));
    }

    this._simulation = simulation;
    this._isRunning  = true;

    simulation.on('tick', () => {
      if (this._options.animate) {
        this._updateNodePositions(simulation.nodes());
      }
    });

    simulation.on('end', () => {
      this._isRunning = false;
      this._updateNodePositions(simulation.nodes());
    });
  }

  stop(): void {
    this._simulation?.stop();
    this._isRunning = false;
  }

  isRunning(): boolean {
    return this._isRunning;
  }

  setOptions(options: Partial<D3ForceLayoutOptions>): void {
    Object.assign(this._options, options);
    if (this._simulation) {
      if (options.charge !== undefined) {
        this._simulation.force('charge', forceManyBody().strength(options.charge));
      }
      if (options.linkDistance !== undefined) {
        const lf = this._simulation.force<ReturnType<typeof forceLink>>('link');
        lf?.distance(options.linkDistance);
      }
      if (options.collisionRadius !== undefined) {
        this._simulation.force('collide', forceCollide<D3Node>(options.collisionRadius));
      }
      this._simulation.alpha(0.3).restart();
    }
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private _updateNodePositions(nodes: D3Node[]): void {
    if (!this._graphPlugin) return;
    const positions = new Map<string, { x: number; y: number }>();
    for (const n of nodes) {
      if (n.x !== undefined && n.y !== undefined) {
        positions.set(n.id, { x: n.x, y: n.y });
      }
    }
    this._graphPlugin.updateNodePositions(positions);
  }
}

