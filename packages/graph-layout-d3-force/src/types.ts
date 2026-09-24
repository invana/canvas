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
   * Include explicitly-hidden nodes in the simulation. Default `false` — hidden
   * nodes (and links touching them) are excluded so they don't perturb the
   * force field, and their last positions stay frozen (never written back).
   */
  includeHidden?: boolean;

  /**
   * Keep `parentId` **group** members together — a lightweight clustering force
   * that, each tick, pulls every node in a group (and the group container node)
   * toward that group's centroid. Cheap (`O(N)` per tick) and complementary to
   * the other forces: it stops group members scattering across the graph, so an
   * `autoFit` group frame stays compact instead of ballooning.
   *
   * Omit to disable (default). `strength` is the per-tick pull fraction toward
   * the centroid, alpha-scaled like d3's own forces (default `0.2`; higher =
   * tighter clusters). Not a container layout — for true nested boxes use ELK.
   */
  cluster?: { strength?: number };

  /**
   * Keep **group frames** apart. Each tick, every group is treated as one box —
   * its members' bounds plus the frame's padding and header, the box
   * `GraphLayer` draws — and overlapping boxes are pushed apart along the axis
   * of least overlap. Every member of a group gets the same push, so the group
   * moves as one and its inner arrangement is left to the other forces. A loose
   * node sitting inside another group's frame is pushed out the same way (two
   * loose nodes are left to {@link collide}). Only top-level frames separate; a
   * nested group moves with its parent.
   *
   * Complements {@link cluster}: `cluster` pulls a group's members together,
   * this keeps different groups from overlapping. Still not containment —
   * members can stray outside their own frame's neighbourhood; for true nested
   * boxes use ELK.
   *
   * Omit to disable (default). `strength` is the fraction of an overlap
   * resolved per tick (default `0.8`; like `collide`, not alpha-scaled — it is
   * a constraint, so it must not fade as the sim cools); `padding` is the extra gap kept between
   * boxes, in world units (default `24`). `O(B²)` per tick for `B` boxes —
   * meant for tens of groups, not thousands of loose nodes.
   */
  separateGroups?: { strength?: number; padding?: number };

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
   * Alpha the simulation reheats to when an `animate: false` run
   * starts from a graph that **already has settled positions** (i.e. an
   * incremental streaming add: most nodes are positioned, a few are new).
   * A low value keeps the existing layout stable — placed nodes barely move
   * while new nodes settle in — instead of yanking the whole graph through a
   * full `alpha = 1` re-layout on every chunk. The first run (no positioned
   * nodes) ignores this and uses {@link alpha} (or d3's default of `1`).
   * Default `0.5`.
   *
   * Also used by the live (`animate: true`) simulation for a **re-flow** — a
   * run carrying `LayoutRunOptions.anchorNodeId`, such as the re-layout after
   * a group frame opens or closes — where it defaults to `0.3` so the graph
   * eases into place instead of restarting at full energy.
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
  /**
   * `forceCenter` — translates the graph's centroid to `(x, y)`. When omitted
   * **and** no other positional anchor (`x`/`y`/`radial`) is set, the layout
   * defaults to a `forceCenter` at the origin so the simulation can't drift
   * off-axis; set this (or `x`/`y`/`radial`) to override that default anchor.
   */
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
   * `collide.radius(r)`. A constant, or a per-node function called once per node
   * at `apply()` time with the underlying `GraphNode`.
   *
   * **Unset (default):** the radius is derived from each node's cached render
   * bounds — `max(boundingBox.width, boundingBox.height) / 2` — so nodes
   * (including wide composite cards) don't overlap without hand-tuning. Pass a
   * number / function to override (e.g. read `node.data.size`).
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
