import ELK from 'elkjs/lib/elk-api.js';
import { OneShotPositionLayout, collectPlaceableNodes, buildGroupForest, collectLayoutEdges, groupInsets, groupSizeFloor, isMergedEdgeId, resolveNodeSize } from '@invana/graph';

// src/ElkLayout.ts
var FALLBACK_NODE_SIZE = { width: 40, height: 40 };
var CROSS_HIERARCHY_ALGORITHMS = /* @__PURE__ */ new Set(["layered"]);
var ElkLayout = class extends OneShotPositionLayout {
  kind = "elk-layout";
  /**
   * Shared ELK instance — `elkjs` is happy to be reused across runs, and we
   * keep one worker alive for the layout's lifetime instead of spinning one up
   * per solve. Created lazily on the first {@link computeLayout} (so a layout
   * that's registered but never run never spawns a worker), and memoised as a
   * Promise because the no-worker fallback needs an async dynamic import.
   */
  elkInstance;
  constructor(opts = {}) {
    super(opts);
  }
  /**
   * Lazily construct (and memoise) the ELK instance. Prefers the worker-backed
   * `elk-api` build so the solve stays off the main thread; falls back to the
   * synchronous `elk.bundled.js` only when no `Worker` global exists or worker
   * construction throws synchronously (Node / SSR / test runners).
   */
  getElk() {
    return this.elkInstance ??= this.createElk();
  }
  async createElk() {
    if (typeof Worker !== "undefined") {
      try {
        const factory = this.opts.workerFactory ?? defaultElkWorkerFactory;
        return new ELK({ workerFactory: factory });
      } catch {
      }
    }
    const { default: BundledELK } = await import('elkjs/lib/elk.bundled.js');
    return new BundledELK();
  }
  /**
   * Snapshot the store, run ELK (async), and return centre-converted positions.
   * The base writes them (snap or glide per `transition`) and then calls
   * {@link onPositionsApplied} with the routed edges. A throw here is surfaced
   * by the base (emits `end`, rejects the awaited `apply()`); a run superseded
   * while ELK was in flight is dropped by the base's staleness check.
   */
  async computeLayout(layer, run = {}) {
    const store = layer.store;
    const fallback = this.opts.defaultNodeSize ?? FALLBACK_NODE_SIZE;
    const sizeOf = (n) => this.opts.nodeSize?.(n) ?? resolveNodeSize(layer, n, fallback);
    const placeable = collectPlaceableNodes(layer, this.opts.includeHidden === true);
    if (placeable.size === 0) return null;
    const nested = this.opts.includeGroups !== false;
    const children = nested ? buildGroupForest(layer, placeable).map((n) => this.buildElkNode(layer, n, sizeOf, fallback)) : [...placeable].map((id) => {
      const node = store.getNode(id);
      const size = node ? sizeOf(node) : fallback;
      return { id, width: size.width, height: size.height };
    });
    if (children.length === 0) return null;
    const nests = nested && children.some((c) => (c.children?.length ?? 0) > 0);
    const isFeedback = this.opts.feedbackEdges;
    const feedbackIds = [];
    const edges = [];
    for (const e of collectLayoutEdges(layer, placeable)) {
      const stored = isFeedback ? store.getEdge(e.id) : void 0;
      if (stored && isFeedback?.(stored)) {
        feedbackIds.push(e.id);
        continue;
      }
      edges.push({ id: e.id, sources: [e.source], targets: [e.target] });
    }
    const graph = { id: "root", layoutOptions: buildLayoutOptions(this.opts, nests), children, edges };
    if (run.anchorNodeId !== void 0 && (this.opts.algorithm ?? "layered") === "layered") {
      seedCurrentPositions(layer, graph, 0, 0);
      applyInteractive(graph);
    }
    const elk = await this.getElk();
    const result = await elk.layout(graph);
    const ids = [];
    const xy = [];
    const rects = /* @__PURE__ */ new Map();
    const walk = (node, parentX, parentY) => {
      const absX = parentX + (node.x ?? 0);
      const absY = parentY + (node.y ?? 0);
      if (node.id !== "root") {
        const w = node.width ?? 0;
        const h = node.height ?? 0;
        const cx = absX + w / 2;
        const cy = absY + h / 2;
        ids.push(node.id);
        xy.push(cx, cy);
        rects.set(node.id, { cx, cy, w, h });
      }
      for (const child of node.children ?? []) walk(child, absX, absY);
    };
    walk(result, 0, 0);
    const routing = this.opts.edgeRouting !== void 0;
    const meta = routing || feedbackIds.length > 0 ? {
      edges: routing ? result.edges ?? [] : [],
      rects,
      feedbackIds
    } : null;
    return { ids, positions: new Float32Array(xy), meta };
  }
  /**
   * Turn one node of the group forest into an ELK node, nesting a group's
   * members as `children` so ELK packs them inside the container box.
   *
   * A container's insets come from its own {@link GroupOptions} (`padding`, plus
   * `headerHeight` on top for the title band / `tabbed-rect` tab), so the box
   * ELK computes is the box `GraphLayer` will draw — rather than a hardcoded
   * guess the layer then has to grow.
   *
   * An `autoFit` container is deliberately handed **no** width/height. Its
   * stored size is the previous frame's computed fit; feeding that back as a
   * `MINIMUM_SIZE` floor would ratchet the frame — free to grow as members
   * spread, never able to shrink when they contract. A fixed-size group (`autoFit:
   * false`) does get its declared size as the floor, which is what "fixed" means.
   */
  buildElkNode(layer, forestNode, sizeOf, fallback) {
    const node = layer.store.getNode(forestNode.id);
    const size = node ? sizeOf(node) : fallback;
    const elkNode = { id: forestNode.id, width: size.width, height: size.height };
    if (forestNode.children.length === 0) return elkNode;
    elkNode.children = forestNode.children.map(
      (child) => this.buildElkNode(layer, child, sizeOf, fallback)
    );
    const insets = node ? groupInsets(layer, node) : { top: 16, right: 16, bottom: 16, left: 16 };
    elkNode.layoutOptions = {
      // Spacing/algorithm keys are repeated on every container because **ELK
      // resolves layout options per node and a node that declares its own
      // `layoutOptions` does not inherit its parent's.** Without this the root
      // graph honoured `nodeSpacing` / `layerSpacing` between the containers
      // while every container laid its own members out with ELK's built-in
      // defaults (`elk.spacing.nodeNode` = 20) — so raising the spacing pushed
      // the frames apart and left the nodes inside them jammed together, at a
      // fixed 20px no matter what the caller configured.
      ...nestedLayoutOptions(this.opts),
      // Container-specific, so they must win over the inherited set above.
      "elk.padding": `[top=${insets.top},left=${insets.left},bottom=${insets.bottom},right=${insets.right}]`,
      "elk.nodeSize.constraints": "MINIMUM_SIZE"
    };
    const floor = node ? groupSizeFloor(layer, node) : void 0;
    if (floor) {
      elkNode.width = floor.width;
      elkNode.height = floor.height;
    } else {
      delete elkNode.width;
      delete elkNode.height;
    }
    return elkNode;
  }
  /**
   * Shift the routed geometry with an anchored run's translation — the edge
   * sections (start / bend / end points) and the node boxes the feedback router
   * clears are absolute coordinates, so they must move with the positions.
   */
  translateMeta(meta, dx, dy) {
    const route = meta;
    if (!route) return route;
    const shift = (p) => ({ ...p, x: p.x + dx, y: p.y + dy });
    const edges = route.edges.map((e) => ({
      ...e,
      ...e.sections ? {
        sections: e.sections.map((sec) => ({
          ...sec,
          startPoint: shift(sec.startPoint),
          endPoint: shift(sec.endPoint),
          ...sec.bendPoints ? { bendPoints: sec.bendPoints.map(shift) } : {}
        }))
      } : {}
    }));
    const rects = /* @__PURE__ */ new Map();
    for (const [id, r] of route.rects) rects.set(id, { ...r, cx: r.cx + dx, cy: r.cy + dy });
    return { ...route, edges, rects };
  }
  /**
   * When ELK edge routing is on, read back each edge's computed bend points and
   * write them as `style.shape.waypoints` (pathType 'orth') — once node positions
   * have settled, in their own flush.
   *
   * This must NOT share a flush with the position write: a position flush marks
   * every incident connector dirty and re-routes them via a plain
   * `updateConnector(id, {})` at flush end; bundling the waypoint write into that
   * same flush lets that re-route run alongside the waypoint-applying `edge:update`,
   * and the routed path doesn't stick. A separate flush (no concurrent node moves)
   * mirrors the hover/`rerenderEdge` path that applies cleanly.
   *
   * ELK works in the same coordinate frame as the stored centres, and — for
   * centre-origin shapes (circle, and `composite` via GraphLayer's centre-fit) —
   * the rendered node occupies exactly ELK's node box, so bend points line up with
   * the cards without any per-edge offset.
   */
  onPositionsApplied(layer, meta) {
    const route = meta;
    if (!route) return;
    const { edges: routedEdges, rects, feedbackIds } = route;
    const store = layer.store;
    store.batch(() => {
      routeFeedbackEdges(store, rects, feedbackIds, this.opts);
      for (const e of routedEdges) {
        if (isMergedEdgeId(e.id)) continue;
        const section = e.sections?.[0];
        const waypoints = section ? [section.startPoint, ...section.bendPoints ?? [], section.endPoint].map((p) => ({
          x: p.x,
          y: p.y
        })) : [];
        const prev = store.getEdge(e.id)?.style ?? {};
        store.internal.updateEdge(e.id, {
          style: { ...prev, shape: { ...prev.shape ?? {}, pathType: "orth", waypoints } }
        });
      }
    });
  }
};
function routeFeedbackEdges(store, rects, feedbackIds, opts) {
  if (feedbackIds.length === 0) return;
  const direction = opts.direction ?? "RIGHT";
  const horizontalFlow = direction === "RIGHT" || direction === "LEFT";
  const gap = opts.feedbackLaneGap ?? 36;
  let extent = Infinity;
  for (const r of rects.values()) {
    extent = Math.min(extent, horizontalFlow ? r.cy - r.h / 2 : r.cx - r.w / 2);
  }
  if (!Number.isFinite(extent)) return;
  const spans = feedbackIds.map((id) => {
    const edge = store.getEdge(id);
    const from = edge ? rects.get(edge.source) : void 0;
    const to = edge ? rects.get(edge.target) : void 0;
    if (!edge || !from || !to) return null;
    const span = horizontalFlow ? Math.abs(from.cx - to.cx) : Math.abs(from.cy - to.cy);
    return { id, from, to, span };
  }).filter((v) => v !== null).sort((a, b) => a.span - b.span);
  spans.forEach(({ id, from, to }, i) => {
    const lane = extent - gap * (i + 1);
    const waypoints = horizontalFlow ? [
      { x: from.cx, y: lane },
      { x: to.cx, y: lane }
    ] : [
      { x: lane, y: from.cy },
      { x: lane, y: to.cy }
    ];
    const prev = store.getEdge(id)?.style ?? {};
    store.internal.updateEdge(id, {
      style: { ...prev, shape: { ...prev.shape ?? {}, pathType: "orth", waypoints } }
    });
  });
}
function defaultElkWorkerFactory() {
  return new Worker(new URL("elkjs/lib/elk-worker.min.js", import.meta.url), {
    type: "classic"
  });
}
function buildLayoutOptions(opts, nests = false) {
  const out = {};
  const algorithm = opts.algorithm ?? "layered";
  out["elk.algorithm"] = algorithm;
  if (nests && CROSS_HIERARCHY_ALGORITHMS.has(algorithm)) {
    out["elk.hierarchyHandling"] = "INCLUDE_CHILDREN";
  }
  if (opts.direction !== void 0) out["elk.direction"] = opts.direction;
  if (opts.nodeSpacing !== void 0) out["elk.spacing.nodeNode"] = String(opts.nodeSpacing);
  if (opts.layerSpacing !== void 0) {
    out["elk.layered.spacing.nodeNodeBetweenLayers"] = String(opts.layerSpacing);
  }
  if (opts.edgeNodeSpacing !== void 0) out["elk.spacing.edgeNode"] = String(opts.edgeNodeSpacing);
  if (opts.edgeSpacing !== void 0) out["elk.spacing.edgeEdge"] = String(opts.edgeSpacing);
  if (opts.edgeRouting !== void 0) out["elk.edgeRouting"] = opts.edgeRouting;
  if (opts.padding !== void 0) out["elk.padding"] = formatPadding(opts.padding);
  if (opts.layoutOptions) Object.assign(out, opts.layoutOptions);
  return out;
}
function nestedLayoutOptions(opts) {
  const out = buildLayoutOptions(opts);
  delete out["elk.padding"];
  return out;
}
function formatPadding(p) {
  if (typeof p === "number") {
    return `[top=${p},right=${p},bottom=${p},left=${p}]`;
  }
  const top = p.top ?? 0;
  const right = p.right ?? 0;
  const bottom = p.bottom ?? 0;
  const left = p.left ?? 0;
  return `[top=${top},right=${right},bottom=${bottom},left=${left}]`;
}
var INTERACTIVE_KEYS = [
  "elk.layered.cycleBreaking.strategy",
  "elk.layered.layering.strategy",
  "elk.layered.crossingMinimization.strategy"
];
function applyInteractive(node) {
  if (node.layoutOptions) {
    for (const key of INTERACTIVE_KEYS) node.layoutOptions[key] = "INTERACTIVE";
  }
  for (const child of node.children ?? []) {
    if (child.children?.length) applyInteractive(child);
  }
}
function seedCurrentPositions(layer, node, parentX, parentY) {
  for (const child of node.children ?? []) {
    const box = currentBox(layer, child);
    if (box) {
      child.x = box.x - parentX;
      child.y = box.y - parentY;
    }
    if (child.children?.length) {
      seedCurrentPositions(layer, child, box ? box.x : parentX, box ? box.y : parentY);
    }
  }
}
function currentBox(layer, node) {
  const bounds = layer.getRenderer()?.getShapeWorldBounds(node.id);
  if (bounds) return { x: bounds.x, y: bounds.y };
  if (!layer.store.hasPosition(node.id)) return null;
  const p = layer.store.getPosition(node.id);
  return { x: p.x - (node.width ?? 0) / 2, y: p.y - (node.height ?? 0) / 2 };
}

export { ElkLayout };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map