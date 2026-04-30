// ── ray.ts ────────────────────────────────────────────────────────────────────
// Ray-vs-primitive intersection helpers.
//
// All rays are expressed as `o + t·d` with `d` a unit vector. Each function
// returns the forward distance `t` (or `null` / a richer record on miss).
//
// These primitives are pure math — no PixiJS, no plugin types, no allocations
// on the hot path beyond the small result object.

const EPS = 1e-9;

/**
 * Ray vs. a single line segment from (ax, ay) to (bx, by).
 *
 * @returns forward distance `t` along the ray to the hit, or `null` if the ray
 *          misses the segment or the hit is behind the ray origin.
 */
export function rayVsSegment(
  ox: number, oy: number, dx: number, dy: number,
  ax: number, ay: number, bx: number, by: number,
): number | null {
  // Solve  o + t·d  ==  a + s·(b-a),  s ∈ [0, 1], t ≥ 0.
  // Using 2D cross products:  d × (b-a) is the determinant.
  const ex = bx - ax;
  const ey = by - ay;
  const denom = dx * ey - dy * ex;
  if (Math.abs(denom) < EPS) return null;          // parallel / colinear
  const rx = ax - ox;
  const ry = ay - oy;
  const t = (rx * ey - ry * ex) / denom;            // ((a-o) × (b-a)) / denom
  const s = (rx * dy - ry * dx) / denom;            // ((a-o) × d)     / denom
  if (t < -EPS) return null;
  if (s < -EPS || s > 1 + EPS) return null;
  return t;
}

/**
 * Ray vs. a circle (cx, cy, r). Returns the **nearest forward** intersection.
 *
 * @returns forward distance `t` along the ray, or `null` if the ray misses the
 *          circle or both intersections are behind the origin.
 */
export function rayVsCircle(
  ox: number, oy: number, dx: number, dy: number,
  cx: number, cy: number, r: number,
): number | null {
  const fx = ox - cx;
  const fy = oy - cy;
  const b = fx * dx + fy * dy;          // (f·d)
  const c = fx * fx + fy * fy - r * r;  // |f|² − r²
  const disc = b * b - c;               // (d is unit, so a = 1)
  if (disc < 0) return null;
  const sq = Math.sqrt(disc);
  // Two roots: -b ± sq. Pick the smallest forward (t ≥ 0).
  const t1 = -b - sq;
  if (t1 >= -EPS) return t1;
  const t2 = -b + sq;
  if (t2 >= -EPS) return t2;
  return null;
}

/**
 * Ray vs. an axis-aligned ellipse centred at (cx, cy) with semi-axes (rx, ry).
 *
 * @returns forward distance `t`, or `null` on miss.
 */
export function rayVsEllipse(
  ox: number, oy: number, dx: number, dy: number,
  cx: number, cy: number, rx: number, ry: number,
): number | null {
  // Transform into the unit circle by scaling by (1/rx, 1/ry).
  // The ray transforms to o' = (ox-cx)/rx, dy similarly.
  // Solve unit circle vs ray, then map t back.
  const fx = (ox - cx) / rx;
  const fy = (oy - cy) / ry;
  const dxs = dx / rx;
  const dys = dy / ry;
  const a = dxs * dxs + dys * dys;
  if (a < EPS) return null;
  const b = fx * dxs + fy * dys;
  const c = fx * fx + fy * fy - 1;
  const disc = b * b - a * c;
  if (disc < 0) return null;
  const sq = Math.sqrt(disc);
  const t1 = (-b - sq) / a;
  if (t1 >= -EPS) return t1;
  const t2 = (-b + sq) / a;
  if (t2 >= -EPS) return t2;
  return null;
}

/**
 * Ray vs. an axis-aligned rectangle, using the slab method.
 *
 * Returns the nearest forward intersection with the rectangle's perimeter,
 * including the case where the ray origin is inside (the *exit* point).
 */
export function rayVsRect(
  ox: number, oy: number, dx: number, dy: number,
  minX: number, minY: number, maxX: number, maxY: number,
): number | null {
  let tNear = -Infinity;
  let tFar  =  Infinity;

  if (Math.abs(dx) < EPS) {
    if (ox < minX || ox > maxX) return null;
  } else {
    const t1 = (minX - ox) / dx;
    const t2 = (maxX - ox) / dx;
    const tMin = Math.min(t1, t2);
    const tMax = Math.max(t1, t2);
    if (tMin > tNear) tNear = tMin;
    if (tMax < tFar)  tFar  = tMax;
    if (tNear > tFar) return null;
  }

  if (Math.abs(dy) < EPS) {
    if (oy < minY || oy > maxY) return null;
  } else {
    const t1 = (minY - oy) / dy;
    const t2 = (maxY - oy) / dy;
    const tMin = Math.min(t1, t2);
    const tMax = Math.max(t1, t2);
    if (tMin > tNear) tNear = tMin;
    if (tMax < tFar)  tFar  = tMax;
    if (tNear > tFar) return null;
  }

  // Origin inside → tNear is negative; we want the forward exit.
  if (tNear >= -EPS) return tNear;
  if (tFar  >= -EPS) return tFar;
  return null;
}

/** Result record returned by {@link rayVsPolyline}. */
export interface RayPolylineHit {
  /** Forward distance along the ray to the hit. */
  t: number;
  /** Index of the segment that was hit (0-based). */
  segIndex: number;
}

/**
 * Ray vs. a flat polyline encoded as `[x0,y0, x1,y1, ...]`. Returns the
 * **nearest forward** intersection across all segments.
 *
 * @param pts    Flat coordinate array (length must be even, ≥ 4).
 * @param closed When true, an implicit closing segment from the last point
 *               back to the first is also tested.
 */
export function rayVsPolyline(
  ox: number, oy: number, dx: number, dy: number,
  pts: ArrayLike<number>, closed: boolean,
): RayPolylineHit | null {
  const n = pts.length >> 1;
  if (n < 2) return null;
  let bestT = Infinity;
  let bestIdx = -1;

  const segCount = closed ? n : n - 1;
  for (let i = 0; i < segCount; i++) {
    const j = (i + 1) % n;
    const ax = pts[i * 2]    as number;
    const ay = pts[i * 2 + 1] as number;
    const bx = pts[j * 2]    as number;
    const by = pts[j * 2 + 1] as number;
    const t = rayVsSegment(ox, oy, dx, dy, ax, ay, bx, by);
    if (t !== null && t < bestT) {
      bestT = t;
      bestIdx = i;
    }
  }
  return bestIdx === -1 ? null : { t: bestT, segIndex: bestIdx };
}

/** Convenience: convert a ray hit `t` back to a world-space point. */
export function rayPointAt(
  ox: number, oy: number, dx: number, dy: number, t: number,
): { x: number; y: number } {
  return { x: ox + dx * t, y: oy + dy * t };
}

/** Normalise a 2-vector. Returns `(0, 0)` if input length is zero. */
export function unit(x: number, y: number): { x: number; y: number } {
  const len = Math.sqrt(x * x + y * y);
  if (len < EPS) return { x: 0, y: 0 };
  return { x: x / len, y: y / len };
}
