/**
 * `D3SankeyLayout` — `Layout` for `@invana/graph` that wraps `d3-sankey`.
 *
 * Treats the graph as a DAG of flows: edges carry a numeric `value` (read
 * from `edge.data.value`), `d3-sankey` arranges nodes into columns and
 * solves for vertical positions that minimise link crossings.
 *
 * One-shot synchronous: `apply()` snapshots the store, runs the sankey
 * solver once, bulk-writes positions plus per-edge anchor opts, emits
 * `start` → `tick` → `end`, and resolves. No tick loop.
 *
 * NOTE: this layout extends `Layout` directly (not `OneShotPositionLayout`).
 * Its write is a single, tightly-ordered `store.batch` — positions, the solved
 * rect sizes, and the per-edge `edge-port` ribbon anchors must land in ONE flush
 * (the anchors are computed against the final rects). It also has no meaningful
 * position transition (it replaces node geometry + ribbons). Both make the
 * generic one-shot base a poor fit, so it stays standalone.
 *
 * The layout writes:
 *  - per node: position (centre of the d3-sankey rect), and `style.shape`
 *    `{ kind: 'rect', width, height }`.
 *  - per edge: `style.strokeWidth = link.width`, `style.shape.pathType =
 *    'bump-horizontal'` with per-endpoint `edge-port` anchors, and
 *    `arrowTargetShape: 'none'` (a ribbon never carries an arrowhead — and at
 *    flow-proportional widths the default `'triangle'` marker renders as a huge
 *    wedge).
 *
 * Pair with `edge: { style: { shape: { pathType: 'bump-horizontal' }, strokeAlpha: 0.5 } }`
 * on the `GraphLayer` to reproduce d3-sankey's SVG appearance.
 *
 * @example
 * const layout = new D3SankeyLayout({ id: 'sankey', targetLayerId: 'graph', size: [1200, 720] });
 * await layout.apply(graphLayer);
 */

import {
  sankey as d3sankey,
  sankeyCenter,
  sankeyJustify,
  sankeyLeft,
  sankeyRight,
} from 'd3-sankey';

import { Layout } from '@invana/canvas';
import type { GraphLayer } from '@invana/graph';

import type {
  D3SankeyLayoutOptions,
  D3SankeyNodeAlign,
  SankeyLinkRef,
  SankeyNodeRef,
} from './types';

const DEFAULT_SIZE: [number, number] = [1000, 600];

const NODE_ALIGN_FNS = {
  left: sankeyLeft,
  right: sankeyRight,
  center: sankeyCenter,
  justify: sankeyJustify,
} as const;

function pickAlign(name: D3SankeyNodeAlign | undefined): (typeof NODE_ALIGN_FNS)[keyof typeof NODE_ALIGN_FNS] {
  return NODE_ALIGN_FNS[name ?? 'justify'];
}

export class D3SankeyLayout extends Layout<GraphLayer> {
  private readonly opts: D3SankeyLayoutOptions;
  /** True while a run is active. Guards `stop()` so `end` only fires once. */
  private running = false;

  constructor(opts: D3SankeyLayoutOptions = {}) {
    // Forward `id` / `targetLayerId` to the base `Layout` so the layout can be
    // registered in a `LayoutRegistry` and driven via `config.activeLayout`.
    super(opts);
    this.opts = opts;
  }

