import type { IPathStyle, PathCommand } from '@invana/canvas-store';

interface StepRadialOpts {
  /**
   * Polar origin (centre of the polar coordinate system) in world units.
   * Source / target angles are measured from this point. Default `(0, 0)`.
   *
   * Set this when your radial layout is centred somewhere other than the
   * world origin.
   */
  readonly origin?: { readonly x: number; readonly y: number };
}

/**
 * Two-segment **radial step** (a.k.a. "elbow") link, matching the d3
 * `linkStep` helper used by the canonical Tree of Life example:
 *
 *  1. Circular **arc** at the source's radius from the source angle to the
 *     target angle (constant-radius sweep along the parent's tier).
 *  2. Straight **radial line** outward from there to the target.
 *
 * Visually this produces the boxy / angular cluster-dendrogram look — every
 * subtree fans out from a horizontal arc at its parent's radius, then shoots
 * outward as straight spokes. It's the right pick for radial *clusters*
 * (where all leaves sit on a single outer rim and the eye reads tiers via
 * the constant-radius arcs); the smooth {@link bumpRadialPathStyle} is the
 * right pick for radial *trees* (where edges should curve continuously).
 *
 * The arc is approximated with cubic Bézier sub-arcs (≤ 90° each) using the
 * standard `k = (4/3) tan(θ/4) r` handle-length formula — visually
 * indistinguishable from a true SVG `A` command at any zoom, and stays a
 * flat sequence of `M / C / L` commands the Pixi renderer already knows
 * how to consume.
 *
 * Pair with `router: 'straight'`; intermediate polyline waypoints are
 * ignored. Use `anchor: 'center'` on the edge so the tangent is computed
 * from the true node-centre angle (otherwise the arc would launch from the
 * trimmed boundary cut-point and read crooked).
 *
 * Edge cases:
 *  - `r0 === 0` (source at the origin): emits a single straight `M → L`.
 *  - Source / target angles equal (single-child clade, or angular wrap
 *    collapses to zero): emits a straight radial `M → L`.
 *  - Polyline shorter than two points: returns `[]`.
 */
export const stepRadialPathStyle: IPathStyle = (polyline, opts) => {
  if (polyline.length < 2) return [];
  const origin = (opts as StepRadialOpts | undefined)?.origin ?? { x: 0, y: 0 };

  const s = polyline[0]!;
  const t = polyline[polyline.length - 1]!;
  const sxRel = s.x - origin.x;
  const syRel = s.y - origin.y;
  const txRel = t.x - origin.x;
  const tyRel = t.y - origin.y;

  const r0 = Math.hypot(sxRel, syRel);

  // Degenerate: source has no defined angle. Straight line is the only
  // sensible fallback.
  if (r0 === 0) {
    return [
      { kind: 'M', x: s.x, y: s.y },
      { kind: 'L', x: t.x, y: t.y },
    ];
  }

  const a0 = Math.atan2(syRel, sxRel);
  const a1 = Math.atan2(tyRel, txRel);

  // Normalise the angular sweep into (-π, π] so we always take the shorter
  // way around. In a hierarchical layout the parent-to-child angular gap is
  // small (well under π/2 in practice), so this is just defensive.
  let delta = a1 - a0;
  while (delta > Math.PI) delta -= 2 * Math.PI;
  while (delta < -Math.PI) delta += 2 * Math.PI;

  // Arc-end point: same radius as source, angle of target.
  const arcEndX = origin.x + r0 * Math.cos(a1);
  const arcEndY = origin.y + r0 * Math.sin(a1);

  const out: PathCommand[] = [{ kind: 'M', x: s.x, y: s.y }];

  if (Math.abs(delta) > 1e-9) {
    // Approximate the arc with one or more cubic Béziers, each spanning at
    // most ~π/2 of the circle so the standard handle-length formula stays
    // visually exact.
    const numSegments = Math.max(1, Math.ceil(Math.abs(delta) / (Math.PI / 2)));
    const segAngle = delta / numSegments;
    // Signed handle length — sign of `tan(segAngle / 4)` already tracks
    // the direction of the sweep, so the same formula works for both
    // clockwise and anti-clockwise arcs.
    const k = (4 / 3) * Math.tan(segAngle / 4) * r0;

    let theta = a0;
    let px = origin.x + r0 * Math.cos(theta);
    let py = origin.y + r0 * Math.sin(theta);
    for (let i = 0; i < numSegments; i++) {
      const nextTheta = theta + segAngle;
      const nx = origin.x + r0 * Math.cos(nextTheta);
      const ny = origin.y + r0 * Math.sin(nextTheta);
      // Tangent at each endpoint of a circle (ccw): (-sin θ, cos θ).
      // Signed `k` flips it for clockwise sweeps automatically.
      const c1x = px + k * -Math.sin(theta);
      const c1y = py + k * Math.cos(theta);
      const c2x = nx - k * -Math.sin(nextTheta);
      const c2y = ny - k * Math.cos(nextTheta);
      out.push({ kind: 'C', c1x, c1y, c2x, c2y, x: nx, y: ny });
      theta = nextTheta;
      px = nx;
      py = ny;
    }
  } else {
    // Same ray — no arc, just glide to the arc-end point (which equals the
    // source up to floating-point noise) before emitting the radial line.
    out.push({ kind: 'L', x: arcEndX, y: arcEndY });
  }

  // Radial segment: straight line out to the target.
  out.push({ kind: 'L', x: t.x, y: t.y });
  return out;
};
