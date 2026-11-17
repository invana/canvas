/**
 * Geodesy on a sphere — distance, bearing, polygon area and "how far is this from
 * that line". Pure: `[lng, lat]` degrees in, kilometres / degrees / km² out.
 *
 * The earth is a **sphere** of mean radius 6,371.0088 km. Against the WGS-84
 * ellipsoid that is within about 0.5 % for distances and areas — inside the
 * accuracy of the data these tools serve — and costs no dependency. World units
 * (Web-Mercator pixels) are never used here: a metre is a different number of
 * them at every latitude.
 */

import type { Position } from '../features/types';

/** Mean earth radius, km. */
export const EARTH_RADIUS_KM = 6371.0088;

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

/** Great-circle distance between two points, km (haversine). */
export function haversineKm(a: Position, b: Position): number {
  const dLat = (b[1] - a[1]) * RAD;
  const dLng = (b[0] - a[0]) * RAD;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * RAD) * Math.cos(b[1] * RAD) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Initial compass bearing from `a` to `b`, degrees in `[0, 360)` — 0 north, 90 east. */
export function initialBearing(a: Position, b: Position): number {
  const φ1 = a[1] * RAD;
  const φ2 = b[1] * RAD;
  const Δλ = (b[0] - a[0]) * RAD;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * DEG) % 360 + 360) % 360;
}

/** The point `km` from `from` along `bearingDeg` (a great circle). */
export function destinationPoint(from: Position, bearingDeg: number, km: number): [number, number] {
  const δ = km / EARTH_RADIUS_KM;
  const θ = bearingDeg * RAD;
  const φ1 = from[1] * RAD;
  const λ1 = from[0] * RAD;
  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));
  const λ2 = λ1 + Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2));
  return [(((λ2 * DEG + 540) % 360) - 180), φ2 * DEG];
}

/** Total length of a polyline, km. */
export function polylineLengthKm(line: readonly Position[]): number {
  let km = 0;
  for (let i = 0; i + 1 < line.length; i++) km += haversineKm(line[i]!, line[i + 1]!);
  return km;
}

/**
 * Area of a ring on the sphere, km² (Chamberlain & Duquette's formula). Edges are
 * straight in longitude / latitude — which is how GeoJSON defines them, and, up to
 * a rhumb line, how a Web-Mercator canvas draws them — so a very large ring that
 * touches a pole is not meaningful. The ring may repeat its first point or not;
 * its direction does not matter (the result is positive).
 */
export function sphericalRingAreaKm2(ring: readonly Position[]): number {
  const n = ring.length;
  if (n < 3) return 0;
  const last = ring[n - 1]!;
  const first = ring[0]!;
  const count = last[0] === first[0] && last[1] === first[1] ? n - 1 : n;
  let sum = 0;
  for (let i = 0; i < count; i++) {
    const p = ring[i]!;
    const q = ring[(i + 1) % count]!;
    sum += (q[0] - p[0]) * RAD * (2 + Math.sin(p[1] * RAD) + Math.sin(q[1] * RAD));
  }
  return Math.abs((sum * EARTH_RADIUS_KM * EARTH_RADIUS_KM) / 2);
}

/** Area of a polygon (outer ring first, holes after), km² — holes subtracted. */
export function sphericalPolygonAreaKm2(rings: readonly (readonly Position[])[]): number {
  if (rings.length === 0) return 0;
  let area = sphericalRingAreaKm2(rings[0]!);
  for (let i = 1; i < rings.length; i++) area -= sphericalRingAreaKm2(rings[i]!);
  return Math.max(0, area);
}

/**
 * Distance from a point to the segment `a–b`, km. The perpendicular (cross-track)
 * distance when the foot of the perpendicular falls on the segment, else the
 * distance to the nearer end.
 */
export function distanceToSegmentKm(p: Position, a: Position, b: Position): number {
  const dAB = haversineKm(a, b);
  if (dAB === 0) return haversineKm(p, a);
  const δ13 = haversineKm(a, p) / EARTH_RADIUS_KM;
  const θ13 = initialBearing(a, p) * RAD;
  const θ12 = initialBearing(a, b) * RAD;
  // Cross-track and along-track distances of `p` relative to the great circle a→b.
  const xt = Math.asin(Math.sin(δ13) * Math.sin(θ13 - θ12));
  const at = Math.acos(Math.max(-1, Math.min(1, Math.cos(δ13) / Math.cos(xt))));
  const alongSign = Math.cos(θ13 - θ12) < 0 ? -1 : 1;
  const along = at * EARTH_RADIUS_KM * alongSign;
  if (along < 0) return haversineKm(p, a);
  if (along > dAB) return haversineKm(p, b);
  return Math.abs(xt) * EARTH_RADIUS_KM;
}

/** Distance from a point to a polyline, km (the nearest segment). A single point is a point. */
export function distanceToPolylineKm(p: Position, line: readonly Position[]): number {
  if (line.length === 0) return Infinity;
  if (line.length === 1) return haversineKm(p, line[0]!);
  let best = Infinity;
  for (let i = 0; i + 1 < line.length; i++) best = Math.min(best, distanceToSegmentKm(p, line[i]!, line[i + 1]!));
  return best;
}
