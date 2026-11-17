/**
 * Spatial predicates for area queries — "is this point inside that feature, or
 * within N km of it?" Pure: `[lng, lat]` in, a boolean out, geodesic where it
 * measures.
 *
 * Containment is tested in longitude / latitude space, with the same even-odd rule
 * (and holes) the layer draws with. A feature that crosses the antimeridian is not
 * handled.
 */

import { pointInPolygon, type Pt } from '../features/geometry';
import type { GeoGeometry, Position } from '../features/types';
import { distanceToPolylineKm, haversineKm } from './geodesy';

const toPts = (ring: readonly Position[]): Pt[] => ring.map((p) => ({ x: p[0], y: p[1] }));

/** Axis-aligned bounds of a geometry in degrees, `[west, south, east, north]`. */
function bounds(g: GeoGeometry): [number, number, number, number] {
  let w = Infinity;
  let s = Infinity;
  let e = -Infinity;
  let n = -Infinity;
  const add = (p: Position): void => {
    if (p[0] < w) w = p[0];
    if (p[0] > e) e = p[0];
    if (p[1] < s) s = p[1];
    if (p[1] > n) n = p[1];
  };
  switch (g.type) {
    case 'Point':
      add(g.coordinates);
      break;
    case 'LineString':
      g.coordinates.forEach(add);
      break;
    case 'MultiLineString':
      g.coordinates.forEach((l) => l.forEach(add));
      break;
    case 'Polygon':
      g.coordinates.forEach((r) => r.forEach(add));
      break;
    case 'MultiPolygon':
      g.coordinates.forEach((poly) => poly.forEach((r) => r.forEach(add)));
      break;
  }
  return [w, s, e, n];
}

/**
 * A predicate for "inside `g`, or within `km` of it". For a `Point` with `radiusKm`
 * the radius counts: inside means within `radiusKm + km`. A line has no inside, so
 * it needs `km > 0` to match anything. Cheap to call per point: a bounding box
 * (grown by `km`) rules out most points before any geodesy.
 */
export function createMatcher(g: GeoGeometry, km = 0, radiusKm = 0): (p: Position) => boolean {
  const [w, s, e, n] = bounds(g);
  const reach = km + (g.type === 'Point' ? radiusKm : 0);
  // The widest a km can be in degrees of longitude, at the box's highest latitude.
  const dLat = reach / 111.195;
  const maxLat = Math.min(89.9, Math.max(Math.abs(s), Math.abs(n)) + dLat);
  const dLng = reach / (111.195 * Math.max(0.01, Math.cos((maxLat * Math.PI) / 180)));
  const inBox = (p: Position): boolean => p[0] >= w - dLng && p[0] <= e + dLng && p[1] >= s - dLat && p[1] <= n + dLat;

  switch (g.type) {
    case 'Point': {
      const c = g.coordinates;
      return (p) => inBox(p) && haversineKm(p, c) <= reach;
    }
    case 'LineString': {
      const line = g.coordinates;
      return (p) => km > 0 && inBox(p) && distanceToPolylineKm(p, line) <= km;
    }
    case 'MultiLineString': {
      const lines = g.coordinates;
      return (p) => km > 0 && inBox(p) && lines.some((l) => distanceToPolylineKm(p, l) <= km);
    }
    case 'Polygon':
    case 'MultiPolygon': {
      const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
      const pts = polys.map((rings) => rings.map(toPts));
      return (p) => {
        if (!inBox(p)) return false;
        const at = { x: p[0], y: p[1] };
        if (pts.some((rings) => pointInPolygon(at.x, at.y, rings))) return true;
        if (km <= 0) return false;
        // Near the boundary: the outer ring only — a hole's edge is also a boundary an analyst can be "near".
        return polys.some((rings) => rings.some((ring) => distanceToPolylineKm(p, ring) <= km));
      };
    }
  }
}
