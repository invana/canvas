import { Layout, LayoutOptions, LayoutRunOptions } from '@invana/canvas-core';
import { GraphNode, GraphLayer } from '@invana/graph';

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
interface D3ForceLayoutOptions {
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
    cluster?: {
        strength?: number;
    };
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
    separateGroups?: {
        strength?: number;
        padding?: number;
    };
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
interface LinkForceOptions {
    /** `link.distance(d)`. */
    distance?: number;
    /** `link.strength(s)`. */
    strength?: number;
    /** `link.iterations(n)`. */
    iterations?: number;
}
/** `forceManyBody` configuration. */
interface ChargeForceOptions {
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
interface CenterForceOptions {
    /** `center.x(x)`. */
    x?: number;
    /** `center.y(y)`. */
    y?: number;
    /** `center.strength(s)`. */
    strength?: number;
}
/** `forceCollide` configuration. */
interface CollideForceOptions {
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
interface PositionXForceOptions {
    /** `forceX.x(x)`. */
    x?: number;
    /** `forceX.strength(s)`. */
    strength?: number;
}
/** `forceY` configuration. */
interface PositionYForceOptions {
    /** `forceY.y(y)`. */
    y?: number;
    /** `forceY.strength(s)`. */
    strength?: number;
}
/** `forceRadial` configuration. `radius` is required. */
interface RadialForceOptions {
    /** Target circle radius. */
    radius: number;
    /** Circle center x. */
    x?: number;
    /** Circle center y. */
    y?: number;
    /** `radial.strength(s)`. */
    strength?: number;
}

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

declare class D3ForceLayout extends Layout<GraphLayer> {
    readonly kind = "d3-force-layout";
    private opts;
    /** Last layer `apply()` ran against — so `setOptions` can re-heat it live. */
    private lastLayer;
    private sim;
    private nodes;
    private ids;
    private nodeById;
    /** GraphNode snapshot indexed by id — used by per-node force callbacks
     *  (e.g. `collide.radius(d => ...)`) without coupling SimNode to GraphNode. */
    private graphNodeById;
    /** Ids of nodes whose `GraphNode.pinned === true` — permanent pins from
     *  user data. Driven via d3-force's `fx/fy` so the simulation keeps them
     *  fixed. Live: pin/unpin patches on `node:update` add/remove entries. */
    private pinnedIds;
    /** Ids of nodes currently being dragged by a user behaviour. Populated
     *  on `node:drag-start` from the layer, drained on `node:drag-end`. While
     *  an id is in this set, position updates mirror onto `fx/fy` so the
     *  simulation can't push the node away from the cursor. On drag-end the
     *  transient `fx/fy` clears (unless the node is also in `pinnedIds`,
     *  which is the permanent-pin path). Decoupled from `pinned` so a drag
     *  never mutates user-data semantics — pin-on-release is opt-in via a
     *  separate behaviour. */
    private draggedIds;
    /**
     * The live run's anchor ({@link LayoutRunOptions.anchorNodeId}): indices of
     * the sim nodes that stand for it and the centroid they must keep. `null`
     * when the run is not anchored, or anchoring is off because the run has
     * pinned nodes (they already hold the picture in place — shifting the free
     * nodes around them would pull the two apart).
     */
    private anchor;
    private buffer;
    /** True while our own bulk write is in-flight, so the `node:update`
     *  events it triggers don't bounce back into the sim. Relies on the
     *  store's default sync flush firing events inside the bulk call. */
    private writing;
    private unsubscribe;
    private offDragStart;
    private offDragEnd;
    /** True while a run is active. Guards `stop()` so it only emits `end`
     *  once per run, even if called externally after a natural settle. */
    private running;
    /** Lazily-created solver worker, reused for the instance's lifetime. */
    private worker;
    /** Sticky flag: no `Worker` global, or construction/runtime failed → always
     *  use the synchronous fallback. */
    private workerBroken;
    /** Monotonic id for each static solve; bumped on every dispatch and on
     *  `stop()`, so a worker reply for a superseded run is dropped. */
    private solveToken;
    /** In-flight static solves keyed by token. The `input` is retained so a
     *  worker `onerror` can complete the run via the synchronous fallback. */
    private pendingSolves;
    constructor(opts?: D3ForceLayoutOptions & LayoutOptions);
    /**
     * Merge a force-options patch (deep, so `{ charge: { strength } }` keeps the
     * other charge fields) and re-run the simulation so the change takes effect
     * live — including a switch of `animate` (live ⇄ static) or a re-heat while the
     * graph sits idle after its first settle. Re-applies whenever the layout has a
     * layer to run against (`lastLayer`), matching the one-shot layouts; before the
     * first `apply()` there's nothing to re-run, so it just stores the patch.
     * Called by `Canvas.update({ layouts: { id: patch } })`.
     */
    setOptions(patch: Partial<D3ForceLayoutOptions>): void;
    /** Snapshot of the current (merged) force options — seeds a settings editor. */
    getOptions(): Readonly<D3ForceLayoutOptions>;
    /**
     * Run the layout against `layer`. Resolves when the simulation settles
     * naturally OR is cancelled via `stop()` / a second `apply()` call.
     * Lifecycle events (`start` / `tick` / `end`) fire around the run.
     */
    apply(layer: GraphLayer, run?: LayoutRunOptions): Promise<void>;
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
    private collideRadius;
    private runStatic;
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
    private clusterIndices;
    /**
     * Read the store into a transferable {@link ForceSolveInput} using only
     * locals — no instance maps. `collide.radius` (number or function) is resolved
     * per node here; un-positioned nodes are left un-`seeded` so the solver
     * phyllotaxis-scatters them apart. An incremental add (some nodes already
     * settled) reheats to `reheatAlpha` for stability; the first run uses `alpha`.
     */
    private snapshotStatic;
    /**
     * Live settle (`animate: true`): d3 owns the tick loop on the main thread;
     * positions write back every tick and external nudges (drag, pin flips,
     * cursor-followers) reheat the running simulation. This is the path that holds
     * the interactive snapshot — `nodeById` (mirror updates onto the datum),
     * `pinnedIds` / `draggedIds` (lock `fx/fy`), `graphNodeById` (per-node force
     * callbacks).
     */
    private runLive;
    /**
     * Cancel an in-flight run. No-op when idle.
     *
     * Bumps {@link solveToken} so an in-flight `animate: false` worker solve,
     * when it replies, is recognised as stale and dropped (its positions never
     * reach the store). The `animate: true` live simulation is stopped directly.
     * The worker itself is kept alive for reuse.
     */
    stop(): void;
    /**
     * Dispatch a static solve to the worker, resolving with the settled
     * positions. Falls back to a synchronous solve on the main thread when no
     * worker is available. The `input` is retained (not transferred) so a worker
     * `onerror` can still complete the run synchronously.
     */
    private dispatchSolve;
    /**
     * Lazily construct (and memoise) the solver worker. Returns `null` — caller
     * uses the synchronous fallback — when no `Worker` global exists or
     * construction throws. A worker runtime error marks it permanently broken and
     * completes any in-flight solves synchronously.
     */
    private getWorker;
    private configureForces;
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
    private separationInput;
    private configureSimulation;
    /**
     * Translate every free sim node so the anchor's centroid is back where the
     * run started — the per-tick half of {@link LayoutRunOptions.anchorNodeId}.
     * Paused while a node is being dragged: the dragged node is held by `fx/fy`,
     * and shifting the rest would slide them out from under the cursor.
     */
    private holdAnchor;
    private writeBack;
}

export { type CenterForceOptions, type ChargeForceOptions, type CollideForceOptions, D3ForceLayout, type D3ForceLayoutOptions, type LinkForceOptions, type PositionXForceOptions, type PositionYForceOptions, type RadialForceOptions };
