/**
 * `TextLODBehaviour` — shows / hides node **text** by camera zoom.
 *
 * Covers both a simple node's `'label'` decoration *and* the internal text of
 * composite nodes (a `CompositeShape`'s `label` parts) — hence "text", not
 * "label". Below the band the text is dropped (pixi's priciest primitive), so a
 * crowded overview stays fast; it returns as you zoom in.
 *
 * **Keep the important labels.** {@link TextLODBehaviourOptions.alwaysShowTop}
 * exempts the most **central** nodes so their labels persist even at overview
 * zoom. It's a **fraction** (top-N %), not an absolute edge count — degree
 * varies wildly by graph, so a relative cut adapts across sparse and dense
 * graphs alike.
 *
 * This is the **visibility** half of text LOD. Its companion is
 * `TextResolutionLODBehaviour`, which keeps shown text crisp — compose both for
 * full text LOD. Sits in the LOD family alongside `IconLODBehaviour` /
 * `ImageLODBehaviour`; opt-in, off the per-frame render path (see
 * {@link ContentLODBehaviour}).
 *
 * @example
 * ```ts
 * canvas.behaviours.register(
 *   new TextLODBehaviour({
 *     id: 'text-lod',
 *     targetLayerId: 'graph',
 *     enabled: true,
 *     minZoom: 1.5,        // hide labels below 1.5× …
 *     alwaysShowTop: 0.05, // … except the top 5% most-connected nodes
 *   }),
 * );
 * ```
 */

import {
  ContentLODBehaviour,
  type ContentLODBehaviourOptions,
  type ContentRenderer,
} from './ContentLODBehaviour';

/** Constructor options for {@link TextLODBehaviour}. */
export interface TextLODBehaviourOptions extends ContentLODBehaviourOptions {
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

export class TextLODBehaviour extends ContentLODBehaviour {
  /** Fraction of highest-degree nodes whose labels stay shown. `0` = none. */
  private alwaysShowTop: number;
  /** Node ids currently exempt from hiding (the top-centrality set). */
  private readonly exemptIds = new Set<string>();

  constructor(opts: TextLODBehaviourOptions) {
    super(opts);
    this.alwaysShowTop = clampFraction(opts.alwaysShowTop);
  }

  protected setContentVisible(renderer: ContentRenderer, id: string, visible: boolean): void {
    renderer.setShapeTextVisible(id, visible);
  }

  protected override isNodeExempt(id: string): boolean {
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
    if (!layer || this.alwaysShowTop <= 0) return;

    const store = layer.store;
    const ranked: Array<{ id: string; degree: number }> = [];
    for (const node of store.nodes()) {
      ranked.push({ id: node.id, degree: store.inDegree(node.id) + store.outDegree(node.id) });
    }
    if (ranked.length === 0) return;

    ranked.sort((a, b) => b.degree - a.degree);
    const k = Math.min(ranked.length, Math.max(1, Math.ceil(ranked.length * this.alwaysShowTop)));
    for (let i = 0; i < k; i++) this.exemptIds.add(ranked[i]!.id);
  }

  override setOptions(patch: Partial<TextLODBehaviourOptions>): void {
    if ('alwaysShowTop' in patch) this.alwaysShowTop = clampFraction(patch.alwaysShowTop);
    // super triggers a full re-apply (refreshExemptions + sweep) when enabled.
    super.setOptions(patch);
  }
}
