/**
 * Pure d3-force solve, shared by the main-thread fallback and the Web Worker
 * (`forceSolver.worker.ts`). No DOM, no `@invana` imports — just numbers in,
 * settled positions out — so it runs identically on either thread.
 *
 * The `animate: false` static-layout path serialises its run into a
 * {@link ForceSolveInput} (every payload is a transferable typed array or a
 * plain params bag — `collide.radius` is pre-resolved to a per-node array so no
 * functions cross the worker boundary) and calls {@link solveForces}.
 */

import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  forceX,
  forceY,
  forceRadial,
  type Simulation,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force';

import type {
  CenterForceOptions,
  ChargeForceOptions,
  LinkForceOptions,
  PositionXForceOptions,
  PositionYForceOptions,
  RadialForceOptions,
} from './types';

interface SolveNode extends SimulationNodeDatum {
  index: number;
}
type SolveLink = SimulationLinkDatum<SolveNode>;

/**
 * Serialisable force parameters. Identical to the public option fields, except
 * `collide` carries no `radius` (pre-resolved into {@link ForceSolveInput.radii})
 * so the payload stays function-free and structured-clone-safe.
 */
export interface ForceSolveParams {
  link?: LinkForceOptions;
  charge?: ChargeForceOptions;
  center?: CenterForceOptions;
  collide?: { strength?: number; iterations?: number };
  x?: PositionXForceOptions;
  y?: PositionYForceOptions;
  radial?: RadialForceOptions;
  /** Group-clustering pull strength (paired with {@link ForceSolveInput.clusters}). */
  cluster?: { strength?: number };
  alpha?: number;
  alphaMin?: number;
  alphaDecay?: number;
  alphaTarget?: number;
  velocityDecay?: number;
}

/** Worker request envelope: a solve plus the run token used to drop stale results. */
export interface ForceSolveRequest {
  token: number;
  input: ForceSolveInput;
}

/** Worker response envelope: settled positions for the matching `token`. */
export interface ForceSolveResponse {
  token: number;
  positions: Float32Array;
}

/** Fully transferable solve input — safe to `postMessage` to a Worker. */
export interface ForceSolveInput {
  /** Node count. */
  count: number;
  /** Seed positions `[x0,y0,x1,y1,…]`; only read where `seeded[i]` is 1. */
  positions: Float32Array;
  /** 1 = node has a real seed position; 0 = let d3 phyllotaxis-scatter it. */
  seeded: Uint8Array;
  /** 1 = node is pinned / dragged (its `fx`/`fy` are locked to the seed). */
  fixed: Uint8Array;
  /** Link endpoints as node indices `[src0,tgt0,src1,tgt1,…]`. */
  links: Uint32Array;
  /** Per-node collide radius, or `null` when no collide force is configured. */
  radii: Float32Array | null;
  /**
   * Per-node group index for the clustering force — nodes sharing an index are
   * pulled toward their common centroid. `-1` = ungrouped. `null` when no
   * clustering is configured. See {@link ForceSolveParams.cluster}.
   */
  clusters: Int32Array | null;
  /** Force + simulation parameters (function-free). */
  params: ForceSolveParams;
}

/** Default clustering pull strength when `cluster` is enabled without one. */
export const DEFAULT_CLUSTER_STRENGTH = 0.2;

/**
 * A custom d3-force that pulls each grouped node toward its group's centroid.
 * `clusterOf` maps a node to its group index (`-1` = ungrouped). Generic over
 * the node datum so the worker (`SolveNode`, keyed by `index`) and the live
 * sim (`SimNode`, keyed by an attached `cluster` field) share one implementation.
 * `O(N)` per tick.
 */
export function makeClusterForce<N extends SimulationNodeDatum>(
  clusterOf: (node: N) => number,
  strength: number,
): { (alpha: number): void; initialize(nodes: N[]): void } {
  let nodes: N[] = [];
  const force = (alpha: number): void => {
    const centroids = new Map<number, { x: number; y: number; n: number }>();
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
      const acc = centroids.get(c)!;
      node.vx = (node.vx ?? 0) + (acc.x - (node.x ?? 0)) * k;
      node.vy = (node.vy ?? 0) + (acc.y - (node.y ?? 0)) * k;
    }
  };
  force.initialize = (n: N[]): void => {
    nodes = n;
  };
  return force;
}

/**
 * Run a d3-force simulation to convergence **synchronously** and return the
 * settled positions `[x0,y0,…]` (a fresh transferable `Float32Array`).
 *
 * Tick count matches d3's own stop condition: `alpha(t) = alpha0·(1−decay)^t`
 * decayed to `alphaMin`, capped at 1000 for pathological configs.
 */
