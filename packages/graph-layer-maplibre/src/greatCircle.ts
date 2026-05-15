/**
 * Spherical interpolation between two `[lng, lat]` points along the
 * great-circle (shortest path on the sphere). Returns `n` evenly-spaced
 * samples *including* both endpoints.
 *
 * Used by stories drawing flight routes / airline arcs: the projected
 * polyline of these samples reads as a smooth curve on a mercator basemap.
 * Pure function, no engine dependency — exposed from
 * `@invana/graph-layer-maplibre` because it pairs with {@link MapLayer.project},
 * but works fine without the layer too.
 *
 * Algorithm: classic Slerp on unit-sphere 3-vectors derived from
 * `(lng, lat)`. Falls back to linear interpolation when the two points are
 * effectively coincident (angle ≈ 0), which keeps tiny self-loops from
 * dividing by zero in `sin(0)`.
 */

export type LngLatTuple = readonly [number, number];

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

function toCartesian(lng: number, lat: number): [number, number, number] {
  const clng = Math.cos(lng * DEG);
  const slng = Math.sin(lng * DEG);
  const clat = Math.cos(lat * DEG);
  const slat = Math.sin(lat * DEG);
  return [clat * clng, clat * slng, slat];
}

function toLngLat(v: [number, number, number]): [number, number] {
  const [x, y, z] = v;
  const lng = Math.atan2(y, x) * RAD;
  const lat = Math.atan2(z, Math.sqrt(x * x + y * y)) * RAD;
  return [lng, lat];
}

/**
 * Sample `n` points (`n >= 2`) along the great circle from `from` to `to`.
 *
 * - `n = 2` returns just the endpoints.
 * - `n = 32` (the typical default for flight arcs) gives a visually-smooth
 *   curve at most map zooms; bump to 64+ for long transoceanic routes.
 */
export function greatCircleSamples(
  from: LngLatTuple,
  to: LngLatTuple,
  n: number,
): [number, number][] {
  if (n < 2) throw new Error(`greatCircleSamples: n must be >= 2 (got ${n})`);
  const a = toCartesian(from[0], from[1]);
  const b = toCartesian(to[0], to[1]);

  // Angle between the two unit vectors.
  const dot = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const omega = Math.acos(dot);
  const sinOmega = Math.sin(omega);

  const out: [number, number][] = new Array(n);

  // Coincident / near-coincident: slerp degenerates; linear-interpolate in
  // lng/lat directly — small enough that mercator distortion is invisible.
  if (sinOmega < 1e-9) {
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      out[i] = [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t];
    }
    return out;
  }

  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const s1 = Math.sin((1 - t) * omega) / sinOmega;
    const s2 = Math.sin(t * omega) / sinOmega;
    const v: [number, number, number] = [
      s1 * a[0] + s2 * b[0],
      s1 * a[1] + s2 * b[1],
      s1 * a[2] + s2 * b[2],
    ];
    out[i] = toLngLat(v);
  }
  return out;
}
