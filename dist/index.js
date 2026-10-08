import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, forceX, forceY, forceRadial } from 'd3-force';
import { Layout } from '@invana/canvas-core';
import { isPlaceableNode, collectLayoutEdges, groupInsets } from '@invana/graph';

// src/D3ForceLayout.ts
var DEFAULT_SEPARATION_STRENGTH = 0.8;
var DEFAULT_SEPARATION_PADDING = 24;
function makeGroupSeparationForce(input, strength, padding) {
  const { boxCount, boxOf, halfSize, counts, insets, isGroup } = input;
  const minX = new Float64Array(boxCount);
  const minY = new Float64Array(boxCount);
  const maxX = new Float64Array(boxCount);
  const maxY = new Float64Array(boxCount);
  const pushX = new Float64Array(boxCount);
  const pushY = new Float64Array(boxCount);
  let nodes = [];
  const force = () => {
    minX.fill(Infinity);
    minY.fill(Infinity);
    maxX.fill(-Infinity);
    maxY.fill(-Infinity);
    pushX.fill(0);
    pushY.fill(0);
    for (let i = 0; i < nodes.length; i++) {
      if (counts[i] !== 1) continue;
      const n = nodes[i];
      const b = boxOf[i];
      const x = n.x ?? 0;
      const y = n.y ?? 0;
      const hw = halfSize[i * 2];
      const hh = halfSize[i * 2 + 1];
      if (x - hw < minX[b]) minX[b] = x - hw;
      if (y - hh < minY[b]) minY[b] = y - hh;
      if (x + hw > maxX[b]) maxX[b] = x + hw;
      if (y + hh > maxY[b]) maxY[b] = y + hh;
    }
    for (let b = 0; b < boxCount; b++) {
      if (minX[b] === Infinity) continue;
      minY[b] = minY[b] - insets[b * 4];
      maxX[b] = maxX[b] + insets[b * 4 + 1];
      maxY[b] = maxY[b] + insets[b * 4 + 2];
      minX[b] = minX[b] - insets[b * 4 + 3];
    }
    const k = strength;
    let any = false;
    for (let a = 0; a < boxCount; a++) {
      if (minX[a] === Infinity) continue;
      for (let b = a + 1; b < boxCount; b++) {
        if (minX[b] === Infinity) continue;
        if (isGroup[a] !== 1 && isGroup[b] !== 1) continue;
        const ox = Math.min(maxX[a], maxX[b]) - Math.max(minX[a], minX[b]) + padding;
        const oy = Math.min(maxY[a], maxY[b]) - Math.max(minY[a], minY[b]) + padding;
        if (ox <= 0 || oy <= 0) continue;
        any = true;
        if (ox < oy) {
          const dir = minX[a] + maxX[a] <= minX[b] + maxX[b] ? -1 : 1;
          pushX[a] = pushX[a] + dir * ox * k / 2;
          pushX[b] = pushX[b] - dir * ox * k / 2;
        } else {
          const dir = minY[a] + maxY[a] <= minY[b] + maxY[b] ? -1 : 1;
          pushY[a] = pushY[a] + dir * oy * k / 2;
          pushY[b] = pushY[b] - dir * oy * k / 2;
        }
      }
    }
    if (!any) return;
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      if (n.fx != null) continue;
      const b = boxOf[i];
      n.vx = (n.vx ?? 0) + pushX[b];
      n.vy = (n.vy ?? 0) + pushY[b];
    }
  };
  force.initialize = (n) => {
    nodes = n;
  };
  return force;
}
var DEFAULT_CLUSTER_STRENGTH = 0.2;
function makeClusterForce(clusterOf, strength) {
  let nodes = [];
  const force = (alpha) => {
    const centroids = /* @__PURE__ */ new Map();
    for (const node of nodes) {
      const c = clusterOf(node);
      if (c < 0) continue;
      let acc = centroids.get(c);
      if (!acc) {
        acc = { x: 0, y: 0, n: 0 };
        centroids.set(c, acc);
      }
      acc.x += node.x ?? 0;
      acc.y += node.y ?? 0;
      acc.n += 1;
    }
    if (centroids.size === 0) return;
    for (const acc of centroids.values()) {
      acc.x /= acc.n;
      acc.y /= acc.n;
    }
    const k = strength * alpha;
    for (const node of nodes) {
      const c = clusterOf(node);
      if (c < 0) continue;
      const acc = centroids.get(c);
      node.vx = (node.vx ?? 0) + (acc.x - (node.x ?? 0)) * k;
      node.vy = (node.vy ?? 0) + (acc.y - (node.y ?? 0)) * k;
    }
  };
  force.initialize = (n) => {
    nodes = n;
  };
  return force;
}
function solveForces(input) {
  const { count, positions, seeded, fixed, links, radii, clusters, separation, params } = input;
  const nodes = new Array(count);
  for (let i = 0; i < count; i++) {
    const n = { index: i };
    if (seeded[i]) {
      const x = positions[i * 2];
      const y = positions[i * 2 + 1];
      n.x = x;
      n.y = y;
      if (fixed[i]) {
        n.fx = x;
        n.fy = y;
      }
    }
    nodes[i] = n;
  }
  const linkObjs = [];
  for (let i = 0; i < links.length; i += 2) {
    linkObjs.push({ source: links[i], target: links[i + 1] });
  }
  const sim = forceSimulation(nodes).stop();
  configureForces(sim, linkObjs, radii, clusters, separation, params);
  configureSimulation(sim, params);
  const decay = 1 - sim.alphaDecay();
  const ticks = decay > 0 && decay < 1 ? Math.min(1e3, Math.max(1, Math.ceil(Math.log(sim.alphaMin() / sim.alpha()) / Math.log(decay)))) : 300;
  for (let i = 0; i < ticks; i++) sim.tick();
  const out = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    out[i * 2] = nodes[i].x ?? 0;
    out[i * 2 + 1] = nodes[i].y ?? 0;
  }
  return out;
}
function configureForces(sim, links, radii, clusters, separation, params) {
  const { link, charge, center, collide, x, y, radial, cluster, separateGroups } = params;
  if (link !== void 0) {
    const force = forceLink(links);
    if (link.distance !== void 0) force.distance(link.distance);
    if (link.strength !== void 0) force.strength(link.strength);
    if (link.iterations !== void 0) force.iterations(link.iterations);
    sim.force("link", force);
  }
  if (charge !== void 0) {
    const force = forceManyBody();
    if (charge.strength !== void 0) force.strength(charge.strength);
    if (charge.theta !== void 0) force.theta(charge.theta);
    if (charge.distanceMin !== void 0) force.distanceMin(charge.distanceMin);
    if (charge.distanceMax !== void 0) force.distanceMax(charge.distanceMax);
    sim.force("charge", force);
  }
  if (center !== void 0) {
    const force = forceCenter(center.x ?? 0, center.y ?? 0);
    if (center.strength !== void 0) force.strength(center.strength);
    sim.force("center", force);
  } else if (x === void 0 && y === void 0 && radial === void 0) {
    sim.force("center", forceCenter(0, 0));
  }
  if (radii) {
    const force = forceCollide().radius((d) => radii[d.index] ?? 0);
    if (collide?.strength !== void 0) force.strength(collide.strength);
    if (collide?.iterations !== void 0) force.iterations(collide.iterations);
    sim.force("collide", force);
  }
  if (x !== void 0) {
    const force = forceX();
    if (x.x !== void 0) force.x(x.x);
    if (x.strength !== void 0) force.strength(x.strength);
    sim.force("x", force);
  }
  if (y !== void 0) {
    const force = forceY();
    if (y.y !== void 0) force.y(y.y);
    if (y.strength !== void 0) force.strength(y.strength);
    sim.force("y", force);
  }
  if (radial !== void 0) {
    const force = forceRadial(radial.radius, radial.x ?? 0, radial.y ?? 0);
    if (radial.strength !== void 0) force.strength(radial.strength);
    sim.force("radial", force);
  }
  if (clusters && cluster !== void 0) {
    sim.force(
      "cluster",
      makeClusterForce(
        (n) => clusters[n.index] ?? -1,
        cluster.strength ?? DEFAULT_CLUSTER_STRENGTH
      )
    );
  }
  if (separation && separateGroups !== void 0) {
    sim.force(
      "separateGroups",
      makeGroupSeparationForce(
        separation,
        separateGroups.strength ?? DEFAULT_SEPARATION_STRENGTH,
        separateGroups.padding ?? DEFAULT_SEPARATION_PADDING
      )
    );
  }
}
function configureSimulation(sim, params) {
  const { alpha, alphaMin, alphaDecay, alphaTarget, velocityDecay } = params;
  if (alpha !== void 0) sim.alpha(alpha);
  if (alphaMin !== void 0) sim.alphaMin(alphaMin);
  if (alphaDecay !== void 0) sim.alphaDecay(alphaDecay);
  if (alphaTarget !== void 0) sim.alphaTarget(alphaTarget);
  if (velocityDecay !== void 0) sim.velocityDecay(velocityDecay);
}

