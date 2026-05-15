/**
 * `EdgeSizeLODBehaviour` — keep `GraphLayer` connector stroke widths at
 * a fixed screen-pixel width across camera zoom.
 *
 * Concrete subclass of `ElementSizeLODBehaviour`. Pair with
 * {@link NodeSizeLODBehaviour} when you also want pixel-constant nodes
 * (typical for map-overlay use cases — at city zoom a `strokeWidth: 0.6`
 * becomes a 150-px slab without this behaviour).
 *
 * Uses `PrimitivesRenderer.setConnectorStroke` (not `updateConnector`)
 * to patch the stroke spec and redraw on the cached path. Crucially,
 * this skips `recomputeConnectorPath`, which would iterate every shape
 * in the renderer to build an obstacle list — `O(edges × shapes)` per
 * reflow and lethal during continuous zoom. The path doesn't depend on
 * camera scale, so re-routing on a stroke-only change is wasted work.
 *
 * @example
 * ```ts
 * import { EdgeSizeLODBehaviour } from '@invana/graph';
 *
 * canvas.behaviours.register(
 *   new EdgeSizeLODBehaviour({
 *     id: 'edge-size-lod',
 *     enabled: true,
 *     layers: [{ layerId: 'graph', strokeWidthPx: 0.6 }],
 *   }),
 * );
 * ```
 */

import {
  ElementSizeLODBehaviour,
  resolveNumberOrGetter,
  type CanvasContext,
  type ElementSizeLODBehaviourOptions,
  type NumberOrGetter,
  type PrimitivesRenderer,
} from '@invana/canvas';

import type { GraphLayer } from '../layer/GraphLayer';

/**
 * Default debounce when the caller doesn't override `settleMs`.
 * Edge stroke updates are the expensive path (one Pixi geometry rebuild
 * per connector), so we trade mid-gesture stroke drift for sustained
 * frame rate — apply only after the user stops zooming. 80ms is short
 * enough to feel "instant on release" without firing during a fling.
 */
const DEFAULT_EDGE_SETTLE_MS = 80;

/** Per-`GraphLayer` config — one entry per layer this behaviour rescales. */
export interface EdgeSizeLODConfig {
  /** Required — the `GraphLayer` whose edges are rescaled. */
  layerId: string;
  /**
   * Target stroke width in screen px for edges that don't carry a
   * per-edge `data.strokeWidth` override. Falls back to the layer's
   * `edgeDefaults.strokeWidth`. Accepts a static number or a getter
   * (`() => settings.targetEdgePx`).
   */
  strokeWidthPx?: NumberOrGetter;
}

export interface EdgeSizeLODBehaviourOptions extends ElementSizeLODBehaviourOptions {
  /** One config per `GraphLayer` to drive. */
  layers: EdgeSizeLODConfig[];
}

function readNumber(data: unknown, field: string): number | undefined {
  if (data == null || typeof data !== 'object') return undefined;
  const v = (data as Record<string, unknown>)[field];
  return typeof v === 'number' ? v : undefined;
}

interface ResolvedTarget {
  config: EdgeSizeLODConfig;
  layer: GraphLayer;
}

export class EdgeSizeLODBehaviour extends ElementSizeLODBehaviour {
  private readonly configs: EdgeSizeLODConfig[];
  private resolved: ResolvedTarget[] = [];

  constructor(opts: EdgeSizeLODBehaviourOptions) {
    super({ settleMs: DEFAULT_EDGE_SETTLE_MS, ...opts });
    this.configs = opts.layers.slice();
  }

  protected override onResolveTargets(ctx: CanvasContext): void {
    for (const config of this.configs) {
      const layer = ctx.layers.get<GraphLayer>(config.layerId);
      if (!layer) {
        throw new Error(
          `EdgeSizeLODBehaviour "${this.id}": layer "${config.layerId}" not found in CanvasContext.`,
        );
      }
      this.resolved.push({ config, layer });
    }
  }

  protected override onReleaseTargets(): void {
    this.resolved = [];
  }

  protected override apply(rawScale: number): void {
    const scale = Math.max(rawScale, 1e-6);
    for (const { config, layer } of this.resolved) {
      const renderer = layer.getRenderer();
      if (!renderer) continue;
      this.writeLayer(layer, renderer, scale, config);
    }
  }

  private writeLayer(
    layer: GraphLayer,
    renderer: PrimitivesRenderer,
    scale: number,
    config: EdgeSizeLODConfig,
  ): void {
    const defaults = layer.getEdgeDefaults();
    const fallbackSwPx =
      resolveNumberOrGetter(config.strokeWidthPx) ?? defaults.strokeWidth;

    for (const edge of layer.store.edges()) {
      const data = edge.data;
      const baseSw = readNumber(data, 'strokeWidth') ?? fallbackSwPx;
      const strokeColor = readNumber(data, 'stroke') ?? defaults.stroke;
      renderer.setConnectorStroke(edge.id, {
        color: strokeColor,
        width: baseSw / scale,
      });
    }
  }
}