  /**
   * Run the layout against `layer`. Resolves once positions and per-edge
   * hints have been written. Lifecycle events fire in order:
   * `start` → `tick` (once) → `end`.
   */
  async apply(layer: GraphLayer): Promise<void> {
    this.stop();
    const store = layer.store;

    // 1. Snapshot store → d3-sankey inputs. Sankey expects nodes with an
    //    arbitrary opaque id and links with `{source, target, value}` —
    //    string ids work directly via `nodeId`.
    const ids: string[] = [];
    const nodes: SankeyNodeRef[] = [];
    for (const n of store.nodes()) {
      ids.push(n.id);
      nodes.push({ id: n.id });
    }
    if (ids.length === 0) return;

    const links: SankeyLinkRef[] = [];
    for (const e of store.edges()) {
      const data = e.data as { value?: unknown } | undefined;
      const value = data && typeof data.value === 'number' ? data.value : undefined;
      if (value === undefined || !Number.isFinite(value) || value <= 0) {
        throw new Error(
          `D3SankeyLayout: edge "${e.id}" is missing a positive numeric \`data.value\` — sankey needs per-link weights.`,
        );
      }
      links.push({
        id: e.id,
        source: e.source,
        target: e.target,
        value,
      });
    }

    // 2. Configure and run d3-sankey.
    const [w, h] = this.opts.size ?? DEFAULT_SIZE;
    const sankey = d3sankey<SankeyNodeRef, SankeyLinkRef>()
      .nodeId((d) => d.id)
      .nodeAlign(pickAlign(this.opts.nodeAlign))
      .nodeWidth(this.opts.nodeWidth ?? 24)
      .nodePadding(this.opts.nodePadding ?? 8)
      .extent([
        [0, 0],
        [w, h],
      ]);
    if (this.opts.iterations !== undefined) sankey.iterations(this.opts.iterations);
    if (this.opts.nodeSort !== undefined) sankey.nodeSort(this.opts.nodeSort);
    if (this.opts.linkSort !== undefined) sankey.linkSort(this.opts.linkSort);

    sankey({ nodes, links });

    // 3. Project results back onto the store. Centre the diagram around the
    //    world origin so `fitContent` frames it naturally without the caller
    //    knowing the layout viewport.
    const cx = (this.opts.center?.x ?? 0) - w / 2;
    const cy = (this.opts.center?.y ?? 0) - h / 2;
    const buffer = new Float32Array(ids.length * 2);
    const sizes = new Map<string, { width: number; height: number; cx: number; cy: number }>();
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]!;
      const x0 = node.x0 ?? 0;
      const x1 = node.x1 ?? 0;
      const y0 = node.y0 ?? 0;
      const y1 = node.y1 ?? 0;
      const width = x1 - x0;
      const height = y1 - y0;
      const centreX = (x0 + x1) / 2 + cx;
      const centreY = (y0 + y1) / 2 + cy;
      buffer[i * 2] = centreX;
      buffer[i * 2 + 1] = centreY;
      sizes.set(node.id, { width, height, cx: centreX, cy: centreY });
    }

    // 4. Mark running, fire start, write positions + per-node + per-edge
    //    hints in ONE batch so subscribers see a single coalesced flush — the
    //    `edge-port` anchors resolve against the final rects in the same paint.
    this.running = true;
    this.events.emit('start', {});

    store.batch(() => {
      store.setPositionsBulk(ids, buffer);

      // Per-node geometry — write the discriminated `style.shape` as a rect
      // with the d3-sankey-solved `{ width, height }`. Merge over existing
      // `style` so caller-provided colour / label fields survive.
      for (const id of ids) {
        const size = sizes.get(id);
        if (!size) continue;
        const existing = store.getNode(id);
        if (!existing) continue;
        const existingStyle =
          existing.style && typeof existing.style === 'object'
            ? (existing.style as Record<string, unknown>)
            : {};
        store.updateNode(id, {
          style: {
            ...existingStyle,
            shape: { kind: 'rect', width: size.width, height: size.height },
          },
        });
      }

      // Per-edge geometry — stroke thickness ∝ flow value (d3-sankey sets
      // `link.width` from the solver), plus per-endpoint anchor opts pointing
      // at the right `edge-port`. `arrowTargetShape: 'none'` so the ribbon has
      // no arrowhead (the layer default is `'triangle'`, which at sankey stroke
      // widths renders as a huge wedge).
      //
      // `link.y0` is the absolute world-y of the link's centre at the source's
      // right face; `src.cy` is the rect's centre y. The `edge-port` anchor
      // receives the delta as its `offset`.
      for (const link of links) {
        const srcId = typeof link.source === 'string' ? link.source : link.source.id;
        const tgtId = typeof link.target === 'string' ? link.target : link.target.id;
        const src = sizes.get(srcId);
        const tgt = sizes.get(tgtId);
        if (!src || !tgt) continue;
        const linkWidth = link.width ?? 1;
        const sourceOffset = (link.y0 ?? 0) + cy - src.cy;
        const targetOffset = (link.y1 ?? 0) + cy - tgt.cy;

        const existing = store.getEdge(link.id);
        if (!existing) continue;
        const existingStyle =
          existing.style && typeof existing.style === 'object'
            ? (existing.style as Record<string, unknown>)
            : {};
        store.updateEdge(link.id, {
          style: {
            ...existingStyle,
            shape: {
              pathType: 'bump-horizontal',
              sourceAnchor: 'edge-port',
              sourceAnchorOpts: { side: 'right', offset: sourceOffset },
              targetAnchor: 'edge-port',
              targetAnchorOpts: { side: 'left', offset: targetOffset },
            },
            strokeWidth: Math.max(1, linkWidth),
            arrowTargetShape: 'none',
          },
        });
      }
    });

    this.events.emit('tick', {});

    if (this.running) {
      this.running = false;
      this.events.emit('end', { reason: 'completed' });
    }
  }

  /** Cancel a run. The synchronous body of `apply()` rarely yields long
   *  enough for this to fire, but it keeps the contract symmetric with
   *  iterative layouts. */
  stop(): void {
    if (!this.running) return;
    this.running = false;
    this.events.emit('end', { reason: 'stopped' });
  }
}