export function solveForces(input: ForceSolveInput): Float32Array {
  const { count, positions, seeded, fixed, links, radii, clusters, params } = input;

  const nodes: SolveNode[] = new Array(count);
  for (let i = 0; i < count; i++) {
    const n: SolveNode = { index: i };
    if (seeded[i]) {
      const x = positions[i * 2]!;
      const y = positions[i * 2 + 1]!;
      n.x = x;
      n.y = y;
      if (fixed[i]) {
        n.fx = x;
        n.fy = y;
      }
    }
    // Un-seeded nodes keep x/y undefined → forceSimulation phyllotaxis-scatters
    // them on init, so they don't pile at the origin.
    nodes[i] = n;
  }

  const linkObjs: SolveLink[] = [];
  for (let i = 0; i < links.length; i += 2) {
    // Numeric source/target are interpreted by forceLink as node indices.
    linkObjs.push({ source: links[i]!, target: links[i + 1]! });
  }

  const sim = forceSimulation<SolveNode>(nodes).stop();
  configureForces(sim, linkObjs, radii, clusters, params);
  configureSimulation(sim, params);

  const decay = 1 - sim.alphaDecay();
  const ticks =
    decay > 0 && decay < 1
      ? Math.min(1000, Math.max(1, Math.ceil(Math.log(sim.alphaMin() / sim.alpha()) / Math.log(decay))))
      : 300;
  for (let i = 0; i < ticks; i++) sim.tick();

  const out = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    out[i * 2] = nodes[i]!.x ?? 0;
    out[i * 2 + 1] = nodes[i]!.y ?? 0;
  }
  return out;
}

function configureForces(
  sim: Simulation<SolveNode, SolveLink>,
  links: SolveLink[],
  radii: Float32Array | null,
  clusters: Int32Array | null,
  params: ForceSolveParams,
): void {
  const { link, charge, center, collide, x, y, radial, cluster } = params;

  if (link !== undefined) {
    const force = forceLink<SolveNode, SolveLink>(links);
    if (link.distance !== undefined) force.distance(link.distance);
    if (link.strength !== undefined) force.strength(link.strength);
    if (link.iterations !== undefined) force.iterations(link.iterations);
    sim.force('link', force);
  }

  if (charge !== undefined) {
    const force = forceManyBody<SolveNode>();
    if (charge.strength !== undefined) force.strength(charge.strength);
    if (charge.theta !== undefined) force.theta(charge.theta);
    if (charge.distanceMin !== undefined) force.distanceMin(charge.distanceMin);
    if (charge.distanceMax !== undefined) force.distanceMax(charge.distanceMax);
    sim.force('charge', force);
  }

  if (center !== undefined) {
    const force = forceCenter<SolveNode>(center.x ?? 0, center.y ?? 0);
    if (center.strength !== undefined) force.strength(center.strength);
    sim.force('center', force);
  }

  // Collide is added whenever a per-node radius array was supplied (the main
  // thread resolves `collide.radius`, constant or function, into `radii`).
  if (radii) {
    const force = forceCollide<SolveNode>().radius((d) => radii[d.index] ?? 0);
    if (collide?.strength !== undefined) force.strength(collide.strength);
    if (collide?.iterations !== undefined) force.iterations(collide.iterations);
    sim.force('collide', force);
  }

  if (x !== undefined) {
    const force = forceX<SolveNode>();
    if (x.x !== undefined) force.x(x.x);
    if (x.strength !== undefined) force.strength(x.strength);
    sim.force('x', force);
  }

  if (y !== undefined) {
    const force = forceY<SolveNode>();
    if (y.y !== undefined) force.y(y.y);
    if (y.strength !== undefined) force.strength(y.strength);
    sim.force('y', force);
  }

  if (radial !== undefined) {
    const force = forceRadial<SolveNode>(radial.radius, radial.x ?? 0, radial.y ?? 0);
    if (radial.strength !== undefined) force.strength(radial.strength);
    sim.force('radial', force);
  }

  // Group clustering — pull nodes toward their group centroid (keyed by index).
  if (clusters && cluster !== undefined) {
    sim.force(
      'cluster',
      makeClusterForce<SolveNode>(
        (n) => clusters[n.index] ?? -1,
        cluster.strength ?? DEFAULT_CLUSTER_STRENGTH,
      ),
    );
  }
}

function configureSimulation(sim: Simulation<SolveNode, SolveLink>, params: ForceSolveParams): void {
  const { alpha, alphaMin, alphaDecay, alphaTarget, velocityDecay } = params;
  if (alpha !== undefined) sim.alpha(alpha);
  if (alphaMin !== undefined) sim.alphaMin(alphaMin);
  if (alphaDecay !== undefined) sim.alphaDecay(alphaDecay);
  if (alphaTarget !== undefined) sim.alphaTarget(alphaTarget);
  if (velocityDecay !== undefined) sim.velocityDecay(velocityDecay);
}
