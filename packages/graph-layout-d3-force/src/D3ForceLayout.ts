/**
 * `D3ForceLayout` — d3-force-directed `Layout` for `@invana/graph`.
 *
 * The flow is intentionally tiny:
 *   1. Snapshot nodes + edges from `layer.store` into d3-force datums.
 *   2. Build a simulation. d3 owns the tick loop.
 *   3. On each tick, bulk-write positions back to the store; the store
 *      emits `node:update` events and the renderer reacts on its own.
 *   4. Listen to external `node:update` (e.g. a drag) and mirror new
 *      positions onto the sim, reheating α so neighbours readjust.
 *
 * Every option defaults to `undefined`. A force is only added when its
 * option is provided; a setter is only called when its sub-option is
 * provided. d3-force's own defaults apply otherwise. See `./types`.
 *
 * @example
 * const layout = new D3ForceLayout({
 *   charge: { strength: -300 },
 *   link: { distance: 80 },
 *   center: { x: 0, y: 0 },
 * });
 * await layout.apply(graphLayer);
 */

import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceRadial,
  forceSimulation,
  forceX,
  forceY,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from 'd3-force';

import { Layout, type LayoutOptions } from '@invana/canvas';
import type { GraphLayer, GraphNode } from '@invana/graph';

import type { D3ForceLayoutOptions } from './types';
import {
  solveForces,
  makeClusterForce,
  DEFAULT_CLUSTER_STRENGTH,
  type ForceSolveInput,
  type ForceSolveParams,
  type ForceSolveRequest,
  type ForceSolveResponse,
} from './forceSolver';

interface SimNode extends SimulationNodeDatum {
  id: string;
  /** Group index for the clustering force (`cluster` option). Unset = ungrouped. */
  cluster?: number;
}
interface SimLink extends SimulationLinkDatum<SimNode> {}

/** α target re-applied when an external `node:update` arrives. */
const REHEAT_ALPHA = 0.3;

export class D3ForceLayout extends Layout<GraphLayer> {
  private opts: D3ForceLayoutOptions;
  /** Last layer `apply()` ran against — so `setOptions` can re-heat it live. */
  private lastLayer: GraphLayer | null = null;
  private sim: Simulation<SimNode, SimLink> | null = null;
  private nodes: SimNode[] = [];
  private ids: string[] = [];
  private nodeById = new Map<string, SimNode>();
  /** GraphNode snapshot indexed by id — used by per-node force callbacks
   *  (e.g. `collide.radius(d => ...)`) without coupling SimNode to GraphNode. */
  private graphNodeById = new Map<string, GraphNode>();
  /** Ids of nodes whose `GraphNode.pinned === true` — permanent pins from
   *  user data. Driven via d3-force's `fx/fy` so the simulation keeps them
   *  fixed. Live: pin/unpin patches on `node:update` add/remove entries. */
  private pinnedIds = new Set<string>();
  /** Ids of nodes currently being dragged by a user behaviour. Populated
   *  on `node:drag-start` from the layer, drained on `node:drag-end`. While
   *  an id is in this set, position updates mirror onto `fx/fy` so the
   *  simulation can't push the node away from the cursor. On drag-end the
   *  transient `fx/fy` clears (unless the node is also in `pinnedIds`,
   *  which is the permanent-pin path). Decoupled from `pinned` so a drag
   *  never mutates user-data semantics — pin-on-release is opt-in via a
   *  separate behaviour. */
  private draggedIds = new Set<string>();
  private buffer = new Float32Array(0);
  /** True while our own bulk write is in-flight, so the `node:update`
   *  events it triggers don't bounce back into the sim. Relies on the
   *  store's default sync flush firing events inside the bulk call. */
  private writing = false;
  private unsubscribe: (() => void) | null = null;
  private offDragStart: (() => void) | null = null;
  private offDragEnd: (() => void) | null = null;
  /** True while a run is active. Guards `stop()` so it only emits `end`
   *  once per run, even if called externally after a natural settle. */
  private running = false;