// src/D3ForceLayout.ts
var REHEAT_ALPHA = 0.3;
var D3ForceLayout = class extends Layout {
  kind = "d3-force-layout";
  opts;
  /** Last layer `apply()` ran against — so `setOptions` can re-heat it live. */
  lastLayer = null;
  sim = null;
  nodes = [];
  ids = [];
  nodeById = /* @__PURE__ */ new Map();
  /** GraphNode snapshot indexed by id — used by per-node force callbacks
   *  (e.g. `collide.radius(d => ...)`) without coupling SimNode to GraphNode. */
  graphNodeById = /* @__PURE__ */ new Map();
  /** Ids of nodes whose `GraphNode.pinned === true` — permanent pins from
   *  user data. Driven via d3-force's `fx/fy` so the simulation keeps them
   *  fixed. Live: pin/unpin patches on `node:update` add/remove entries. */
  pinnedIds = /* @__PURE__ */ new Set();
  /** Ids of nodes currently being dragged by a user behaviour. Populated
   *  on `node:drag-start` from the layer, drained on `node:drag-end`. While
   *  an id is in this set, position updates mirror onto `fx/fy` so the
   *  simulation can't push the node away from the cursor. On drag-end the
   *  transient `fx/fy` clears (unless the node is also in `pinnedIds`,
   *  which is the permanent-pin path). Decoupled from `pinned` so a drag
   *  never mutates user-data semantics — pin-on-release is opt-in via a
   *  separate behaviour. */
  draggedIds = /* @__PURE__ */ new Set();
  /**
   * The live run's anchor ({@link LayoutRunOptions.anchorNodeId}): indices of
   * the sim nodes that stand for it and the centroid they must keep. `null`
   * when the run is not anchored, or anchoring is off because the run has
   * pinned nodes (they already hold the picture in place — shifting the free
   * nodes around them would pull the two apart).
   */
  anchor = null;
  buffer = new Float32Array(0);
  /** True while our own bulk write is in-flight, so the `node:update`
   *  events it triggers don't bounce back into the sim. Relies on the
   *  store's default sync flush firing events inside the bulk call. */
  writing = false;
  unsubscribe = null;
  offDragStart = null;
  offDragEnd = null;
  /** True while a run is active. Guards `stop()` so it only emits `end`
   *  once per run, even if called externally after a natural settle. */
  running = false;
  // ─── `animate: false` static-settle worker ────────────────────────────────
  /** Lazily-created solver worker, reused for the instance's lifetime. */
  worker = null;
  /** Sticky flag: no `Worker` global, or construction/runtime failed → always
   *  use the synchronous fallback. */
  workerBroken = false;
  /** Monotonic id for each static solve; bumped on every dispatch and on
   *  `stop()`, so a worker reply for a superseded run is dropped. */
  solveToken = 0;
  /** In-flight static solves keyed by token. The `input` is retained so a
   *  worker `onerror` can complete the run via the synchronous fallback. */
  pendingSolves = /* @__PURE__ */ new Map();
  constructor(opts = {}) {
    super(opts);
    this.opts = opts;
  }
  /**
   * Merge a force-options patch (deep, so `{ charge: { strength } }` keeps the
   * other charge fields) and re-run the simulation so the change takes effect
   * live — including a switch of `animate` (live ⇄ static) or a re-heat while the
   * graph sits idle after its first settle. Re-applies whenever the layout has a
   * layer to run against (`lastLayer`), matching the one-shot layouts; before the
   * first `apply()` there's nothing to re-run, so it just stores the patch.
   * Called by `Canvas.update({ layouts: { id: patch } })`.
   */
  setOptions(patch) {
    this.opts = mergeDeep(this.opts, patch);
    if (this.lastLayer) void this.apply(this.lastLayer);
  }
  /** Snapshot of the current (merged) force options — seeds a settings editor. */
  getOptions() {
    return this.opts;
  }
  /**
   * Run the layout against `layer`. Resolves when the simulation settles
   * naturally OR is cancelled via `stop()` / a second `apply()` call.
   * Lifecycle events (`start` / `tick` / `end`) fire around the run.
   */
  apply(layer, run = {}) {
    this.stop();
    this.lastLayer = layer;
    this.runOptions = run;
    return this.opts.animate === false ? this.runStatic(layer) : this.runLive(layer);
  }
  /**
   * Static settle (`animate: false`): snapshot the store straight into a flat,
   * transferable solve input, run it to convergence OFF the main thread in a
   * Web Worker (synchronous fallback when none), and commit the settled
   * positions in one paint. Holds NO live-interaction state — `nodeById` /
   * `pinnedIds` / `draggedIds` belong to {@link runLive}; this path never drags,
   * pins, or reheats. Snapshot → solve → commit, with nothing to tear down:
   * a superseding `apply()` calls `stop()`, which owns teardown and the
   * staleness `end`.
   */
  /**
   * Per-node collide radius derived from the node's render footprint —
   * `max(width, height) / 2`, the tightest circle covering the node's larger
   * extent so rectangular / composite cards don't overlap on their dominant axis.
   *
   * Size comes from {@link GraphLayer.boundsOfNode}, which computes the shape's
   * bounds **on demand** from its geometry spec (`boundsOf`) — a pure
   * calculation that does *not* need the node to have rendered yet. That matters
   * for the very first run: the active layout initialises `forceCollide` (which
   * reads + caches each radius **once**) before the frame-coalesced flush has
   * drawn anything, so the cached `GraphNode.boundingBox` is still empty and
   * every card would otherwise fall back to `1` and settle overlapping. Order:
   * on-demand bounds → cached `boundingBox` → `1` (d3's default). Used only when
   * `collide.radius` is unset; an explicit number / function still wins.
   */
  collideRadius(node) {
    const b = this.lastLayer?.boundsOfNode(node) ?? node.boundingBox;
    return b ? Math.max(b.width, b.height) / 2 : 1;
  }
  async runStatic(layer) {
    const store = layer.store;
    const { ids, input } = this.snapshotStatic(layer);
    if (input.count === 0) return;
    this.running = true;
    this.events.emit("start", {
      nodeCount: input.count,
      edgeCount: input.links.length / 2,
      animate: false
    });
    const anchorId = this.runOptions.anchorNodeId;
    const anchorIdx = anchorId !== void 0 && !input.fixed.includes(1) ? anchorIndices(layer, anchorId, ids) : [];
    const before = centroid(input.positions, anchorIdx, input.seeded);
    const token = ++this.solveToken;
    const positions = await this.dispatchSolve(input, token);
    if (token !== this.solveToken) return;
    if (before) {
      const after = centroid(positions, anchorIdx);
      if (after) {
        const dx = before.x - after.x;
        const dy = before.y - after.y;
        for (let j = 0; j < positions.length; j += 2) {
          positions[j] = positions[j] + dx;
          positions[j + 1] = positions[j + 1] + dy;
        }
      }
    }
    this.writing = true;
    store.setPositionsBulk(ids, positions);
    this.writing = false;
    this.running = false;
    this.events.emit("tick", {});
    this.events.emit("end", { reason: "completed" });
  }
  /**
   * Assign each placed node a cluster group index for the `cluster` force: a
   * **member** (its parent is a placed group) → that group; a **container**
   * (a placed group with ≥1 placed child) → its own id. Ungrouped nodes are
   * absent from the map. Returns `null` when clustering is off or nothing
   * groups. Shared by the live and static paths (both build a placed-id set).
   *
   * Only nodes whose resolved style carries `group` count as containers.
   * `parentId` is the shared hierarchy field — it carries plain trees too — so
   * clustering on it alone would drag every parent's children into a blob and
   * fight whatever structure the tree was expressing.
   */
  clusterIndices(layer, placed) {
    if (!this.opts.cluster) return null;
    const store = layer.store;
    const isGroup = (id) => {
      const node = store.getNode(id);
      return node ? layer.isGroupNode(node) : false;
    };
    const byGroup = /* @__PURE__ */ new Map();
    const out = /* @__PURE__ */ new Map();
    for (const id of placed) {
      const node = store.getNode(id);
      let key;
      if (node?.parentId && placed.has(node.parentId) && isGroup(node.parentId)) {
        key = node.parentId;
      } else if (isGroup(id)) {
        for (const child of store.childrenOf(id)) {
          if (placed.has(child)) {
            key = id;
            break;
          }
        }
      }
      if (key === void 0) continue;
      let ci = byGroup.get(key);
      if (ci === void 0) {
        ci = byGroup.size;
        byGroup.set(key, ci);
      }
      out.set(id, ci);
    }
    return out.size > 0 ? out : null;
  }
  /**
   * Read the store into a transferable {@link ForceSolveInput} using only
   * locals — no instance maps. `collide.radius` (number or function) is resolved
   * per node here; un-positioned nodes are left un-`seeded` so the solver
   * phyllotaxis-scatters them apart. An incremental add (some nodes already
   * settled) reheats to `reheatAlpha` for stability; the first run uses `alpha`.
   */
  snapshotStatic(layer) {
    const store = layer.store;
    const includeHidden = this.opts.includeHidden === true;
    const nodeList = [...store.nodes()].filter((n) => isPlaceableNode(layer, n, includeHidden));
    const count = nodeList.length;
    const ids = new Array(count);
    const positions = new Float32Array(count * 2);
    const seeded = new Uint8Array(count);
    const fixed = new Uint8Array(count);
    const indexOf = /* @__PURE__ */ new Map();
    let seededCount = 0;
    for (let i = 0; i < count; i++) {
      const n = nodeList[i];
      ids[i] = n.id;
      indexOf.set(n.id, i);
      const pos = store.getPosition(n.id);
      if (n.pinned) {
        positions[i * 2] = pos?.x ?? 0;
        positions[i * 2 + 1] = pos?.y ?? 0;
        seeded[i] = 1;
        fixed[i] = 1;
        seededCount++;
      } else if (pos && (pos.x !== 0 || pos.y !== 0)) {
        positions[i * 2] = pos.x;
        positions[i * 2 + 1] = pos.y;
        seeded[i] = 1;
        seededCount++;
      }
    }
    const edges = collectLayoutEdges(layer, new Set(ids));
    const linkPairs = new Uint32Array(edges.length * 2);
    let w = 0;
    for (const e of edges) {
      const s = indexOf.get(e.source);
      const t = indexOf.get(e.target);
      if (s === void 0 || t === void 0) continue;
      linkPairs[w++] = s;
      linkPairs[w++] = t;
    }
    let radii = null;
    const collide = this.opts.collide;
    if (collide !== void 0) {
      radii = new Float32Array(count);
      const r = collide.radius;
      if (typeof r === "function") {
        for (let i = 0; i < count; i++) radii[i] = r(nodeList[i]);
      } else if (typeof r === "number") {
        radii.fill(r);
      } else {
        for (let i = 0; i < count; i++) radii[i] = this.collideRadius(nodeList[i]);
      }
    }
    let clusters = null;
    const clusterMap = this.clusterIndices(layer, new Set(ids));
    if (clusterMap) {
      clusters = new Int32Array(count).fill(-1);
      for (let i = 0; i < count; i++) {
        const ci = clusterMap.get(ids[i]);
        if (ci !== void 0) clusters[i] = ci;
      }
    }
    const alpha = seededCount === 0 ? this.opts.alpha ?? 1 : this.opts.reheatAlpha ?? 0.5;
    const { center, x, y, radial } = this.opts;
    let effectiveCenter = center;
    if (center === void 0 && x === void 0 && y === void 0 && radial === void 0) {
      const placed = seededCentroid(positions, seeded);
      if (placed) effectiveCenter = { x: placed.x, y: placed.y };
    }
    const params = {
      link: this.opts.link,
      charge: this.opts.charge,
      center: effectiveCenter,
      collide: collide ? { strength: collide.strength, iterations: collide.iterations } : void 0,
      x: this.opts.x,
      y: this.opts.y,
      radial: this.opts.radial,
      cluster: this.opts.cluster,
      separateGroups: this.opts.separateGroups,
      alpha,
      alphaMin: this.opts.alphaMin,
      alphaDecay: this.opts.alphaDecay,
      alphaTarget: this.opts.alphaTarget,
      velocityDecay: this.opts.velocityDecay
    };
    return {
      ids,
      input: {
        count,
        positions,
        seeded,
        fixed,
        links: w === linkPairs.length ? linkPairs : linkPairs.slice(0, w),
        radii,
        clusters,
        separation: this.separationInput(layer, ids),
        params
      }
    };
  }
  /**
   * Live settle (`animate: true`): d3 owns the tick loop on the main thread;
   * positions write back every tick and external nudges (drag, pin flips,
   * cursor-followers) reheat the running simulation. This is the path that holds
   * the interactive snapshot — `nodeById` (mirror updates onto the datum),
   * `pinnedIds` / `draggedIds` (lock `fx/fy`), `graphNodeById` (per-node force
   * callbacks).
   */
  runLive(layer) {
    const store = layer.store;
    this.nodes = [];
    this.ids = [];
    this.nodeById.clear();
    this.graphNodeById.clear();
    this.pinnedIds.clear();
    this.draggedIds.clear();
    const includeHidden = this.opts.includeHidden === true;
    for (const n of store.nodes()) {
      if (!isPlaceableNode(layer, n, includeHidden)) continue;
      const pos = store.getPosition(n.id);
      const node = { id: n.id };
      if (n.pinned) {
        const px = pos?.x ?? 0;
        const py = pos?.y ?? 0;
        node.fx = px;
        node.fy = py;
        node.x = px;
        node.y = py;
        this.pinnedIds.add(n.id);
      } else if (pos && (pos.x !== 0 || pos.y !== 0)) {
        node.x = pos.x;
        node.y = pos.y;
      }
      this.nodes.push(node);
      this.ids.push(n.id);
      this.nodeById.set(n.id, node);
      this.graphNodeById.set(n.id, n);
    }
    if (this.nodes.length === 0) return Promise.resolve();
    this.buffer = new Float32Array(this.nodes.length * 2);
    const clusterMap = this.clusterIndices(layer, new Set(this.nodeById.keys()));
    if (clusterMap) {
      for (const [id, sim2] of this.nodeById) {
        const ci = clusterMap.get(id);
        if (ci !== void 0) sim2.cluster = ci;
      }
    }
    const links = [];
    for (const e of collectLayoutEdges(layer, new Set(this.nodeById.keys()))) {
      if (!this.nodeById.has(e.source) || !this.nodeById.has(e.target)) continue;
      links.push({ source: e.source, target: e.target });
    }
    this.anchor = null;
    const anchorId = this.runOptions.anchorNodeId;
    if (anchorId !== void 0 && this.pinnedIds.size === 0) {
      const indices = anchorIndices(layer, anchorId, this.ids);
      const seeded = indices.every((i) => this.nodes[i].x !== void 0);
      if (indices.length > 0 && seeded) {
        const c = simCentroid(this.nodes, indices);
        this.anchor = { indices, cx: c.x, cy: c.y };
      }
    }
    const sim = forceSimulation(this.nodes);
    this.configureForces(
      sim,
      links,
      this.separationInput(layer, this.ids),
      placedCentroid(this.nodes)
    );
    this.configureSimulation(sim);
    if (this.runOptions.anchorNodeId !== void 0) sim.alpha(this.opts.reheatAlpha ?? REHEAT_ALPHA);
    this.sim = sim;
    const animate = this.opts.animate ?? true;
    sim.on("tick", () => {
      this.holdAnchor();
      if (animate) this.writeBack(store);
      this.events.emit("tick", {});
    });
    this.unsubscribe = store.events.on("node:update", ({ nodeId, patch }) => {
      if (this.writing) return;
      const node = this.nodeById.get(nodeId);
      if (!node) return;
      if ("pinned" in patch) {
        if (patch.pinned) {
          this.pinnedIds.add(nodeId);
        } else {
          this.pinnedIds.delete(nodeId);
          if (!this.draggedIds.has(nodeId) && node.fx !== void 0) {
            node.fx = void 0;
            node.fy = void 0;
            if (sim.alpha() < REHEAT_ALPHA) sim.alpha(REHEAT_ALPHA).restart();
          }
        }
      }
      if (!patch.position) return;
      if (!this.pinnedIds.has(nodeId) && !this.draggedIds.has(nodeId)) return;
      const { x, y } = patch.position;
      if (node.fx === x && node.fy === y) return;
      node.fx = x;
      node.fy = y;
      node.x = x;
      node.y = y;
      if (sim.alpha() < REHEAT_ALPHA) sim.alpha(REHEAT_ALPHA).restart();
    });
    this.offDragStart = layer.events.on("node:drag-start", ({ nodeId, nodeIds }) => {
      for (const id of nodeIds ?? [nodeId]) {
        const node = this.nodeById.get(id);
        if (!node) continue;
        this.draggedIds.add(id);
        const pos = store.getNode(id)?.position;
        if (pos) {
          node.fx = pos.x;
          node.fy = pos.y;
          node.x = pos.x;
          node.y = pos.y;
        }
      }
      if (sim.alpha() < REHEAT_ALPHA) sim.alpha(REHEAT_ALPHA).restart();
    });
    this.offDragEnd = layer.events.on("node:drag-end", ({ nodeId, nodeIds }) => {
      for (const id of nodeIds ?? [nodeId]) {
        this.draggedIds.delete(id);
        const node = this.nodeById.get(id);
        if (!node) continue;
        if (!this.pinnedIds.has(id)) {
          node.fx = void 0;
          node.fy = void 0;
        }
      }
    });
    this.running = true;
    this.events.emit("start", { nodeCount: this.nodes.length, edgeCount: links.length, animate });
    return new Promise((resolve) => {
      sim.on("end", () => {
        if (this.running) {
          if (!animate) this.writeBack(store);
          this.running = false;
          this.events.emit("end", { reason: "completed" });
        }
        resolve();
      });
    });
  }
  /**
   * Cancel an in-flight run. No-op when idle.
   *
   * Bumps {@link solveToken} so an in-flight `animate: false` worker solve,
   * when it replies, is recognised as stale and dropped (its positions never
   * reach the store). The `animate: true` live simulation is stopped directly.
   * The worker itself is kept alive for reuse.
   */
  stop() {
    const wasRunning = this.running;
    this.running = false;
    this.solveToken++;
    this.sim?.stop();
    this.sim = null;
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.offDragStart?.();
    this.offDragStart = null;
    this.offDragEnd?.();
    this.offDragEnd = null;
    this.anchor = null;
    this.nodes = [];
    this.ids = [];
    this.nodeById.clear();
    this.graphNodeById.clear();
    this.pinnedIds.clear();
    this.draggedIds.clear();
    if (wasRunning) this.events.emit("end", { reason: "stopped" });
  }
  // ─── Static-settle (animate: false) helpers ───────────────────────────────
  /**
   * Dispatch a static solve to the worker, resolving with the settled
   * positions. Falls back to a synchronous solve on the main thread when no
   * worker is available. The `input` is retained (not transferred) so a worker
   * `onerror` can still complete the run synchronously.
   */
  dispatchSolve(input, token) {
    const worker = this.getWorker();
    if (!worker) return Promise.resolve(solveForces(input));
    return new Promise((resolve) => {
      this.pendingSolves.set(token, { resolve, input });
      worker.postMessage({ token, input });
    });
  }
  /**
   * Lazily construct (and memoise) the solver worker. Returns `null` — caller
   * uses the synchronous fallback — when no `Worker` global exists or
   * construction throws. A worker runtime error marks it permanently broken and
   * completes any in-flight solves synchronously.
   */
  getWorker() {
    if (this.workerBroken) return null;
    if (this.worker) return this.worker;
    if (typeof Worker === "undefined") {
      this.workerBroken = true;
      return null;
    }
    try {
      const factory = this.opts.workerFactory ?? defaultForceWorkerFactory;
      const worker = factory();
      worker.onmessage = (event) => {
        const pending = this.pendingSolves.get(event.data.token);
        if (!pending) return;
        this.pendingSolves.delete(event.data.token);
        pending.resolve(event.data.positions);
      };
      worker.onerror = () => {
        this.workerBroken = true;
        this.worker = null;
        for (const [, pending] of this.pendingSolves) pending.resolve(solveForces(pending.input));
        this.pendingSolves.clear();
      };
      this.worker = worker;
      return worker;
    } catch {
      this.workerBroken = true;
      return null;
    }
  }
  // ─── Configuration ─────────────────────────────────────────────────────
  configureForces(sim, links, separation, placed) {
    const { link, charge, center, collide, x, y, radial, cluster, separateGroups } = this.opts;
    if (link !== void 0) {
      const force = forceLink(links).id((d) => d.id);
      if (link.distance !== void 0) force.distance(link.distance);
      if (link.strength !== void 0) force.strength(link.strength);
      if (link.iterations !== void 0) force.iterations(link.iterations);
      sim.force("link", force);
    }
    if (charge !== void 0) {
      const force = forceManyBody();
      if (charge.strength !== void 0) force.strength(charge.strength);
      if (charge.theta !== void 0) force.theta(charge.theta);
      if (charge.distanceMin !== void 0) force.distanceMin(charge.distanceMin);
      if (charge.distanceMax !== void 0) force.distanceMax(charge.distanceMax);
      sim.force("charge", force);
    }
    if (center !== void 0) {
      const force = forceCenter(center.x ?? 0, center.y ?? 0);
      if (center.strength !== void 0) force.strength(center.strength);
      sim.force("center", force);
    } else if (x === void 0 && y === void 0 && radial === void 0) {
      sim.force("center", forceCenter(placed?.x ?? 0, placed?.y ?? 0));
    }
    if (collide !== void 0) {
      const force = forceCollide();
      if (collide.radius !== void 0) {
        if (typeof collide.radius === "function") {
          const fn = collide.radius;
          const refs = this.graphNodeById;
          force.radius((d) => {
            const node = refs.get(d.id);
            return node ? fn(node) : 0;
          });
        } else {
          force.radius(collide.radius);
        }
      } else {
        const refs = this.graphNodeById;
        force.radius((d) => {
          const node = refs.get(d.id);
          return node ? this.collideRadius(node) : 0;
        });
      }
      if (collide.strength !== void 0) force.strength(collide.strength);
      if (collide.iterations !== void 0) force.iterations(collide.iterations);
      sim.force("collide", force);
    }
    if (x !== void 0) {
      const force = forceX();
      if (x.x !== void 0) force.x(x.x);
      if (x.strength !== void 0) force.strength(x.strength);
      sim.force("x", force);
    }
    if (y !== void 0) {
      const force = forceY();
      if (y.y !== void 0) force.y(y.y);
      if (y.strength !== void 0) force.strength(y.strength);
      sim.force("y", force);
    }
    if (radial !== void 0) {
      const force = forceRadial(radial.radius, radial.x ?? 0, radial.y ?? 0);
      if (radial.strength !== void 0) force.strength(radial.strength);
      sim.force("radial", force);
    }
    if (cluster !== void 0) {
      sim.force(
        "cluster",
        makeClusterForce(
          (n) => n.cluster ?? -1,
          cluster.strength ?? DEFAULT_CLUSTER_STRENGTH
        )
      );
    }
    if (separation && separateGroups !== void 0) {
      sim.force(
        "separateGroups",
        makeGroupSeparationForce(
          separation,
          separateGroups.strength ?? DEFAULT_SEPARATION_STRENGTH,
          separateGroups.padding ?? DEFAULT_SEPARATION_PADDING
        )
      );
    }
  }
  /**
   * Build the box membership for the `separateGroups` force over the placed
   * nodes `ids` (in sim order). Each node's box is its **outermost** placed
   * group ancestor, or itself when it has none; a group frame whose members are
   * placed is a box sized from those members plus the frame's insets
   * (`groupInsets` — the helper ELK sizes containers with), and its own node
   * does not count toward the bounds. Returns `null` when the option is off or
   * no box is a group.
   *
   * Nested frames are approximated: the outer box is sized from all its placed
   * descendants plus the **outer** insets only, so an inner frame's padding is
   * not added. Fine for separation between top-level frames, which is all this
   * force does.
   */
  separationInput(layer, ids) {
    if (!this.opts.separateGroups) return null;
    const store = layer.store;
    const placed = new Set(ids);
    const isGroup = (id) => {
      const node = store.getNode(id);
      return node ? layer.isGroupNode(node) : false;
    };
    const hasPlacedChild = (id) => {
      for (const child of store.childrenOf(id)) if (placed.has(child)) return true;
      return false;
    };
    const ownerOf = (id) => {
      let owner = id;
      let cur = store.getNode(id);
      const seen = /* @__PURE__ */ new Set([id]);
      while (cur?.parentId && !seen.has(cur.parentId)) {
        seen.add(cur.parentId);
        if (placed.has(cur.parentId) && isGroup(cur.parentId)) owner = cur.parentId;
        cur = store.getNode(cur.parentId);
      }
      return owner;
    };
    const count = ids.length;
    const boxIndex = /* @__PURE__ */ new Map();
    const boxOf = new Int32Array(count);
    const halfSize = new Float32Array(count * 2);
    const counts = new Uint8Array(count);
    const owners = [];
    for (let i = 0; i < count; i++) {
      const id = ids[i];
      const owner = ownerOf(id);
      let b = boxIndex.get(owner);
      if (b === void 0) {
        b = owners.length;
        boxIndex.set(owner, b);
        owners.push(owner);
      }
      boxOf[i] = b;
      const frame = isGroup(id) && hasPlacedChild(id);
      counts[i] = frame ? 0 : 1;
      const node = store.getNode(id);
      const bounds = node ? layer.boundsOfNode(node) ?? node.boundingBox : void 0;
      halfSize[i * 2] = (bounds?.width ?? 0) / 2;
      halfSize[i * 2 + 1] = (bounds?.height ?? 0) / 2;
    }
    const boxCount = owners.length;
    const insets = new Float32Array(boxCount * 4);
    const groupFlags = new Uint8Array(boxCount);
    let anyGroup = false;
    for (let b = 0; b < boxCount; b++) {
      const owner = owners[b];
      const node = store.getNode(owner);
      if (!node || !isGroup(owner) || !hasPlacedChild(owner)) continue;
      const inset = groupInsets(layer, node);
      insets[b * 4] = inset.top;
      insets[b * 4 + 1] = inset.right;
      insets[b * 4 + 2] = inset.bottom;
      insets[b * 4 + 3] = inset.left;
      groupFlags[b] = 1;
      anyGroup = true;
    }
    return anyGroup ? { boxCount, boxOf, halfSize, counts, insets, isGroup: groupFlags } : null;
  }
  configureSimulation(sim) {
    const { alpha, alphaMin, alphaDecay, alphaTarget, velocityDecay } = this.opts;
    if (alpha !== void 0) sim.alpha(alpha);
    if (alphaMin !== void 0) sim.alphaMin(alphaMin);
    if (alphaDecay !== void 0) sim.alphaDecay(alphaDecay);
    if (alphaTarget !== void 0) sim.alphaTarget(alphaTarget);
    if (velocityDecay !== void 0) sim.velocityDecay(velocityDecay);
  }
  /**
   * Translate every free sim node so the anchor's centroid is back where the
   * run started — the per-tick half of {@link LayoutRunOptions.anchorNodeId}.
   * Paused while a node is being dragged: the dragged node is held by `fx/fy`,
   * and shifting the rest would slide them out from under the cursor.
   */
  holdAnchor() {
    const anchor = this.anchor;
    if (!anchor || this.draggedIds.size > 0) return;
    const c = simCentroid(this.nodes, anchor.indices);
    const dx = anchor.cx - c.x;
    const dy = anchor.cy - c.y;
    if (dx === 0 && dy === 0) return;
    for (const n of this.nodes) {
      if (n.fx != null) continue;
      n.x = (n.x ?? 0) + dx;
      n.y = (n.y ?? 0) + dy;
    }
  }
  writeBack(store) {
    const { nodes, buffer } = this;
    for (let i = 0, j = 0; i < nodes.length; i++, j += 2) {
      buffer[j] = nodes[i].x;
      buffer[j + 1] = nodes[i].y;
    }
    this.writing = true;
    store.setPositionsBulk(this.ids, buffer);
    this.writing = false;
  }
};
function defaultForceWorkerFactory() {
  return new Worker(new URL("./forceSolver.worker.js", import.meta.url), { type: "module" });
}
function mergeDeep(base, patch) {
  const isObj = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
  if (!isObj(base) || !isObj(patch)) return patch;
  const out = { ...base };
  for (const [k, v] of Object.entries(patch)) {
    if (k === "__proto__" || k === "constructor" || k === "prototype") continue;
    out[k] = isObj(v) && isObj(out[k]) ? mergeDeep(out[k], v) : v;
  }
  return out;
}
function anchorIndices(layer, anchorId, ids) {
  const indexOf = /* @__PURE__ */ new Map();
  ids.forEach((id, i) => indexOf.set(id, i));
  const members = [];
  for (const id of layer.store.descendantsOf(anchorId)) {
    const i = indexOf.get(id);
    if (i !== void 0) members.push(i);
  }
  if (members.length > 0) return members;
  const self = indexOf.get(anchorId);
  return self === void 0 ? [] : [self];
}
function centroid(positions, indices, seeded) {
  if (indices.length === 0) return null;
  let x = 0;
  let y = 0;
  for (const i of indices) {
    if (seeded && seeded[i] !== 1) return null;
    x += positions[i * 2];
    y += positions[i * 2 + 1];
  }
  return { x: x / indices.length, y: y / indices.length };
}
function seededCentroid(positions, seeded) {
  let x = 0;
  let y = 0;
  let n = 0;
  for (let i = 0; i < seeded.length; i++) {
    if (seeded[i] !== 1) continue;
    x += positions[i * 2];
    y += positions[i * 2 + 1];
    n++;
  }
  return n === 0 ? null : { x: x / n, y: y / n };
}
function placedCentroid(nodes) {
  let x = 0;
  let y = 0;
  let n = 0;
  for (const node of nodes) {
    if (node.x === void 0 || node.y === void 0) continue;
    x += node.x;
    y += node.y;
    n++;
  }
  return n === 0 ? null : { x: x / n, y: y / n };
}
function simCentroid(nodes, indices) {
  let x = 0;
  let y = 0;
  for (const i of indices) {
    x += nodes[i].x ?? 0;
    y += nodes[i].y ?? 0;
  }
  return { x: x / indices.length, y: y / indices.length };
}

export { D3ForceLayout };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map