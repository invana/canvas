/**
 * ElkLayoutPlugin
 *
 * One-shot graph layout using ELK.js. Requires {@link GraphDataPlugin} to be
 * registered first. Call `run()` after `graphPlugin.setData()`.
 *
 * @example
 * ```typescript
 * import { Canvas } from '@invana/canvas';
 * import { GraphDataPlugin } from '@invana/plugins-graph-data';
 * import { ElkLayoutPlugin } from '@invana/plugin-layouts-elkjs';
 *
 * const canvas = new Canvas({ container });
 * await canvas.init();
 *
 * const graph = new GraphDataPlugin();
 * await canvas.plugins.register(graph);
 *
 * const layout = new ElkLayoutPlugin({ algorithm: 'layered' });
 * await canvas.plugins.register(layout);
 *
 * graph.setData({ nodes, edges });
 * await layout.run();
 * ```
 */

import ELK from 'elkjs/lib/elk.bundled.js';
import type { ElkNode, ElkExtendedEdge, LayoutOptions } from 'elkjs';
import type { CanvasPlugin, PluginContext } from '@invana/canvas';
import type { GraphDataPlugin } from '@invana/plugins-graph-data';

// ============================================================================
// TYPES
// ============================================================================

export interface ElkLayoutOptions {
  /** ELK layout algorithm identifier. Defaults to `'layered'`. */
  algorithm?: string;
  /** Raw ELK layout options forwarded to the root graph. */
  layoutOptions?: LayoutOptions;
  /** Fallback node width when not present in node data. Defaults to `60`. */
  defaultNodeWidth?: number;
  /** Fallback node height when not present in node data. Defaults to `40`. */
  defaultNodeHeight?: number;
}

// ============================================================================
// PLUGIN
// ============================================================================

export class ElkLayoutPlugin implements CanvasPlugin {
  readonly id = 'layout-elkjs';

  private _graphPlugin: GraphDataPlugin | null = null;
  private _options: Required<ElkLayoutOptions>;
  // elk instance is typed as `InstanceType<typeof ELK>` since elkjs ships the
  // class as a value-only export on some module resolution paths
  private _elk: InstanceType<typeof ELK>;

  constructor(options: ElkLayoutOptions = {}) {
    this._options = {
      algorithm:         options.algorithm         ?? 'layered',
      layoutOptions:     options.layoutOptions     ?? {},
      defaultNodeWidth:  options.defaultNodeWidth  ?? 60,
      defaultNodeHeight: options.defaultNodeHeight ?? 40,
    };
    this._elk = new ELK();
  }

  register(ctx: PluginContext): void {
    this._graphPlugin = ctx.getPlugin<GraphDataPlugin>('graph-data') ?? null;

    if (!this._graphPlugin) {
      console.warn('[ElkLayout] GraphDataPlugin ("graph-data") not found. Register it before this plugin.');
    }
  }

  destroy(): void {
    this._graphPlugin = null;
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Run the ELK layout and apply resulting positions to all nodes.
   * Returns once positions have been written to the graph.
   */
  async run(): Promise<void> {
    const gp = this._graphPlugin;
    if (!gp) throw new Error('[ElkLayout] GraphDataPlugin not found.');

    const { defaultNodeWidth, defaultNodeHeight, algorithm, layoutOptions } = this._options;

    const nodeStore = gp.getNodeStore();
    const edgeStore = gp.getEdgeStore();

    const elkChildren: ElkNode[] = Array.from(nodeStore.values()).map((n) => ({
      id:     n.id,
      // width/height can be stored in node.data for per-node overrides
      width:  (n.data?.['width']  as number | undefined) ?? defaultNodeWidth,
      height: (n.data?.['height'] as number | undefined) ?? defaultNodeHeight,
    }));

    const elkEdges: ElkExtendedEdge[] = Array.from(edgeStore.values()).map((e) => ({
      id:      e.id,
      sources: [e.source],
      targets: [e.target],
    }));

    const elkGraph: ElkNode = {
      id: 'root',
      layoutOptions: {
        'algorithm': algorithm,
        ...layoutOptions,
      },
      children: elkChildren,
      edges:    elkEdges,
    };

    const result = await this._elk.layout(elkGraph);

    const positions = new Map<string, { x: number; y: number }>();
    for (const child of result.children ?? []) {
      if (child.x !== undefined && child.y !== undefined) {
        // ELK positions are top-left; convert to centre for the canvas
        const w = child.width  ?? defaultNodeWidth;
        const h = child.height ?? defaultNodeHeight;
        positions.set(child.id, { x: child.x + w / 2, y: child.y + h / 2 });
      }
    }

    gp.updateNodePositions(positions);
  }

  /** Change options and re-run the layout. */
  async rerun(options?: Partial<ElkLayoutOptions>): Promise<void> {
    if (options) Object.assign(this._options, options);
    await this.run();
  }
}
