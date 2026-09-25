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
  /** Group-frame separation (paired with {@link ForceSolveInput.separation}). */
  separateGroups?: { strength?: number; padding?: number };
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
  /**
   * Box membership for the group-separation force, or `null` when
   * `separateGroups` is off or nothing groups. See {@link GroupSeparationInput}.
   */
  separation: GroupSeparationInput | null;
  /** Force + simulation parameters (function-free). */
  params: ForceSolveParams;
}

/**
 * Everything the group-separation force needs, as transferable typed arrays
 * indexed by sim node index.
 *
 * Every placed node belongs to exactly one **box**: its outermost placed group
 * (the frame the user sees around it), or — when it has no group — a box of its
 * own. A box's extent is its members' bounds grown by the group's insets, which
 * is how `GraphLayer` sizes an auto-fit frame.
 */
export interface GroupSeparationInput {
  /** Number of boxes. */
  boxCount: number;
  /** Box index per node. */
  boxOf: Int32Array;
  /** Half width / half height per node, interleaved `[hw0, hh0, hw1, hh1, …]`. */
  halfSize: Float32Array;
  /**
   * 1 = the node's box contributes to its box's bounds. 0 for a group frame's
   * own node — an expanded frame is drawn around its members, so the frame
   * node's simulated position says nothing about where the frame is. It still
   * moves with its box.
   */
  counts: Uint8Array;
  /** Insets per box `[top, right, bottom, left, …]` — zero for a loose node's box. */
  insets: Float32Array;
  /** 1 = the box is a group frame; 0 = a loose node (loose pairs are left to `collide`). */
  isGroup: Uint8Array;
}

/** Default separation push strength when `separateGroups` is enabled without one. */
export const DEFAULT_SEPARATION_STRENGTH = 0.8;
/** Default extra gap kept between separated boxes, in world units. */
export const DEFAULT_SEPARATION_PADDING = 24;

/**
 * A custom d3-force that keeps group frames from overlapping each other and
 * from covering nodes outside the group.
 *
 * Each tick it measures every box (see {@link GroupSeparationInput}) and, for
 * each overlapping pair that involves at least one group, pushes the two apart
 * along the axis of least penetration. The push is applied to the velocity of
 * **every** member of a box alike, so a group moves as a rigid cluster and the
 * layout inside it is left to the other forces.
 *
 * Like d3's `forceCollide`, and unlike the attraction forces, the push is
 * **not** alpha-scaled: non-overlap is a constraint, and an alpha-scaled push
 * fades out as the simulation cools while the links keep pulling groups
 * together — so frames would settle overlapping anyway. Pinned / dragged nodes (`fx`
 * set) are not moved. `O(B²)` per tick for `B` boxes — meant for model-level
 * graphs (tens of boxes), not thousands of loose nodes.
 *
 * Generic over the node datum; both the live sim and the worker key it by
 * d3's own `node.index`.
 */