  // ─── `animate: false` static-settle worker ────────────────────────────────
  /** Lazily-created solver worker, reused for the instance's lifetime. */
  private worker: Worker | null = null;
  /** Sticky flag: no `Worker` global, or construction/runtime failed → always
   *  use the synchronous fallback. */
  private workerBroken = false;
  /** Monotonic id for each static solve; bumped on every dispatch and on
   *  `stop()`, so a worker reply for a superseded run is dropped. */
  private solveToken = 0;
  /** In-flight static solves keyed by token. The `input` is retained so a
   *  worker `onerror` can complete the run via the synchronous fallback. */
  private pendingSolves = new Map<
    number,
    { resolve: (positions: Float32Array) => void; input: ForceSolveInput }
  >();

  constructor(opts: D3ForceLayoutOptions & LayoutOptions = {}) {
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
  override setOptions(patch: Partial<D3ForceLayoutOptions>): void {
    this.opts = mergeDeep(this.opts, patch);
    if (this.lastLayer) void this.apply(this.lastLayer);
  }

  /** Snapshot of the current (merged) force options — seeds a settings editor. */
  getOptions(): Readonly<D3ForceLayoutOptions> {
    return this.opts;
  }

  /**
   * Run the layout against `layer`. Resolves when the simulation settles
   * naturally OR is cancelled via `stop()` / a second `apply()` call.
   * Lifecycle events (`start` / `tick` / `end`) fire around the run.
   */
  apply(layer: GraphLayer): Promise<void> {
    this.stop();
    this.lastLayer = layer;
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
   * Per-node collide radius derived from the node's cached render bounds
   * ({@link GraphNode.boundingBox}, written by the layer after each draw) —
   * `max(width, height) / 2`, the tightest circle covering the node's larger
   * extent so rectangular cards don't overlap on their dominant axis. Falls
   * back to `1` (d3's default) before the node has rendered once. Used only when
   * `collide.radius` is unset; an explicit number / function still wins.
   */
  private collideRadius(node: GraphNode): number {
    const b = node.boundingBox;
    return b ? Math.max(b.width, b.height) / 2 : 1;
  }

  private async runStatic(layer: GraphLayer): Promise<void> {
    const store = layer.store;
    const { ids, input } = this.snapshotStatic(store);
    if (input.count === 0) return;

    this.running = true;
    this.events.emit('start', {
      nodeCount: input.count,
      edgeCount: input.links.length / 2,
      animate: false,
    });

    const token = ++this.solveToken;
    const positions = await this.dispatchSolve(input, token);

    // A newer `apply()` / `stop()` superseded this run while the worker solved
    // (it bumped `solveToken` and emitted its own `end`) — drop the result.
    if (token !== this.solveToken) return;

    this.writing = true;
    store.setPositionsBulk(ids, positions);
    this.writing = false;

    this.running = false;
    this.events.emit('tick', {});
    this.events.emit('end', { reason: 'completed' });
  }

  /**
   * Assign each placed node a cluster group index for the `cluster` force: a
   * **member** (its `parentId` is placed) → that parent's group; a **container**
   * (has ≥1 placed child) → its own id. Ungrouped nodes are absent from the map.
   * Returns `null` when clustering is off or nothing groups. Shared by the live
   * and static paths (both build a placed-id set).
   */
  private clusterIndices(
    store: GraphLayer['store'],
    placed: Set<string>,
  ): Map<string, number> | null {
    if (!this.opts.cluster) return null;
    const byGroup = new Map<string, number>();
    const out = new Map<string, number>();
    for (const id of placed) {
      const node = store.getNode(id);
      let key: string | undefined;
      if (node?.parentId && placed.has(node.parentId)) {
        key = node.parentId;
      } else {
        for (const child of store.childrenOf(id)) {
          if (placed.has(child)) {
            key = id;
            break;
          }
        }
      }
      if (key === undefined) continue;
      let ci = byGroup.get(key);
      if (ci === undefined) {
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
  private snapshotStatic(store: GraphLayer['store']): { ids: string[]; input: ForceSolveInput } {
    // Exclude explicitly-hidden nodes (unless `includeHidden`); their incident
    // edges drop out below (endpoints missing from `indexOf`).
    const includeHidden = this.opts.includeHidden === true;
    const nodeList = includeHidden
      ? [...store.nodes()]
      : [...store.nodes()].filter((n) => n.hidden !== true);
    const count = nodeList.length;
    const ids: string[] = new Array(count);
    const positions = new Float32Array(count * 2);
    const seeded = new Uint8Array(count);
    const fixed = new Uint8Array(count);
    const indexOf = new Map<string, number>();
    let seededCount = 0;
    for (let i = 0; i < count; i++) {
      const n = nodeList[i]!;
      ids[i] = n.id;
      indexOf.set(n.id, i);
      const pos = store.getPosition(n.id);
      if (n.pinned) {
        // Pinned → a fixed point (fx/fy), still seeded so neighbours feel it.
        positions[i * 2] = pos?.x ?? 0;
        positions[i * 2 + 1] = pos?.y ?? 0;
        seeded[i] = 1;
        fixed[i] = 1;
        seededCount++;
      } else if (pos && (pos.x !== 0 || pos.y !== 0)) {
        // Real stored position. (0, 0) is the column default; leaving it
        // un-seeded lets the solver scatter colocated nodes apart.
        positions[i * 2] = pos.x;
        positions[i * 2 + 1] = pos.y;
        seeded[i] = 1;
        seededCount++;
      }
    }

    const edges = [...store.edges()];
    const linkPairs = new Uint32Array(edges.length * 2);
    let w = 0;
    for (const e of edges) {
      const s = indexOf.get(e.source);
      const t = indexOf.get(e.target);
      if (s === undefined || t === undefined) continue;
      linkPairs[w++] = s;
      linkPairs[w++] = t;
    }

    let radii: Float32Array | null = null;
    const collide = this.opts.collide;
    if (collide !== undefined) {
      radii = new Float32Array(count);
      const r = collide.radius;
      if (typeof r === 'function') {
        for (let i = 0; i < count; i++) radii[i] = r(nodeList[i]!);
      } else if (typeof r === 'number') {
        radii.fill(r);
      } else {
        // Unset → derive each node's radius from its cached render bounds.
        for (let i = 0; i < count; i++) radii[i] = this.collideRadius(nodeList[i]!);
      }
    }

    // Group clustering — resolve each node's group index into a transferable
    // typed array (null when clustering is off / nothing groups).
    let clusters: Int32Array | null = null;
    const clusterMap = this.clusterIndices(store, new Set(ids));
    if (clusterMap) {
      clusters = new Int32Array(count).fill(-1);
      for (let i = 0; i < count; i++) {
        const ci = clusterMap.get(ids[i]!);
        if (ci !== undefined) clusters[i] = ci;
      }
    }

    const alpha = seededCount === 0 ? this.opts.alpha ?? 1 : this.opts.reheatAlpha ?? 0.5;
    const params: ForceSolveParams = {
      link: this.opts.link,
      charge: this.opts.charge,
      center: this.opts.center,
      collide: collide ? { strength: collide.strength, iterations: collide.iterations } : undefined,
      x: this.opts.x,
      y: this.opts.y,
      radial: this.opts.radial,
      cluster: this.opts.cluster,
      alpha,
      alphaMin: this.opts.alphaMin,
      alphaDecay: this.opts.alphaDecay,
      alphaTarget: this.opts.alphaTarget,
      velocityDecay: this.opts.velocityDecay,
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
        params,
      },
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
  private runLive(layer: GraphLayer): Promise<void> {
    const store = layer.store;

    // 1. Snapshot store → sim datums + interactive lookup maps.
    this.nodes = [];
    this.ids = [];
    this.nodeById.clear();
    this.graphNodeById.clear();
    this.pinnedIds.clear();
    this.draggedIds.clear();
    // Exclude explicitly-hidden nodes (unless `includeHidden`) from the live sim.
    const includeHidden = this.opts.includeHidden === true;
    for (const n of store.nodes()) {
      if (!includeHidden && n.hidden === true) continue;
      const pos = store.getPosition(n.id);
      const node: SimNode = { id: n.id };
      if (n.pinned) {
        // Pinned nodes use d3-force's `fx/fy` so the sim treats them as
        // immovable but still applies their forces to neighbours
        // (e.g. a cursor-follower that pushes other nodes via collide).
        const px = pos?.x ?? 0;
        const py = pos?.y ?? 0;
        node.fx = px;
        node.fy = py;
        node.x = px;
        node.y = py;
        this.pinnedIds.add(n.id);
      } else if (pos && (pos.x !== 0 || pos.y !== 0)) {
        // Only seed if the store has a real position. (0, 0) is treated as
        // the typed-array default; leaving x/y `undefined` lets
        // `forceSimulation` phyllotaxis-scatter the cluster — without it,
        // all-colocated nodes can't break their tie under d3 defaults.
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

    // Tag each grouped node with its cluster index for the `cluster` force.
    const clusterMap = this.clusterIndices(store, new Set(this.nodeById.keys()));
    if (clusterMap) {
      for (const [id, sim] of this.nodeById) {
        const ci = clusterMap.get(id);
        if (ci !== undefined) sim.cluster = ci;
      }
    }

    const links: SimLink[] = [];
    for (const e of store.edges()) {
      // Drop links to excluded (hidden) nodes — d3-force errors on a link that
      // references an id absent from the node set.
      if (!this.nodeById.has(e.source) || !this.nodeById.has(e.target)) continue;
      links.push({ source: e.source, target: e.target });
    }

    // 2. Build the live (`animate: true`) simulation — d3 owns the tick loop.
    const sim = forceSimulation<SimNode, SimLink>(this.nodes);
    this.configureForces(sim, links);
    this.configureSimulation(sim);
    this.sim = sim;

    // 3. Each d3 tick → optionally bulk write to store + emit lifecycle
    //    `tick`. When `animate` is `false` we skip the per-tick store
    //    writeback (and the renderer storm that follows) and defer to a
    //    single writeback in the natural-end handler below — see
    //    `D3ForceLayoutOptions.animate` for the rationale.
    const animate = this.opts.animate ?? true;
    sim.on('tick', () => {
      if (animate) this.writeBack(store);
      this.events.emit('tick', {});
    });

    // 4. External writes (drag, cursor-follower, etc.) → mirror onto sim,
    //    reheat. Nodes that are either permanently pinned (`pinnedIds`,
    //    user-data semantics) or transiently locked by an in-flight drag
    //    (`draggedIds`, signalled by `node:drag-start` / `node:drag-end`
    //    on the layer's events) write to `fx/fy` so the simulation can't
    //    push them away from the supplied position. Otherwise the update
    //    flows into `x/y` and the next force tick may move the node.
    //
    //    Pin patches are tracked live so a mid-run flip (e.g. a feed
    //    enabling `pinned: true` on a node) takes effect on the next
    //    `node:update` without needing a fresh `apply()`.
    this.unsubscribe = store.events.on('node:update', ({ nodeId, patch }) => {
      if (this.writing) return;
      const node = this.nodeById.get(nodeId);
      if (!node) return;

      if ('pinned' in patch) {
        if (patch.pinned) this.pinnedIds.add(nodeId);
        else this.pinnedIds.delete(nodeId);
      }

      if (!patch.position) return;
      const locked =
        this.pinnedIds.has(nodeId) || this.draggedIds.has(nodeId);
      if (locked) {
        node.fx = patch.position.x;
        node.fy = patch.position.y;
        // Mirror onto `x/y` so rendered position matches before the next
        // force tick — `forceCenter`/`forceX`/`forceY` read `x/y`.
        node.x = patch.position.x;
        node.y = patch.position.y;
      } else {
        // Free node: ensure no stale `fx/fy` are holding it.
        if (node.fx !== undefined) node.fx = undefined as unknown as number;
        if (node.fy !== undefined) node.fy = undefined as unknown as number;
        node.x = patch.position.x;
        node.y = patch.position.y;
      }
      if (sim.alpha() < REHEAT_ALPHA) sim.alpha(REHEAT_ALPHA).restart();
    });

    // 4b. Subscribe to drag lifecycle on the layer. `node:drag-start` puts
    //     the node in `draggedIds` (so subsequent position updates lock via
    //     `fx/fy`) and reheats the sim. `node:drag-end` removes it and —
    //     unless the node is also permanently pinned — clears `fx/fy` so
    //     forces can move it again. The store's `pinned` flag is never
    //     touched here; permanent pin-on-release is a separate behaviour's
    //     concern.
    // `nodeIds` carries every primary being dragged (a multi-selection drag
    // moves them all); fall back to `[nodeId]` for safety. Clamp / release
    // each one's `fx/fy` independently.
    this.offDragStart = layer.events.on('node:drag-start', ({ nodeId, nodeIds }) => {
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
    this.offDragEnd = layer.events.on('node:drag-end', ({ nodeId, nodeIds }) => {
      for (const id of nodeIds ?? [nodeId]) {
        this.draggedIds.delete(id);
        const node = this.nodeById.get(id);
        if (!node) continue;
        if (!this.pinnedIds.has(id)) {
          node.fx = undefined as unknown as number;
          node.fy = undefined as unknown as number;
        }
      }
    });

    // 5. Mark run as active and announce `start` after wiring is in place
    //    so handlers see a fully-initialised layout.
    this.running = true;
    this.events.emit('start', { nodeCount: this.nodes.length, edgeCount: links.length, animate });

    // 6. Resolve on natural settle. The `end` emission happens here (not in
    //    `stop()`) so a natural settle reports `reason: 'completed'`;
    //    external `stop()` flips `running` first and emits `'stopped'`.
    return new Promise<void>((resolve) => {
      sim.on('end', () => {
        if (this.running) {
          // `animate: false` runs deferred every per-tick writeback —
          // flush the final settled positions now so the renderer
          // actually sees the layout result.
          if (!animate) this.writeBack(store);
          this.running = false;
          this.events.emit('end', { reason: 'completed' });
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
  stop(): void {
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
    this.nodes = [];
    this.ids = [];
    this.nodeById.clear();
    this.graphNodeById.clear();
    this.pinnedIds.clear();
    this.draggedIds.clear();
    if (wasRunning) this.events.emit('end', { reason: 'stopped' });
  }

  // ─── Static-settle (animate: false) helpers ───────────────────────────────

  /**
   * Dispatch a static solve to the worker, resolving with the settled
   * positions. Falls back to a synchronous solve on the main thread when no
   * worker is available. The `input` is retained (not transferred) so a worker
   * `onerror` can still complete the run synchronously.
   */
  private dispatchSolve(input: ForceSolveInput, token: number): Promise<Float32Array> {
    const worker = this.getWorker();
    if (!worker) return Promise.resolve(solveForces(input));
    return new Promise<Float32Array>((resolve) => {
      this.pendingSolves.set(token, { resolve, input });
      worker.postMessage({ token, input } satisfies ForceSolveRequest);
    });
  }

  /**
   * Lazily construct (and memoise) the solver worker. Returns `null` — caller
   * uses the synchronous fallback — when no `Worker` global exists or
   * construction throws. A worker runtime error marks it permanently broken and
   * completes any in-flight solves synchronously.
   */
  private getWorker(): Worker | null {
    if (this.workerBroken) return null;
    if (this.worker) return this.worker;
    if (typeof Worker === 'undefined') {
      this.workerBroken = true;
      return null;
    }
    try {
      const factory = this.opts.workerFactory ?? defaultForceWorkerFactory;
      const worker = factory();
      worker.onmessage = (event: MessageEvent<ForceSolveResponse>) => {
        const pending = this.pendingSolves.get(event.data.token);
        if (!pending) return; // superseded / unknown token
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

  private configureForces(sim: Simulation<SimNode, SimLink>, links: SimLink[]): void {
    const { link, charge, center, collide, x, y, radial, cluster } = this.opts;

    if (link !== undefined) {
      const force = forceLink<SimNode, SimLink>(links).id((d) => d.id);
      if (link.distance !== undefined) force.distance(link.distance);
      if (link.strength !== undefined) force.strength(link.strength);
      if (link.iterations !== undefined) force.iterations(link.iterations);
      sim.force('link', force);
    }

    if (charge !== undefined) {
      const force = forceManyBody<SimNode>();
      if (charge.strength !== undefined) force.strength(charge.strength);
      if (charge.theta !== undefined) force.theta(charge.theta);
      if (charge.distanceMin !== undefined) force.distanceMin(charge.distanceMin);
      if (charge.distanceMax !== undefined) force.distanceMax(charge.distanceMax);
      sim.force('charge', force);
    }

    if (center !== undefined) {
      const force = forceCenter<SimNode>(center.x ?? 0, center.y ?? 0);
      if (center.strength !== undefined) force.strength(center.strength);
      sim.force('center', force);
    }

    if (collide !== undefined) {
      const force = forceCollide<SimNode>();
      if (collide.radius !== undefined) {
        if (typeof collide.radius === 'function') {
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
        // Unset → derive each node's radius from its cached render bounds.
        const refs = this.graphNodeById;
        force.radius((d) => {
          const node = refs.get(d.id);
          return node ? this.collideRadius(node) : 0;
        });
      }
      if (collide.strength !== undefined) force.strength(collide.strength);
      if (collide.iterations !== undefined) force.iterations(collide.iterations);
      sim.force('collide', force);
    }

    if (x !== undefined) {
      const force = forceX<SimNode>();
      if (x.x !== undefined) force.x(x.x);
      if (x.strength !== undefined) force.strength(x.strength);
      sim.force('x', force);
    }

    if (y !== undefined) {
      const force = forceY<SimNode>();
      if (y.y !== undefined) force.y(y.y);
      if (y.strength !== undefined) force.strength(y.strength);
      sim.force('y', force);
    }

    if (radial !== undefined) {
      const force = forceRadial<SimNode>(radial.radius, radial.x ?? 0, radial.y ?? 0);
      if (radial.strength !== undefined) force.strength(radial.strength);
      sim.force('radial', force);
    }

    // Group clustering — pull nodes toward their group centroid (SimNode.cluster
    // is tagged in `runLive`). Shares the solver's implementation.
    if (cluster !== undefined) {
      sim.force(
        'cluster',
        makeClusterForce<SimNode>(
          (n) => n.cluster ?? -1,
          cluster.strength ?? DEFAULT_CLUSTER_STRENGTH,
        ),
      );
    }
  }

  private configureSimulation(sim: Simulation<SimNode, SimLink>): void {
    const { alpha, alphaMin, alphaDecay, alphaTarget, velocityDecay } = this.opts;
    if (alpha !== undefined) sim.alpha(alpha);
    if (alphaMin !== undefined) sim.alphaMin(alphaMin);
    if (alphaDecay !== undefined) sim.alphaDecay(alphaDecay);
    if (alphaTarget !== undefined) sim.alphaTarget(alphaTarget);
    if (velocityDecay !== undefined) sim.velocityDecay(velocityDecay);
  }

  private writeBack(store: GraphLayer['store']): void {
    const { nodes, buffer } = this;
    for (let i = 0, j = 0; i < nodes.length; i++, j += 2) {
      buffer[j] = nodes[i]!.x!;
      buffer[j + 1] = nodes[i]!.y!;
    }
    this.writing = true;
    store.setPositionsBulk(this.ids, buffer);
    this.writing = false;
  }
}

/**
 * Default solver-worker factory: load this package's bundled worker chunk. The
 * `new Worker(new URL(specifier, import.meta.url))` form is the web-standard
 * pattern that Vite / webpack 5 / Rollup statically detect and rewrite to a
 * bundled worker asset (mirrors `ElkLayout`'s factory). `forceSolver.worker.js`
 * is the second tsup entry (`dist/forceSolver.worker.js`), an ESM module — hence
 * `{ type: 'module' }`. Override via `D3ForceLayoutOptions.workerFactory`.
 */
function defaultForceWorkerFactory(): Worker {
  return new Worker(new URL('./forceSolver.worker.js', import.meta.url), { type: 'module' });
}

/** Deep-merge plain objects; arrays / primitives replace. */
function mergeDeep<T>(base: T, patch: Partial<T>): T {
  const isObj = (v: unknown): v is Record<string, unknown> =>
    typeof v === 'object' && v !== null && !Array.isArray(v);
  if (!isObj(base) || !isObj(patch)) return patch as T;
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(patch)) {
    // Skip prototype-polluting keys from untrusted option patches.
    if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
    out[k] = isObj(v) && isObj(out[k]) ? mergeDeep(out[k], v) : v;
  }
  return out as T;
}
