import { sankey, sankeyJustify, sankeyCenter, sankeyRight, sankeyLeft } from 'd3-sankey';
import { Layout } from '@invana/canvas-core';

// src/D3SankeyLayout.ts
var DEFAULT_SIZE = [1e3, 600];
var NODE_ALIGN_FNS = {
  left: sankeyLeft,
  right: sankeyRight,
  center: sankeyCenter,
  justify: sankeyJustify
};
function pickAlign(name) {
  return NODE_ALIGN_FNS[name ?? "justify"];
}
var D3SankeyLayout = class extends Layout {
  kind = "d3-sankey-layout";
  opts;
  /** True while a run is active. Guards `stop()` so `end` only fires once. */
  running = false;
  constructor(opts = {}) {
    super(opts);
    this.opts = opts;
  }
  /**
   * Run the layout against `layer`. Resolves once positions and per-edge
   * hints have been written. Lifecycle events fire in order:
   * `start` → `tick` (once) → `end`.
   *
   * `run` is recorded on {@link runOptions}; anchoring is not supported — a
   * sankey's columns are fixed by the flow, so there is nothing to re-flow
   * around one node.
   */
  async apply(layer, run = {}) {
    this.stop();
    this.runOptions = run;
    const store = layer.store;
    const ids = [];
    const nodes = [];
    const includeHidden = this.opts.includeHidden === true;
    const placeable = /* @__PURE__ */ new Set();
    for (const n of store.nodes()) {
      if (!includeHidden && n.hidden === true) continue;
      ids.push(n.id);
      nodes.push({ id: n.id });
      placeable.add(n.id);
    }
    if (ids.length === 0) return;
    const links = [];
    for (const e of store.edges()) {
      if (!placeable.has(e.source) || !placeable.has(e.target)) continue;
      const data = e.data;
      const value = data && typeof data.value === "number" ? data.value : void 0;
      if (value === void 0 || !Number.isFinite(value) || value <= 0) {
        throw new Error(
          `D3SankeyLayout: edge "${e.id}" is missing a positive numeric \`data.value\` \u2014 sankey needs per-link weights.`
        );
      }
      links.push({
        id: e.id,
        source: e.source,
        target: e.target,
        value
      });
    }
    const [w, h] = this.opts.size ?? DEFAULT_SIZE;
    const sankey$1 = sankey().nodeId((d) => d.id).nodeAlign(pickAlign(this.opts.nodeAlign)).nodeWidth(this.opts.nodeWidth ?? 24).nodePadding(this.opts.nodePadding ?? 8).extent([
      [0, 0],
      [w, h]
    ]);
    if (this.opts.iterations !== void 0) sankey$1.iterations(this.opts.iterations);
    if (this.opts.nodeSort !== void 0) sankey$1.nodeSort(this.opts.nodeSort);
    if (this.opts.linkSort !== void 0) sankey$1.linkSort(this.opts.linkSort);
    sankey$1({ nodes, links });
    const cx = (this.opts.center?.x ?? 0) - w / 2;
    const cy = (this.opts.center?.y ?? 0) - h / 2;
    const buffer = new Float32Array(ids.length * 2);
    const sizes = /* @__PURE__ */ new Map();
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
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
    this.running = true;
    this.events.emit("start", {});
    store.batch(() => {
      store.setPositionsBulk(ids, buffer);
      for (const id of ids) {
        const size = sizes.get(id);
        if (!size) continue;
        const existing = store.getNode(id);
        if (!existing) continue;
        const existingStyle = existing.style && typeof existing.style === "object" ? existing.style : {};
        store.internal.updateNode(id, {
          style: {
            ...existingStyle,
            shape: { kind: "rect", width: size.width, height: size.height }
          }
        });
      }
      for (const link of links) {
        const srcId = typeof link.source === "string" ? link.source : link.source.id;
        const tgtId = typeof link.target === "string" ? link.target : link.target.id;
        const src = sizes.get(srcId);
        const tgt = sizes.get(tgtId);
        if (!src || !tgt) continue;
        const linkWidth = link.width ?? 1;
        const sourceOffset = (link.y0 ?? 0) + cy - src.cy;
        const targetOffset = (link.y1 ?? 0) + cy - tgt.cy;
        const existing = store.getEdge(link.id);
        if (!existing) continue;
        const existingStyle = existing.style && typeof existing.style === "object" ? existing.style : {};
        store.internal.updateEdge(link.id, {
          style: {
            ...existingStyle,
            shape: {
              pathType: "bump-horizontal",
              sourceAnchor: "edge-port",
              sourceAnchorOpts: { side: "right", offset: sourceOffset },
              targetAnchor: "edge-port",
              targetAnchorOpts: { side: "left", offset: targetOffset }
            },
            strokeWidth: Math.max(1, linkWidth),
            arrowTargetShape: "none"
          }
        });
      }
    });
    this.events.emit("tick", {});
    if (this.running) {
      this.running = false;
      this.events.emit("end", { reason: "completed" });
    }
  }
  /** Cancel a run. The synchronous body of `apply()` rarely yields long
   *  enough for this to fire, but it keeps the contract symmetric with
   *  iterative layouts. */
  stop() {
    if (!this.running) return;
    this.running = false;
    this.events.emit("end", { reason: "stopped" });
  }
};

export { D3SankeyLayout };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map