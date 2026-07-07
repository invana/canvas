/**
 * Types for the D3ForceLayout editor.
 *
 * Engine-agnostic: `@invana/graph-layout-d3-force` (home of `D3ForceLayout` and
 * its options) is **not** imported — canvas-ui may only use `@invana/graph`
 * types (package CLAUDE.md). The editable option shape is mirrored here as
 * {@link D3ForceLayoutOptions}, a serialisable patch the consumer applies (a
 * layout re-run / `setOptions`). Keep it in sync with `D3ForceLayoutOptions` by
 * hand.
 */

/**
 * The subset of `D3ForceLayoutOptions` this editor produces — a serialisable
 * patch. The forces d3-force nests under `link` / `charge` / `center` /
 * `collide` are kept nested here (the editor flattens them into prefixed scalar
 * fields, see {@link D3ForceLayoutFields}). Function options (`collide.radius`
 * as a function, `workerFactory`), the `x` / `y` / `radial` positioning forces,
 * and registry wiring (`id` / `targetLayerId`) are out of scope; the tunable
 * scalars round-trip.
 */
export interface D3ForceLayoutOptions {
  // ─── Run-loop + simulation parameters ─────────────────────────────────
  /** Write positions every tick (live animation) vs. flush once on settle. */
  animate?: boolean;
  /** Reheat alpha for incremental streaming adds (only with `animate: false`). */
  reheatAlpha?: number;
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
  link?: { distance?: number; strength?: number; iterations?: number };
  /** `forceManyBody` — n-body charge (negative = repulsion). */
  charge?: {
    strength?: number;
    theta?: number;
    distanceMin?: number;
    distanceMax?: number;
  };
  /** `forceCenter` — translates the cluster's centroid to `(x, y)`. */
  center?: { x?: number; y?: number; strength?: number };
  /** `forceCollide` — prevents overlap. Only the constant `radius` is editable. */
  collide?: { radius?: number; strength?: number; iterations?: number };
}

/**
 * Flat form-field shape the `@invana/forms` generator renders. Each nested
 * force group is flattened into prefixed scalar fields (`linkDistance`,
 * `chargeStrength`, `centerX`, `collideRadius`, …); `mapping.ts` reassembles
 * the nested groups.
 */
export interface D3ForceLayoutFields {
  animate?: boolean;
  reheatAlpha?: number;
  alpha?: number;
  alphaMin?: number;
  alphaDecay?: number;
  alphaTarget?: number;
  velocityDecay?: number;
  // link
  linkDistance?: number;
  linkStrength?: number;
  linkIterations?: number;
  // charge
  chargeStrength?: number;
  chargeTheta?: number;
  chargeDistanceMin?: number;
  chargeDistanceMax?: number;
  // center
  centerX?: number;
  centerY?: number;
  centerStrength?: number;
  // collide
  collideRadius?: number;
  collideStrength?: number;
  collideIterations?: number;
}

/** react-hook-form state — leaves register under `options.<field>`. */
export interface D3ForceLayoutFormState {
  options: D3ForceLayoutFields;
}