export function makeGroupSeparationForce<N extends SimulationNodeDatum>(
  input: GroupSeparationInput,
  strength: number,
  padding: number,
): { (alpha: number): void; initialize(nodes: N[]): void } {
  const { boxCount, boxOf, halfSize, counts, insets, isGroup } = input;
  const minX = new Float64Array(boxCount);
  const minY = new Float64Array(boxCount);
  const maxX = new Float64Array(boxCount);
  const maxY = new Float64Array(boxCount);
  const pushX = new Float64Array(boxCount);
  const pushY = new Float64Array(boxCount);
  let nodes: N[] = [];

  const force = (): void => {
    minX.fill(Infinity);
    minY.fill(Infinity);
    maxX.fill(-Infinity);
    maxY.fill(-Infinity);
    pushX.fill(0);
    pushY.fill(0);
    for (let i = 0; i < nodes.length; i++) {
      if (counts[i] !== 1) continue;
      const n = nodes[i]!;
      const b = boxOf[i]!;
      const x = n.x ?? 0;
      const y = n.y ?? 0;
      const hw = halfSize[i * 2]!;
      const hh = halfSize[i * 2 + 1]!;
      if (x - hw < minX[b]!) minX[b] = x - hw;
      if (y - hh < minY[b]!) minY[b] = y - hh;
      if (x + hw > maxX[b]!) maxX[b] = x + hw;
      if (y + hh > maxY[b]!) maxY[b] = y + hh;
    }
    for (let b = 0; b < boxCount; b++) {
      if (minX[b] === Infinity) continue;
      minY[b] = minY[b]! - insets[b * 4]!;
      maxX[b] = maxX[b]! + insets[b * 4 + 1]!;
      maxY[b] = maxY[b]! + insets[b * 4 + 2]!;
      minX[b] = minX[b]! - insets[b * 4 + 3]!;
    }

    const k = strength;
    let any = false;
    for (let a = 0; a < boxCount; a++) {
      if (minX[a] === Infinity) continue;
      for (let b = a + 1; b < boxCount; b++) {
        if (minX[b] === Infinity) continue;
        // Two loose nodes are `collide`'s business, not this force's.
        if (isGroup[a] !== 1 && isGroup[b] !== 1) continue;
        const ox = Math.min(maxX[a]!, maxX[b]!) - Math.max(minX[a]!, minX[b]!) + padding;
        const oy = Math.min(maxY[a]!, maxY[b]!) - Math.max(minY[a]!, minY[b]!) + padding;
        if (ox <= 0 || oy <= 0) continue;
        any = true;
        // Separate along the axis that needs the smaller move; each side takes half.
        if (ox < oy) {
          const dir = minX[a]! + maxX[a]! <= minX[b]! + maxX[b]! ? -1 : 1;
          pushX[a] = pushX[a]! + (dir * ox * k) / 2;
          pushX[b] = pushX[b]! - (dir * ox * k) / 2;
        } else {
          const dir = minY[a]! + maxY[a]! <= minY[b]! + maxY[b]! ? -1 : 1;
          pushY[a] = pushY[a]! + (dir * oy * k) / 2;
          pushY[b] = pushY[b]! - (dir * oy * k) / 2;
        }
      }
    }
    if (!any) return;
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i]!;
      if (n.fx != null) continue;
      const b = boxOf[i]!;
      n.vx = (n.vx ?? 0) + pushX[b]!;
      n.vy = (n.vy ?? 0) + pushY[b]!;
    }
  };
  force.initialize = (n: N[]): void => {
    nodes = n;
  };
  return force;
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
  const { count, positions, seeded, fixed, links, radii, clusters, separation, params } = input;

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
  configureForces(sim, linkObjs, radii, clusters, separation, params);
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
  separation: GroupSeparationInput | null,
  params: ForceSolveParams,
): void {
  const { link, charge, center, collide, x, y, radial, cluster, separateGroups } = params;

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

  // Centering. Explicit `center` wins; otherwise, when no positional anchor is
  // configured (`center`/`x`/`y`/`radial`), default to a `forceCenter` at the
  // origin so the centroid stays put and the layout can't drift off-axis.
  // Mirrors the live path in D3ForceLayout so animate:true / animate:false
  // produce the same anchored result. `D3ForceLayout.snapshotStatic` already
  // turns "no centre configured, graph already placed" into an explicit
  // `center` at the placed centroid, so the origin here is the first-load case.
  if (center !== undefined) {
    const force = forceCenter<SolveNode>(center.x ?? 0, center.y ?? 0);
    if (center.strength !== undefined) force.strength(center.strength);
    sim.force('center', force);
  } else if (x === undefined && y === undefined && radial === undefined) {
    sim.force('center', forceCenter<SolveNode>(0, 0));
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

  // Group-frame separation — boxes keyed by node index, the same arrays the
  // live sim uses.
  if (separation && separateGroups !== undefined) {
    sim.force(
      'separateGroups',
      makeGroupSeparationForce<SolveNode>(
        separation,
        separateGroups.strength ?? DEFAULT_SEPARATION_STRENGTH,
        separateGroups.padding ?? DEFAULT_SEPARATION_PADDING,
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
