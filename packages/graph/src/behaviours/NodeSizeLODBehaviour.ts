/**
 * `NodeSizeLODBehaviour` — keep `GraphLayer` node body (and optionally
 * outline width) at a fixed screen-pixel size across camera zoom.
 *
 * Concrete subclass of `ElementSizeLODBehaviour` — that base owns the
 * RAF coalescing, `camera:zoom` subscription, and enable/disable
 * lifecycle. This class only knows how to rescale graph nodes.
 *
 * Pair with {@link EdgeSizeLODBehaviour} when you also want pixel-constant
 * edge strokes. They're independent behaviours; the browser RAF callback
 * batches both into the same animation frame so registering both has
 * effectively the same per-frame cost as one monolith doing both passes.
 *
 * Supports `circle` and `rect` node shapes. `arc`-shape nodes are
 * skipped — their geometry is in `innerR` / `outerR` / sweep angles and
 * doesn't map cleanly to a single screen-px input.
 *
 * @example
 * ```ts
 * import { NodeSizeLODBehaviour } from '@invana/graph';
 *
 * canvas.behaviours.register(
 *   new NodeSizeLODBehaviour({
 *     id: 'node-size-lod',
 *     enabled: true,
 *     layers: [
 *       {
 *         layerId: 'graph',
 *         sizePx: 6,          // node diameter in screen px
 *         strokeWidthPx: 1,   // outline width in screen px (omit to leave in world units)
 *       },
 *     ],
 *   }),
 * );
 * ```
 */

import {
  ElementSizeLODBehaviour,
  resolveNumberOrGetter,
  type BehaviourOptions,
  type CanvasContext,
  type NumberOrGetter,
  type PrimitivesRenderer,
} from '@invana/canvas';

import type { GraphLayer } from '../layer/GraphLayer';

/** Per-`GraphLayer` config — one entry per layer this behaviour rescales. */
export interface NodeSizeLODConfig {
  /** Required — the `GraphLayer` whose nodes are rescaled. */
  layerId: string;
  /**
   * Target body size in screen px for nodes that don't carry a per-node
   * `data.size` override. Falls back to the layer's `nodeDefaults.size`
   * when omitted. Accepts a static number or a getter — getters re-read
   * on every reflow so GUI sliders update live.
   */
  sizePx?: NumberOrGetter;
  /**
   * Target outline width in screen px. When set, the outline is also
   * pixel-constant; omit to leave stroke widths in world units (a
   * hairline at world zoom, a slab at city zoom).
   */
  strokeWidthPx?: NumberOrGetter;
}

export interface NodeSizeLODBehaviourOptions extends BehaviourOptions {
  /** One config per `GraphLayer` to drive. */
  layers: NodeSizeLODConfig[];
}

function readNumber(data: unknown, field: string): number | undefined {
  if (data == null || typeof data !== 'object') return undefined;
  const v = (data as Record<string, unknown>)[field];
  return typeof v === 'number' ? v : undefined;
}

function readShapeKind(data: unknown): 'circle' | 'rect' | 'arc' | undefined {
  if (data == null || typeof data !== 'object') return undefined;
  const v = (data as Record<string, unknown>).shape;
  if (v === 'circle' || v === 'rect' || v === 'arc') return v;
  return undefined;
}

interface ResolvedTarget {
  config: NodeSizeLODConfig;
  layer: GraphLayer;
}

export class NodeSizeLODBehaviour extends ElementSizeLODBehaviour {
  private readonly configs: NodeSizeLODConfig[];
  private resolved: ResolvedTarget[] = [];

  constructor(opts: NodeSizeLODBehaviourOptions) {
    super(opts);
    this.configs = opts.layers.slice();
  }

  protected override onResolveTargets(ctx: CanvasContext): void {
    for (const config of this.configs) {
      const layer = ctx.layers.get<GraphLayer>(config.layerId);
      if (!layer) {
        throw new Error(
          `NodeSizeLODBehaviour "${this.id}": layer "${config.layerId}" not found in CanvasContext.`,
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
    config: NodeSizeLODConfig,
  ): void {
    const defaults = layer.getNodeDefaults();
    const fallbackSizePx = resolveNumberOrGetter(config.sizePx) ?? defaults.size;
    const fallbackSwPx = resolveNumberOrGetter(config.strokeWidthPx);
    const defaultStrokeColor =
      typeof defaults.stroke === 'number' ? defaults.stroke : undefined;

    for (const node of layer.store.nodes()) {
      const data = node.data;
      const kind = readShapeKind(data) ?? defaults.shape;
      if (kind === 'arc') continue;

      // Per-node `data.size` always wins over the behaviour's fallback —
      // matches the resolution order used everywhere else in GraphLayer.
      const baseSize = readNumber(data, 'size') ?? fallbackSizePx;
      const worldSize = baseSize / scale;

      const partial: Record<string, unknown> = {};
      if (kind === 'circle') {
        partial.radius = worldSize / 2;
      } else {
        // rect
        partial.width = worldSize;
        const baseHeight = readNumber(data, 'height') ?? baseSize;
        partial.height = baseHeight / scale;
      }

      if (fallbackSwPx !== undefined) {
        const baseSw = readNumber(data, 'strokeWidth') ?? fallbackSwPx;
        const strokeColor = readNumber(data, 'stroke') ?? defaultStrokeColor;
        // Skip stroke when explicitly disabled (`stroke: false` on data)
        // — partial-merging a junk stroke object would draw incorrectly.
        const strokeDisabled =
          data && (data as Record<string, unknown>).stroke === false;
        if (strokeColor !== undefined && !strokeDisabled) {
          partial.stroke = { color: strokeColor, width: baseSw / scale };
        }
      }

      renderer.updateShape(node.id, partial);
    }
  }
}
