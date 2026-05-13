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
