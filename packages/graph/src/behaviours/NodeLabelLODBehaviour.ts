/**
 * `NodeLabelLODBehaviour` — node labels across camera zoom: **when** they show
 * (a zoom band) and **how big** they read on screen (a size policy).
 *
 * - **Visibility.** Below / above the band the text is dropped (pixi's priciest
 *   primitive), so a crowded overview stays fast; it returns inside the band.
 *   This covers a simple node's `'label'` decoration *and* the internal text of
 *   composite nodes (a `CompositeShape`'s `label` parts).
 * - **Keep the important labels.** {@link NodeLabelLODBehaviourOptions.alwaysShowTop}
 *   exempts the most **central** nodes so their labels persist even at overview
 *   zoom — a **fraction** (top-N %), not an absolute edge count, so it adapts
 *   across sparse and dense graphs.
 * - **Size.** {@link LabelSizeOptions} cap, floor or damp how big a label reads
 *   on screen (`maxFontPx: 20` stops labels ballooning when you zoom into a
 *   cluster). Applies to the `'label'` decoration only — composite card text
 *   always scales with its card. Unset, label size is exactly as today.
 *
 * Edge labels have their own behaviour, `EdgeLabelLODBehaviour`, so node and
 * edge labels are tuned separately. Crispness is `TextResolutionLODBehaviour`'s
 * job; overlap is `LabelCollisionBehaviour`'s. Opt-in, off the per-frame render
 * path (see {@link ContentLODBehaviour}).
 *
 * @example
 * ```ts
 * canvas.behaviours.register(
 *   new NodeLabelLODBehaviour({
 *     id: 'node-labels',
 *     targetLayerId: 'graph',
 *     enabled: true,
 *     minZoom: 0.6,        // hide labels below 0.6× …
 *     alwaysShowTop: 0.05, // … except the top 5% most-connected nodes
 *     minFontPx: 10,       // never smaller than 10px on screen
 *     maxFontPx: 20,       // never bigger than 20px on screen
 *   }),
 * );
 * ```
 */

import {
  ContentLODBehaviour,
  type ContentLODBehaviourOptions,
  type ContentRenderer,
} from './ContentLODBehaviour';
import { labelSizePolicyOf, type LabelSizeOptions } from './labelSize';

/** Constructor options for {@link NodeLabelLODBehaviour}. */
export interface NodeLabelLODBehaviourOptions extends ContentLODBehaviourOptions, LabelSizeOptions {
  /**
   * Keep labels shown for the most **central** nodes even when the zoom band
   * hides the rest — a **fraction** in `(0, 1]` by degree centrality (in + out
   * edges). `0.1` keeps the top 10%. Relative, not an absolute edge count, so it
   * adapts across graphs of different densities. Omit / `0` to gate all text
   * uniformly.
   */
  alwaysShowTop?: number;
}

/** Clamp an `alwaysShowTop` fraction to `[0, 1]`; non-positive / invalid → `0`. */
function clampFraction(v: number | undefined): number {
  return typeof v === 'number' && v > 0 ? Math.min(1, v) : 0;
}

export class NodeLabelLODBehaviour extends ContentLODBehaviour<NodeLabelLODBehaviourOptions> {
  override readonly kind = 'node-label-lod';
  /** Node ids currently exempt from hiding (the top-centrality set). */
  private readonly exemptIds = new Set<string>();

  constructor(opts: NodeLabelLODBehaviourOptions) {
    super(opts);
  }

  protected setContentVisible(renderer: ContentRenderer, id: string, visible: boolean): void {
    renderer.setShapeTextVisible(id, visible);
  }

  protected override isExempt(id: string): boolean {
    return this.exemptIds.has(id);
  }

  /**
   * Recompute the top-centrality exemption set: rank every node by degree
   * (in + out) and keep the top `alwaysShowTop` fraction. O(n log n), but only
   * runs on a full reflow (data change / enable / option change), never per zoom.
   */
  protected override refreshExemptions(): void {
    this.exemptIds.clear();
    const layer = this.layer;
    const top = clampFraction(this._options.alwaysShowTop);
    if (!layer || top <= 0) return;

    const store = layer.store;
    const ranked: Array<{ id: string; degree: number }> = [];
    for (const node of store.nodes()) {
      ranked.push({ id: node.id, degree: store.inDegree(node.id) + store.outDegree(node.id) });
    }
    if (ranked.length === 0) return;

    ranked.sort((a, b) => b.degree - a.degree);
    const k = Math.min(ranked.length, Math.max(1, Math.ceil(ranked.length * top)));
    for (let i = 0; i < k; i++) this.exemptIds.add(ranked[i]!.id);
  }

  /** Push the node-label size policy (or clear it when no size option is set). */
  protected override onFullReconcile(): void {
    this.layer?.getRenderer()?.setLabelSizePolicy('shape', labelSizePolicyOf(this._options));
  }

  protected override onDisable(): void {
    super.onDisable();
    // Disabling restores natural label sizes along with visibility.
    this.layer?.getRenderer()?.setLabelSizePolicy('shape', null);
  }

  protected override onDestroy(): void {
    this.layer?.getRenderer()?.setLabelSizePolicy('shape', null);
    super.onDestroy();
  }
}
