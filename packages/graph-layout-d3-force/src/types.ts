/**
 * `D3ForceLayout` option types.
 *
 * The class is intentionally non-generic over d3-force's internal node /
 * link types — those stay private. Consumers only see GraphStore ids and
 * positions in / out.
 */

/** Behaviour of incident-edge re-routing during a running simulation. */
export interface D3ForceLayoutOptions {
  /**
   * Negative for repulsion, positive for attraction. Default `-300` — a
   * reasonable starting point for graphs in the 10–500 node range.
   * d3-force `forceManyBody().strength(charge)`.
   */
  charge?: number;

  /**
   * Desired edge length, in world units. Default `80`.
   * d3-force `forceLink().distance(linkDistance)`.
   */
  linkDistance?: number;

  /**
   * Link force strength multiplier in `[0, 1]`. Default `0.6`.
   * d3-force `forceLink().strength(linkStrength)`.
   */
  linkStrength?: number;

  /**
   * Center the layout at this world point. Default `{ x: 0, y: 0 }`. Pass
   * `null` to skip the centering force entirely.
   */
  center?: { x: number; y: number } | null;

  /**
   * Apply collision-radius repulsion so circular nodes don't overlap.
   * Pass a number to use as the collision radius (in world units), or
   * `false` to disable. Default `24` (matches the GraphLayer default node
   * diameter of 32, half of that, plus a small gutter).
   */
  collide?: number | false;

  /**
   * Simulation alpha settings. The simulation runs until `alpha < alphaMin`.
   * `alpha` is decayed each tick by `alpha *= 1 - alphaDecay`.
   *
   * Defaults: `alpha: 1`, `alphaMin: 0.001`, `alphaDecay: 0.0228`
   * (d3-force defaults — ~300 ticks to settle).
   */
  alpha?: number;
  alphaMin?: number;
  alphaDecay?: number;

  /**
   * Velocity decay per tick (friction). 0 = frictionless (oscillates),
   * 1 = stop instantly. Default `0.4`. d3-force `velocityDecay`.
   */
  velocityDecay?: number;

  /**
   * If `true`, run the simulation synchronously to convergence inside
   * `apply()` and write back once. If `false`, drive the simulation across
   * animation frames and write back after each tick. Default `false`
   * (animated). Set `true` for a one-shot layout pass with no animation.
   */
  syncTicks?: boolean;

  /**
   * Keep the simulation alive after the initial settle. With this on, an
   * external `store.setPosition` (e.g. a node drag) flows into the live
   * sim — the layout listens to `node:update` events, mirrors the new
   * position onto the matching `SimNode`, and re-heats α so the cluster
   * physically reacts to the change instead of just snapping the node
   * into a dead frame. The position sync is *non-freezing* — no
   * `fx` / `fy` lock, so physics is free to continue moving the node
   * from its new starting point. Default `false`.
   *
   * Semantics with `keepAlive: true`:
   * - The `apply()` promise still resolves at first settle and `onEnd`
   *   still fires once at that moment — the "initial layout is ready"
   *   contract is unchanged.
   * - The animated tick loop stays alive after that. While
   *   `alphaTarget === 0` the loop is effectively idle (d3-force scales
   *   all forces by alpha, so a tick with `alpha ≈ 0` is a noop and the
   *   loop skips its own write-back to avoid event spam).
   * - Any external `store.setPosition` bumps `alphaTarget` to `0.3` and
   *   restarts the sim; a 200 ms cooldown after the last mutation cools
   *   `alphaTarget` back to `0`.
   * - The only way to terminate the run is `layout.stop()` (or destroying
   *   the layer, which calls `stop()` for you).
   *
   * Ignored when `syncTicks: true` — sync mode has no animated tick loop
   * to keep alive.
   */
  keepAlive?: boolean;

  /**
   * Fired once when the simulation is built and the initial node positions
   * have been written back to the store, *before* the first tick. Use this
   * to set up the camera (e.g. `canvas.camera.fitContent(layer.getBounds())`)
   * exactly once when the run kicks off — preferred over a per-tick fit
   * because it doesn't fight user pan / zoom during the simulation.
   */
  onStart?: () => void;

  /**
   * Fired after every tick + write-back. Use this to follow the spreading
   * cluster with the camera, update overlays, log telemetry, etc.
   *
   * The store's positions are already updated when this fires; the typical
   * consumer is `() => canvas.camera.fitContent(graphLayer.getBounds(), 80)`.
   *
   * Fires once on every animated tick (~60/sec) or exactly once at the end
   * when `syncTicks: true`.
   */
  onTick?: () => void;

  /**
   * Fired exactly once when the simulation settles (`alpha < alphaMin`),
   * the `apply()` promise has resolved, and the final write-back has
   * happened. Use this for "one last camera fit", post-settle cleanup, etc.
   *
   * Also fired when `stop()` interrupts the simulation.
   */
  onEnd?: () => void;
}
