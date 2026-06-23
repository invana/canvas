import type { GraphNode } from '@invana/graph';

/**
 * `D3ForceLayout` options. Every field maps 1:1 to a d3-force setter
 * documented at https://d3js.org/d3-force.
 *
 * **All options default to `undefined`.** A force is only added to the
 * simulation when its option is provided. A setter is only called when
 * its sub-option is provided. Anything omitted falls through to
 * d3-force's own defaults — or, for forces themselves, is not added at
 * all.
 *
 * @example
 * new D3ForceLayout({
 *   charge: {},                       // adds forceManyBody at d3 defaults
 *   link: { distance: 80 },           // adds forceLink, override distance
 *   center: { x: 0, y: 0 },           // adds forceCenter at (0, 0)
 *   // no `collide` → no collision force
 *   // no `alphaDecay` → d3 default decay rate
 * });
 */
export interface D3ForceLayoutOptions {
  // ─── Run-loop behaviour ───────────────────────────────────────────────
  /**
   * When `true` (default), positions are written back to the store on
   * every d3-force tick — the renderer animates the simulation as it
   * settles.
   *
   * When `false`, per-tick writeback is suppressed and positions are
   * flushed to the store exactly once when the simulation settles
   * (`sim.on('end')`). The simulation still runs to completion; only the
   * mirrored renderer updates are skipped. For large graphs (thousands
   * of nodes / tens of thousands of edges) this avoids the ~hundreds of
   * intermediate `setPositionsBulk` → `node:update` → renderer storms
   * that dominate cost — the run finishes noticeably faster and the
   * viewer just sees the settled picture appear.
   *
   * Lifecycle `tick` events are still emitted in both modes — only the
   * store writeback is gated.
   *
   * Default `true`.
   */
  animate?: boolean;

  /**
   * Only with `animate: false`. Alpha the simulation reheats to when a run
   * starts from a graph that **already has settled positions** (i.e. an
   * incremental streaming add: most nodes are positioned, a few are new).
   * A low value keeps the existing layout stable — placed nodes barely move
   * while new nodes settle in — instead of yanking the whole graph through a
   * full `alpha = 1` re-layout on every chunk. The first run (no positioned
   * nodes) ignores this and uses {@link alpha} (or d3's default of `1`).
   * Default `0.5`.
   */
  reheatAlpha?: number;

  /**
   * Only with `animate: false`. Factory for the Web Worker that runs the
   * static settle off the main thread (so a multi-hundred-tick convergence
   * doesn't block paint / input). Defaults to loading this package's bundled
   * solver worker. When no `Worker` global exists (Node / SSR / tests) or the
   * factory throws, the layout falls back to solving synchronously on the main
   * thread — correct, but blocking. Mirror of `ElkLayout`'s `workerFactory`.
   */
  workerFactory?: () => Worker;

  // ─── Simulation parameters ────────────────────────────────────────────
  /** `simulation.alpha(alpha)`. */
  alpha?: number;
  /** `simulation.alphaMin(min)`. */
  alphaMin?: number;
  /** `simulation.alphaDecay(decay)`. */
  alphaDecay?: number;
  /** `simulation.alphaTarget(target)`. */
  alphaTarget?: number;
  /** `simulation.velocityDecay(decay)`. */
  velocityDecay?: number;

  // ─── Forces (each off unless provided) ────────────────────────────────
  /** `forceLink` — pulls connected nodes toward a target distance. */
  link?: LinkForceOptions;
  /** `forceManyBody` — n-body charge (negative = repulsion). */
  charge?: ChargeForceOptions;
  /** `forceCenter` — translates the cluster's centroid to `(x, y)`. */
  center?: CenterForceOptions;
  /** `forceCollide` — prevents overlap. */
  collide?: CollideForceOptions;
  /** `forceX` — positioning force along x. */
  x?: PositionXForceOptions;
  /** `forceY` — positioning force along y. */
  y?: PositionYForceOptions;
  /** `forceRadial` — pulls toward a circle of given radius. Requires `radius`. */
  radial?: RadialForceOptions;
}

/** `forceLink` configuration. */
export interface LinkForceOptions {
  /** `link.distance(d)`. */
  distance?: number;
  /** `link.strength(s)`. */
  strength?: number;
  /** `link.iterations(n)`. */
  iterations?: number;
}

/** `forceManyBody` configuration. */
export interface ChargeForceOptions {
  /** `manyBody.strength(s)` — negative repels, positive attracts. */
  strength?: number;
  /** `manyBody.theta(θ)` — Barnes–Hut accuracy threshold. */
  theta?: number;
  /** `manyBody.distanceMin(d)`. */
  distanceMin?: number;
  /** `manyBody.distanceMax(d)`. */
  distanceMax?: number;
}

/** `forceCenter` configuration. */
export interface CenterForceOptions {
  /** `center.x(x)`. */
  x?: number;
  /** `center.y(y)`. */
  y?: number;
  /** `center.strength(s)`. */
  strength?: number;
}

/** `forceCollide` configuration. */
export interface CollideForceOptions {
  /**
   * `collide.radius(r)`. Either a constant, or a per-node function called
   * once per node at `apply()` time with the underlying `GraphNode`. Use
   * the function form when collision sizes vary per node (e.g. read
   * `node.data.size`).
   */
  radius?: number | ((node: GraphNode) => number);
  /** `collide.strength(s)` in `[0, 1]`. */
  strength?: number;
  /** `collide.iterations(n)`. */
  iterations?: number;
}

/** `forceX` configuration. */
export interface PositionXForceOptions {
  /** `forceX.x(x)`. */
  x?: number;
  /** `forceX.strength(s)`. */
  strength?: number;
}

/** `forceY` configuration. */
export interface PositionYForceOptions {
  /** `forceY.y(y)`. */
  y?: number;
  /** `forceY.strength(s)`. */
  strength?: number;
}

/** `forceRadial` configuration. `radius` is required. */
export interface RadialForceOptions {
  /** Target circle radius. */
  radius: number;
  /** Circle center x. */
  x?: number;
  /** Circle center y. */
  y?: number;
  /** `radial.strength(s)`. */
  strength?: number;
}
