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

import { Layout } from '@invana/canvas';
import type { GraphLayer, GraphNode } from '@invana/graph';

import type { D3ForceLayoutOptions } from './types';

interface SimNode extends SimulationNodeDatum {
  id: string;
}
interface SimLink extends SimulationLinkDatum<SimNode> {}

/** α target re-applied when an external `node:update` arrives. */
const REHEAT_ALPHA = 0.3;

export class D3ForceLayout extends Layout<GraphLayer> {
  private readonly opts: D3ForceLayoutOptions;
  private sim: Simulation<SimNode, SimLink> | null = null;
  private nodes: SimNode[] = [];
  private ids: string[] = [];
  private nodeById = new Map<string, SimNode>();
  /** GraphNode snapshot indexed by id — used by per-node force callbacks
   *  (e.g. `collide.radius(d => ...)`) without coupling SimNode to GraphNode. */
  private graphNodeById = new Map<string, GraphNode>();
  /** Ids of nodes pinned at snapshot time. Pinned nodes are driven via
   *  d3-force's `fx/fy` so the simulation keeps them fixed; external
   *  `node:update` patches mirror onto `fx/fy` instead of `x/y`. */
  private pinnedIds = new Set<string>();
  private buffer = new Float32Array(0);
  /** True while our own bulk write is in-flight, so the `node:update`
   *  events it triggers don't bounce back into the sim. Relies on the
   *  store's default sync flush firing events inside the bulk call. */
  private writing = false;
  private unsubscribe: (() => void) | null = null;
  /** True while a run is active. Guards `stop()` so it only emits `end`
   *  once per run, even if called externally after a natural settle. */
  private running = false;

  constructor(opts: D3ForceLayoutOptions = {}) {
    super();
    this.opts = opts;
  }

  /**
   * Run the layout against `layer`. Resolves when the simulation settles
   * naturally OR is cancelled via `stop()` / a second `apply()` call.
   * Lifecycle events (`start` / `tick` / `end`) fire around the run.
   */
  async apply(layer: GraphLayer): Promise<void> {
    this.stop();
    const store = layer.store;

    // 1. Snapshot store → sim datums.
    this.nodes = [];
    this.ids = [];
    this.nodeById.clear();
    this.graphNodeById.clear();
    this.pinnedIds.clear();
    for (const n of store.nodes()) {
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
    if (this.nodes.length === 0) return;
    this.buffer = new Float32Array(this.nodes.length * 2);

    const links: SimLink[] = [];
    for (const e of store.edges()) {
      links.push({ source: e.source, target: e.target });
    }

    // 2. Build simulation + apply only options the user provided.
    const sim = forceSimulation<SimNode, SimLink>(this.nodes);
    this.configureForces(sim, links);
    this.configureSimulation(sim);
    this.sim = sim;

    // 3. Each d3 tick → bulk write to store + emit lifecycle `tick`.
    //    Renderer updates via store events; subscribers (camera fits,
    //    progress UI, etc.) drive off the layout's own emitter.
    sim.on('tick', () => {
      this.writeBack(store);
      this.events.emit('tick', {});
    });

    // 4. External writes (drag, cursor-follower, etc.) → mirror onto sim,
    //    reheat. Pinned nodes write to `fx/fy` so the sim keeps holding
    //    them at the new spot instead of letting forces nudge them away.
    this.unsubscribe = store.events.on('node:update', ({ nodeId, patch }) => {
      if (this.writing || !patch.position) return;
      const node = this.nodeById.get(nodeId);
      if (!node) return;
      if (this.pinnedIds.has(nodeId)) {
        node.fx = patch.position.x;
        node.fy = patch.position.y;
      } else {
        node.x = patch.position.x;
        node.y = patch.position.y;
      }
      if (sim.alpha() < REHEAT_ALPHA) sim.alpha(REHEAT_ALPHA).restart();
    });

    // 5. Mark run as active and announce `start` after wiring is in place
    //    so handlers see a fully-initialised layout.
    this.running = true;
    this.events.emit('start', {});

    // 6. Resolve on natural settle. The `end` emission happens here (not in
    //    `stop()`) so a natural settle reports `reason: 'completed'`;
    //    external `stop()` flips `running` first and emits `'stopped'`.
    return new Promise<void>((resolve) => {
      sim.on('end', () => {
        if (this.running) {
          this.running = false;
          this.events.emit('end', { reason: 'completed' });
        }
        resolve();
      });
    });
  }

  /** Cancel an in-flight run. Positions stay in the store. No-op when idle. */
  stop(): void {
    const wasRunning = this.running;
    this.running = false;
    this.sim?.stop();
    this.sim = null;
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.nodes = [];
    this.ids = [];
    this.nodeById.clear();
    this.graphNodeById.clear();
    this.pinnedIds.clear();
    if (wasRunning) this.events.emit('end', { reason: 'stopped' });
  }

  // ─── Configuration ─────────────────────────────────────────────────────

  private configureForces(sim: Simulation<SimNode, SimLink>, links: SimLink[]): void {
    const { link, charge, center, collide, x, y, radial } = this.opts;

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
