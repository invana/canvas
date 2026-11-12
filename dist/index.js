import ELK from 'elkjs/lib/elk-api.js';
import { OneShotPositionLayout, collectPlaceableNodes, buildGroupForest, collectLayoutEdges, resolveLayoutRoot, groupInsets, groupSizeFloor, isMergedEdgeId, resolveNodeSize } from '@invana/graph';

// src/ElkLayout.ts
var FALLBACK_NODE_SIZE = { width: 40, height: 40 };
var CROSS_HIERARCHY_ALGORITHMS = /* @__PURE__ */ new Set(["layered"]);
var ROUTE_PATH_TYPE = {
  ORTHOGONAL: "orth",
  SPLINES: "spline",
  POLYLINE: "straight"
};
var RADIAL_LINK_PREFIX = "__radial:";
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
  /**
   * Rejects when the worker reports an error — its script did not load (a bad
   * URL, an HTML fallback) or threw. `elk-api` listens for replies only, so a
   * dead worker would leave every solve pending for ever; a run races this.
   */
  workerFailed;
  constructor(opts = {}) {
    super(opts);
  }
  /**
   * Lazily construct (and memoise) the ELK instance. Prefers the worker-backed
   * `elk-api` build so the solve stays off the main thread; falls back to the
   * synchronous `elk.bundled.js` when no `Worker` global exists, when worker
   * construction throws (Node / SSR / test runners), or when the worker fails
   * after it was made (see {@link solve}).
   */
  getElk() {
    return this.elkInstance ??= this.createElk();
  }
  async createElk() {
    if (typeof Worker !== "undefined") {
      try {
        const factory = this.opts.workerFactory ?? defaultElkWorkerFactory;
        return new ELK({ workerFactory: (url) => this.watch(factory(url)) });
      } catch {
      }
    }
    return bundledElk();
  }
  /** Arm {@link workerFailed} on `worker`'s first error. */
  watch(worker) {
    let reject;
    const promise = new Promise((_, r) => reject = r);
    promise.catch(() => {
    });
    const watched = { promise, dead: false };
    worker.addEventListener(
      "error",
      (e) => {
        e.preventDefault();
        watched.dead = true;
        reject(new Error(`ElkLayout: the ELK worker failed (${e.message || "its script did not load"})`));
      },
      { once: true }
    );
    this.workerFailed = watched;
    return worker;
  }
  /**
   * Run ELK. A worker that fails is dropped for the synchronous build and the
   * same graph solved again, so a layout never hangs on a dead worker.
   */
  async solve(graph) {
    const elk = await this.getElk();
    const watched = this.workerFailed;
    if (!watched) return elk.layout(graph);
    try {
      return await Promise.race([elk.layout(graph), watched.promise]);
    } catch (err) {
      if (!watched.dead) throw err;
      if (this.workerFailed === watched) {
        elk.terminateWorker?.();
        this.workerFailed = void 0;
        this.elkInstance = bundledElk();
      }
      return (await this.getElk()).layout(graph);
    }
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
    const forward = [];
    for (const e of collectLayoutEdges(layer, placeable)) {
      const stored = isFeedback ? store.getEdge(e.id) : void 0;
      if (stored && isFeedback?.(stored)) {
        feedbackIds.push(e.id);
        continue;
      }
      forward.push(e);
    }
    const algorithm = this.opts.algorithm ?? "layered";
    const topLevel = children.map((c) => c.id);
    const rootId = algorithm === "radial" || algorithm === "layered" ? this.resolveRoot(layer, topLevel, forward, algorithm === "radial" ? "centre" : "tree") : void 0;
    const edges = algorithm === "radial" && rootId !== void 0 ? radialTree(topLevel, forward, rootId) : forward.map((e) => ({ id: e.id, sources: [e.source], targets: [e.target] }));
    if (algorithm === "layered" && rootId !== void 0) {
      const root = children.find((c) => c.id === rootId);
      if (root) root.layoutOptions = { ...root.layoutOptions, "elk.layered.layering.layerConstraint": "FIRST" };
    }
    const graph = { id: "root", layoutOptions: buildLayoutOptions(this.opts, nests), children, edges };
    if (algorithm === "radial") graph.layoutOptions["elk.radial.centerOnRoot"] = "true";
    if (run.anchorNodeId !== void 0 && (this.opts.algorithm ?? "layered") === "layered") {
      seedCurrentPositions(layer, graph, 0, 0);
      applyInteractive(graph);
    }
    const result = await this.solve(graph);
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
    const routePathType = this.opts.edgeRouting !== void 0 && algorithm !== "radial" ? ROUTE_PATH_TYPE[this.opts.edgeRouting] : null;
    const centre = algorithm === "radial" && rootId !== void 0 ? rects.get(rootId) : void 0;
    const meta = {
      edges: routePathType ? result.edges ?? [] : [],
      routePathType,
      rects,
      feedbackIds,
      ...centre ? { origin: { x: centre.cx, y: centre.cy } } : {}
    };
    return { ids, positions: new Float32Array(xy), meta };
  }
  /**
   * The root this run starts from: {@link ElkLayoutOptions.rootNodeId} when it
   * names a top-level node of this run, else the shared rule
   * (`resolveLayoutRoot`) — for `'tree'` that is `undefined` while the graph
   * has sources.
   */
  resolveRoot(layer, topLevel, edges, rule) {
    const named = this.opts.rootNodeId;
    if (named !== void 0 && topLevel.includes(named)) return named;
    if (this.opts.root === "selection") {
      const selected = topLevel.find((id) => layer.store.nodeStatesOf(id).includes("selected"));
      if (selected !== void 0) return selected;
    }
    return resolveLayoutRoot(layer, topLevel, edges, rule);
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
    return { ...route, edges, rects, ...route.origin ? { origin: shift(route.origin) } : {} };
  }
  /**
   * Hand this run's edge geometry to the layer as **layout geometry**
   * (`GraphLayer.setLayoutGeometry`) once node positions have settled: ELK's
   * routes when `edgeRouting` is on, typed by {@link ROUTE_PATH_TYPE}, the
   * feedback lanes, and — for `radial` — the centre as the frame origin that
   * `bump-radial` curves around. Nothing is written onto the edges, so the
   * geometry ends with this layout: the next run of another layout clears it.
   *
   * The geometry is read when each edge resolves its style, which happens
   * after the position flush has moved the shapes, so the route and the
   * boundary anchors agree without a separate flush.
   *
   * ELK works in the same coordinate frame as the stored centres, and — for
   * centre-origin shapes (circle, and `composite` via GraphLayer's centre-fit) —
   * the rendered node occupies exactly ELK's node box, so bend points line up with
   * the cards without any per-edge offset.
   */
  onPositionsApplied(layer, meta) {
    const run = meta;
    if (!run) {
      layer.setLayoutGeometry(this, {});
      return;
    }
    const routes = /* @__PURE__ */ new Map();
    routeFeedbackEdges(layer.store, run.rects, run.feedbackIds, this.opts, routes);
    if (run.routePathType) {
      for (const e of run.edges) {
        if (isMergedEdgeId(e.id)) continue;
        const section = e.sections?.[0];
        if (!section) continue;
        const waypoints = [section.startPoint, ...section.bendPoints ?? [], section.endPoint].map((p) => ({
          x: p.x,
          y: p.y
        }));
        routes.set(e.id, { pathType: run.routePathType, waypoints });
      }
    }
    layer.setLayoutGeometry(this, {
      ...routes.size > 0 ? { routes } : {},
      ...run.origin ? { frame: { origin: run.origin } } : {}
    });
  }
};
function routeFeedbackEdges(store, rects, feedbackIds, opts, routes) {
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
    routes.set(id, { pathType: "orth", waypoints });
  });
}
function radialTree(nodes, edges, rootId) {
  const inScope = new Set(nodes);
  const adjacent = /* @__PURE__ */ new Map();
  for (const e of edges) {
    if (e.source === e.target || !inScope.has(e.source) || !inScope.has(e.target)) continue;
    (adjacent.get(e.source) ?? adjacent.set(e.source, []).get(e.source)).push({ id: e.id, other: e.target });
    (adjacent.get(e.target) ?? adjacent.set(e.target, []).get(e.target)).push({ id: e.id, other: e.source });
  }
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  const grow = (from) => {
    seen.add(from);
    const queue = [from];
    for (let i = 0; i < queue.length; i++) {
      const parent = queue[i];
      for (const { id, other } of adjacent.get(parent) ?? []) {
        if (seen.has(other)) continue;
        seen.add(other);
        out.push({ id, sources: [parent], targets: [other] });
        queue.push(other);
      }
    }
  };
  const component = (from) => {
    const members = [from];
    const local = new Set(members);
    for (let i = 0; i < members.length; i++) {
      for (const { other } of adjacent.get(members[i]) ?? []) {
        if (!local.has(other)) {
          local.add(other);
          members.push(other);
        }
      }
    }
    return members;
  };
  grow(rootId);
  for (const id of nodes) {
    if (seen.has(id)) continue;
    const members = component(id);
    const hub = members.reduce((a, b) => (adjacent.get(b)?.length ?? 0) > (adjacent.get(a)?.length ?? 0) ? b : a);
    out.push({ id: `${RADIAL_LINK_PREFIX}${hub}`, sources: [rootId], targets: [hub] });
    grow(hub);
  }
  return out;
}
function defaultElkWorkerFactory() {
  return new Worker(new URL("./elk-worker.min.js", import.meta.url), { type: "classic" });
}
async function bundledElk() {
  const mod = await import('elkjs/lib/elk.bundled.js');
  const Ctor = mod.default?.default ?? mod.default ?? globalThis.ELK;
  if (!Ctor) throw new Error("ElkLayout: elkjs/lib/elk.bundled.js exported no ELK constructor");
  return new Ctor();
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
  if (opts.ringSpacing !== void 0) out["elk.radial.radius"] = String(opts.ringSpacing);
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