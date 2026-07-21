/**
 * `EdgeScaleLODBehaviour` — keep `GraphLayer` connector stroke widths at
 * a fixed screen-pixel width across camera zoom.
 *
 * Concrete subclass of `ElementScaleLODBehaviour`. Pair with
 * {@link NodeScaleLODBehaviour} when you also want pixel-constant nodes
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
 * import { EdgeScaleLODBehaviour } from '@invana/graph';
 *
 * canvas.behaviours.register(
 *   new EdgeScaleLODBehaviour({
 *     id: 'edge-scale-lod',
 *     enabled: true,
 *     layers: [{ targetLayerId: 'graph', strokeWidthPx: 0.6 }],
 *   }),
 * );
 * ```
 */

import {
  ElementScaleLODBehaviour,
  type CanvasContext,
  type ElementScaleLODBehaviourOptions,
  type NumberOrGetter,
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
export interface EdgeScaleLODConfig {
  /** Required — the `GraphLayer` whose edges are rescaled. */
  targetLayerId: string;
  /**
   * Target stroke width in screen px for edges that don't carry a
   * per-edge `data.strokeWidth` override. Falls back to the layer's
   * `edgeDefaults.strokeWidth`. Accepts a static number or a getter
   * (`() => settings.targetEdgePx`).
   */
  strokeWidthPx?: NumberOrGetter;
}

export interface EdgeScaleLODBehaviourOptions extends ElementScaleLODBehaviourOptions {
  /** One config per `GraphLayer` to drive. */
  layers: EdgeScaleLODConfig[];
}

interface ResolvedTarget {
  config: EdgeScaleLODConfig;
  layer: GraphLayer;
}

export class EdgeScaleLODBehaviour extends ElementScaleLODBehaviour<EdgeScaleLODBehaviourOptions> {
  override readonly kind = 'edge-size-lod';
  /** Live-read from `_options` so `setOptions` applies; `onOptionsChanged` reflows. */
  private get configs(): EdgeScaleLODConfig[] { return this._options.layers; }
  private resolved: ResolvedTarget[] = [];

  constructor(opts: EdgeScaleLODBehaviourOptions) {
    super({ settleMs: DEFAULT_EDGE_SETTLE_MS, ...opts });
  }

  /**
   * Re-apply the stroke scaling at the current camera scale when a live option
   * patch lands (e.g. a `strokeWidthPx` slider), so the change shows without
   * waiting for the next zoom.
   */
  protected override onOptionsChanged(): void {
    this.reflow();
  }

  protected override onResolveTargets(ctx: CanvasContext): void {
    for (const config of this.configs) {
      const layer = ctx.layers.get<GraphLayer>(config.targetLayerId);
      if (!layer) {
        throw new Error(
          `EdgeScaleLODBehaviour "${this.id}": layer "${config.targetLayerId}" not found in CanvasContext.`,
        );
      }
      this.resolved.push({ config, layer });
    }
  }

  protected override onReleaseTargets(): void {
    this.resolved = [];
  }

  /**
   * Per-zoom-frame apply: write the screen-px / world-px ratio to every
   * managed edge as a render-time stroke multiplier. The renderer's draw
   * pipeline reads `inst.strokeWidthScale` and multiplies it into the
   * spec's `stroke.width` at draw time, so state-config strokes (e.g.
   * `active: { strokeWidth: 1.5 }`) are interpreted in the same screen-px
   * unit the layer's "live" strokes are interpreted in — no LOD-loss
   * across a `GraphLayer.rerenderEdge` rebuild, and no inversion of the
   * caller's intent.
   *
   * The strokeWidthPx config field is unused under this model — every
   * spec width is treated as the target screen-px. Kept on the type for
   * back-compat; a future revision may remove it.
   */
  protected override apply(rawScale: number): void {
    const scale = Math.max(rawScale, 1e-6);
    const multiplier = 1 / scale;
    for (const { layer } of this.resolved) {
      const renderer = layer.getRenderer();
      if (!renderer) continue;
      for (const edge of layer.store.edges()) {
        renderer.scaleConnectorStroke(edge.id, multiplier);
      }
    }
  }
}
