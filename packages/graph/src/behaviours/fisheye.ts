/**
 * Fisheye distortion maths — pure, renderer-free, shared by `FisheyeBehaviour`.
 *
 * The radial map is Sarkar–Brown's graphical fisheye (as used by G6's Fisheye
 * plugin): a point at distance `dist ≤ r` from the focus moves, along the same
 * ray, to
 *
 * ```
 * dist' = (d + 1) · r · dist / (d · dist + r)
 * ```
 *
 * which maps `[0, r]` onto itself (`0 → 0`, `r → r`) and is monotonic, so the
 * lens has no seam at its rim and never reorders points along a ray. `d = 0` is
 * the identity; larger `d` pushes points near the focus further out, spreading a
 * dense cluster.
 */

/** Where one point is drawn under the lens, relative to where it really is. */
export interface FisheyeDisplacement {
  /** World-space offset from the logical position. */
  readonly dx: number;
  /** World-space offset from the logical position. */
  readonly dy: number;
  /** Size multiplier: `nodeScale` at the focus, easing linearly to `1` at the rim. */
  readonly scale: number;
}

/**
 * Displace the point `(px, py)` under a fisheye lens focused at `(fx, fy)`.
 *
 * @param r          lens radius (world units). Points farther than `r` are untouched.
 * @param d          distortion factor, `≥ 0`. `0` = no displacement.
 * @param nodeScale  size multiplier at the focus; `1` = no enlargement.
 * @returns the displacement, or `null` when the point lies outside the lens.
 */
export function fisheyeDisplace(
  px: number,
  py: number,
  fx: number,
  fy: number,
  r: number,
  d: number,
  nodeScale: number,
): FisheyeDisplacement | null {
  const vx = px - fx;
  const vy = py - fy;
  const dist = Math.hypot(vx, vy);
  if (!(r > 0) || dist > r) return null;
  // Linear in the *original* distance, so size eases out smoothly toward the
  // rim instead of dropping off as the distortion pushes a node outward.
  const scale = 1 + (nodeScale - 1) * (1 - dist / r);
  if (dist === 0) return { dx: 0, dy: 0, scale };
  const magnified = ((d + 1) * r * dist) / (d * dist + r);
  const k = magnified / dist - 1;
  return { dx: vx * k, dy: vy * k, scale };
}
