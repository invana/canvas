import { WorldLayer, SpecProjector } from '@invana/canvas';
import { createOutline, PointPath } from 'bubblesets-js';

// src/BubbleSetsLayer.ts

// src/types.ts
var BUBBLE_SET_STYLE_DEFAULTS = {
  fill: 10258687,
  fillOpacity: 0.25,
  strokeOpacity: 0.9,
  strokeWidth: 1.5
};
var BUBBLE_SETS_LAYER_DEFAULTS = {
  pixelGroup: 4,
  nodeR0: 15,
  nodeR1: 50,
  edgeR0: 10,
  edgeR1: 20,
  morphBuffer: 10,
  maxRoutingIterations: 100,
  maxMarchingIterations: 20,
  smoothness: "chaikin",
  chaikinIterations: 4,
  recompute: "auto",
  recomputeDebounceMs: 120
};

// src/BubbleSetsLayer.ts
var BubbleSetsLayer = class extends WorldLayer {
  kind = "bubble-sets-layer";
  graphLayerId;
  sets;
  graph = null;
  specs = null;
  projector = null;
  /** Hull ids published last pass, so sets that vanish are retired. */
  published = [];
  subs = [];
  // Browser `setTimeout` returns `number`; using `ReturnType<typeof setTimeout>`
  // would resolve to NodeJS.Timeout in dual-typed environments and break the
  // `window.clearTimeout(...)` call site.
  debounceTimer = null;
  constructor(opts) {
    super({
      ...opts,
      // Contours extend past node centres by node-influence + morph buffer,
      // so viewport culling against the bare node AABB would clip them.
      cullable: opts.cullable ?? false,
      // Passive annotation — clicks fall through to the graph below.
      hittable: opts.hittable ?? false
    });
    this.graphLayerId = opts.options.graphLayerId;
    this.sets = [...opts.options.sets];
  }
  createState() {
    return {};
  }
  onMount(ctx) {
    const graph = ctx.layers.get(this.graphLayerId);
    if (!graph) {
      throw new Error(
        `BubbleSetsLayer "${this.id}": graph layer "${this.graphLayerId}" not found. Add the GraphLayer before this annotation layer.`
      );
    }
    this.graph = graph;
    const renderer = this.surface.primitives;
    this.specs = ctx.store.specsFor(this.id);
    this.projector = new SpecProjector(this.specs, renderer);
    const recompute = this.options.recompute ?? BUBBLE_SETS_LAYER_DEFAULTS.recompute;
    if (recompute === "auto") {
      this.subs.push(graph.events.on("data:changed", () => this.scheduleRecompute()));
    }
    this.scheduleRecompute();
  }
  onUnmount() {
    for (const off of this.subs) off();
    this.subs.length = 0;
    if (this.debounceTimer !== null) {
      window.clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.projector?.destroy();
    this.projector = null;
    this.specs?.clear();
    this.specs = null;
    this.published = [];
    this.graph = null;
  }
  hitTest(_worldX, _worldY) {
    return null;
  }
  // ─── Set mutators ─────────────────────────────────────────────────────────
  // Each mutation owns recompute-scheduling so callers never have to remember
  // to call `recompute()` themselves. Mirrors the resolver-based live-tweaking
  // pattern documented in [[feedback_live_edge_tweaking_via_resolvers]].
  /** Replace the full set list. */
  setSets(sets) {
    this.sets = [...sets];
    this.scheduleRecompute();
  }
  /** Append a set. No-op (with warning) if the id already exists. */
  addSet(set) {
    if (this.sets.some((s) => s.id === set.id)) {
      console.warn(`BubbleSetsLayer "${this.id}": addSet \u2014 id "${set.id}" already present.`);
      return;
    }
    this.sets.push(set);
    this.scheduleRecompute();
  }
  /** Remove a set by id. Returns `true` if anything was removed. */
  removeSet(id) {
    const i = this.sets.findIndex((s) => s.id === id);
    if (i === -1) return false;
    this.sets.splice(i, 1);
    this.scheduleRecompute();
    return true;
  }
  /**
   * Shallow-merge `patch` into the set with the given id. Nested `style` /
   * `label` are also shallow-merged so callers can supply partial style /
   * label patches without rebuilding the whole object. Returns `true` if
   * the id was found.
   */
  updateSet(id, patch) {
    const i = this.sets.findIndex((s) => s.id === id);
    if (i === -1) return false;
    const prev = this.sets[i];
    this.sets[i] = {
      ...prev,
      ...patch,
      style: patch.style ? { ...prev.style, ...patch.style } : prev.style,
      label: patch.label ? { ...prev.label, ...patch.label } : prev.label
    };
    this.scheduleRecompute();
    return true;
  }
  /** Read-only view of the current set list. */
  getSets() {
    return this.sets;
  }
  /**
   * Force an immediate recompute. Useful in `recompute: 'manual'` mode, or
   * to refresh the overlay after externally mutating options that don't
   * have setters yet.
   */
  recompute() {
    this.computeAndPaint();
  }
  // ─── Internals ────────────────────────────────────────────────────────────
  scheduleRecompute() {
    if (!this.specs) return;
    if (this.debounceTimer !== null) window.clearTimeout(this.debounceTimer);
    const wait = this.options.recomputeDebounceMs ?? BUBBLE_SETS_LAYER_DEFAULTS.recomputeDebounceMs;
    this.debounceTimer = window.setTimeout(() => {
      this.debounceTimer = null;
      this.computeAndPaint();
    }, wait);
  }
  computeAndPaint() {
    const specs = this.specs;
    const graph = this.graph;
    if (!specs || !graph) return;
    const t0 = performance.now();
    const painted = [];
    if (this.sets.length === 0) {
      this.retireHulls(painted);
      this.emitRecompute(0, t0);
      return;
    }
    const nodeRects = /* @__PURE__ */ new Map();
    for (const node of graph.store.nodes()) {
      const r = this.rectForNode(graph, node);
      if (r) nodeRects.set(node.id, r);
    }
    const algoOpts = this.algorithmOptions();
    const smoothness = this.options.smoothness ?? BUBBLE_SETS_LAYER_DEFAULTS.smoothness;
    for (const set of this.sets) {
      if (set.members.length === 0) continue;
      const members = [];
      const nonMemberIds = new Set(nodeRects.keys());
      for (const id of set.members) {
        const r = nodeRects.get(id);
        if (!r) continue;
        members.push(r);
        nonMemberIds.delete(id);
      }
      if (members.length === 0) continue;
      const nonMembers = [];
      for (const id of nonMemberIds) nonMembers.push(nodeRects.get(id));
      const edges = [];
      if (set.edges) {
        for (const eid of set.edges) {
          const edge = graph.store.getEdge(eid);
          if (!edge) continue;
          const s = graph.store.getNode(edge.source)?.position;
          const t = graph.store.getNode(edge.target)?.position;
          if (!s || !t) continue;
          edges.push({ x1: s.x, y1: s.y, x2: t.x, y2: t.y });
        }
      }
      let path = createOutline(members, nonMembers, edges, algoOpts);
      if (smoothness === "bspline") {
        path = path.sample().bSplines();
      } else if (smoothness === "chaikin") {
        path = chaikin(
          path.sample(),
          this.options.chaikinIterations ?? BUBBLE_SETS_LAYER_DEFAULTS.chaikinIterations
        );
      }
      painted.push(...this.publishSet(set, path));
    }
    this.retireHulls(painted);
    this.emitRecompute(this.sets.length, t0);
  }
  /**
   * World-space AABB for a node. `GraphLayer.boundsOfNode` returns the
   * shape's local (centre-relative) rect — `node.position` is *not* baked
   * in — so we offset by the node's position to get world coords. Falls
   * back to a small box around the position when the renderer hasn't
   * mounted the node yet.
   */
  rectForNode(graph, node) {
    const p = node.position;
    if (!p) return null;
    const b = graph.boundsOfNode(node);
    if (b) return { x: b.x + p.x, y: b.y + p.y, width: b.width, height: b.height };
    const r = 10;
    return { x: p.x - r, y: p.y - r, width: r * 2, height: r * 2 };
  }
  algorithmOptions() {
    const o = this.options;
    return {
      pixelGroup: o.pixelGroup ?? BUBBLE_SETS_LAYER_DEFAULTS.pixelGroup,
      nodeR0: o.nodeR0 ?? BUBBLE_SETS_LAYER_DEFAULTS.nodeR0,
      nodeR1: o.nodeR1 ?? BUBBLE_SETS_LAYER_DEFAULTS.nodeR1,
      edgeR0: o.edgeR0 ?? BUBBLE_SETS_LAYER_DEFAULTS.edgeR0,
      edgeR1: o.edgeR1 ?? BUBBLE_SETS_LAYER_DEFAULTS.edgeR1,
      morphBuffer: o.morphBuffer ?? BUBBLE_SETS_LAYER_DEFAULTS.morphBuffer,
      maxRoutingIterations: o.maxRoutingIterations ?? BUBBLE_SETS_LAYER_DEFAULTS.maxRoutingIterations,
      maxMarchingIterations: o.maxMarchingIterations ?? BUBBLE_SETS_LAYER_DEFAULTS.maxMarchingIterations
    };
  }
  /**
   * Describe one set's hull as a `path` spec and publish it. Returns the ids
   * used, so the caller can retire hulls that this pass no longer produces.
   *
   * The contour is a **closed quadratic spline** through segment midpoints —
   * `smooth: true` on the spec, so the shape does the tracing. That is what
   * turns marching-squares stair-stepping into a glassy contour, and it now
   * happens in the geometry rather than at draw time here.
   */
  publishSet(set, path) {
    const pts = path.points;
    const specs = this.specs;
    if (!specs || pts.length < 3) return [];
    const style = { ...BUBBLE_SET_STYLE_DEFAULTS, ...set.style };
    const stroke = set.style?.stroke ?? style.fill;
    const id = `${this.id}:hull:${set.id}`;
    const spec = {
      kind: "path",
      x: 0,
      y: 0,
      smooth: true,
      points: pts.map((pt) => ({ x: pt.x, y: pt.y })),
      fill: [{ kind: "solid", color: style.fill, alpha: style.fillOpacity }],
      stroke: {
        color: stroke,
        alpha: style.strokeOpacity,
        width: style.strokeWidth,
        join: "round",
        cap: "round"
      },
      ...set.label ? { label: this.labelStyleFor(set, pts, stroke) } : {}
    };
    specs.set(id, spec);
    this.projector?.project(id);
    this.events.emit("set:painted", { setId: set.id, vertices: pts.length });
    return [id];
  }
  /** Drop hulls published last pass that this pass no longer produced. */
  retireHulls(current) {
    const keep = new Set(current);
    for (const id of this.published) {
      if (keep.has(id)) continue;
      this.specs?.delete(id);
      this.projector?.unproject(id);
    }
    this.published = current;
  }
  /**
   * Label styling for a set's hull, as a `label` decoration on the hull spec.
   *
   * Placement is expressed as a screen-space offset from the hull's own centre,
   * because the decoration anchors to its host — so the anchor maths that used
   * to position a free-floating `Text` becomes an offset here. `contour-end`
   * keeps its tangent rotation; `centroid` sits at the middle with no rotation.
   */
  labelStyleFor(set, pts, fallbackColor) {
    const label = set.label;
    const placement = label.placement ?? "contour-end";
    let cx = 0;
    let cy = 0;
    for (const p of pts) {
      cx += p.x;
      cy += p.y;
    }
    cx /= pts.length;
    cy /= pts.length;
    let anchorX = cx;
    let anchorY = cy;
    let rotation = 0;
    if (placement !== "centroid") {
      const end = pts[pts.length - 1];
      const prev = pts[Math.max(0, pts.length - 8)];
      anchorX = end.x;
      anchorY = end.y;
      rotation = Math.atan2(end.y - prev.y, end.x - prev.x);
    }
    return {
      content: {
        kind: "text",
        text: label.text,
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: label.fontSize ?? 11,
        fontWeight: "600",
        fill: label.color ?? 16777215
      },
      background: {
        fill: set.style?.stroke ?? fallbackColor,
        fillAlpha: 0.95,
        radius: 6,
        padding: [2, 6]
      },
      placement: "center",
      offset: { x: anchorX - cx, y: anchorY - cy },
      rotation
    };
  }
  emitRecompute(sets, t0) {
    this.events.emit("recompute", { sets, durationMs: performance.now() - t0 });
  }
};
function chaikin(path, iterations) {
  let pts = path.points;
  for (let it = 0; it < iterations; it++) {
    const n = pts.length;
    if (n < 3) break;
    const next = new Array(n * 2);
    for (let i = 0; i < n; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % n];
      next[i * 2] = { x: 0.75 * a.x + 0.25 * b.x, y: 0.75 * a.y + 0.25 * b.y };
      next[i * 2 + 1] = { x: 0.25 * a.x + 0.75 * b.x, y: 0.25 * a.y + 0.75 * b.y };
    }
    pts = next;
  }
  return new PointPath(pts, path.closed);
}

export { BUBBLE_SETS_LAYER_DEFAULTS, BUBBLE_SET_STYLE_DEFAULTS, BubbleSetsLayer };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map