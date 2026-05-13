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
}
