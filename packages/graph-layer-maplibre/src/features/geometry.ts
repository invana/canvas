/**
 * Geometry for `GeoFeaturesLayer` — pure, no canvas, no clock. GeoJSON in, world
 * coordinates out (`projectLngLat`, the 512-unit Web-Mercator the basemap uses).
 *
 * A polygon with holes is drawn without a renderer change: the **fill** is one
 * closed ring whose outer boundary is joined to each hole by a zero-width bridge
 * (a keyhole polygon), and the **outline** is one stroke-only ring per boundary,
 * so a bridge is filled over but never stroked.
 */

import { projectLngLat, WORLD_SIZE } from '../mercator';
import { worldUnitsPerMetre } from '../tracking';
import type { GeoGeometry, Position } from './types';

/** A point in world coordinates. */
export interface Pt {
  x: number;
  y: number;
}

/** Project a ring or line of `[lng, lat]` to world points. */
export function projectRing(ring: readonly Position[]): Pt[] {
  return ring.map((p) => projectLngLat([p[0], p[1]]));
}

/** Shoelace signed area (positive when the ring runs clockwise on a y-down canvas). */
export function signedArea(ring: readonly Pt[]): number {
  let a = 0;
  for (let i = 0, n = ring.length; i < n; i++) {
    const p = ring[i]!;
    const q = ring[(i + 1) % n]!;
    a += p.x * q.y - q.x * p.y;
  }
  return a / 2;
}

/** The ring without its closing duplicate (GeoJSON rings repeat the first point). */
export function openRing(ring: readonly Pt[]): Pt[] {
  const n = ring.length;
  if (n > 1 && ring[0]!.x === ring[n - 1]!.x && ring[0]!.y === ring[n - 1]!.y) return ring.slice(0, n - 1);
  return ring.slice();
}

function segmentsProperlyIntersect(a: Pt, b: Pt, c: Pt, d: Pt): boolean {
  const o = (p: Pt, q: Pt, r: Pt): number => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  const o1 = o(a, b, c);
  const o2 = o(a, b, d);
  const o3 = o(c, d, a);
  const o4 = o(c, d, b);
  return ((o1 > 0 && o2 < 0) || (o1 < 0 && o2 > 0)) && ((o3 > 0 && o4 < 0) || (o3 < 0 && o4 > 0));
}

/** Does the segment `p–q` properly cross any edge of any ring? (Touching an end point is not crossing.) */
function crossesAny(p: Pt, q: Pt, rings: readonly (readonly Pt[])[]): boolean {
  for (const ring of rings) {
    for (let i = 0, n = ring.length; i < n; i++) {
      const a = ring[i]!;
      const b = ring[(i + 1) % n]!;
      if (segmentsProperlyIntersect(p, q, a, b)) return true;
    }
  }
  return false;
}

/**
 * One closed ring that fills `outer` minus `holes`: each hole is joined to the
 * outer boundary by a bridge from its right-most vertex to the nearest outer
 * vertex it can see without crossing any boundary. Rings are open (no repeated
 * first point). The outer ring keeps its direction; holes are wound the other way
 * so a non-zero fill leaves them empty. A hole that cannot be bridged is skipped.
 */
export function keyholeRing(outerIn: readonly Pt[], holesIn: readonly (readonly Pt[])[]): Pt[] {
  const outer = openRing(outerIn);
  if (outer.length < 3) return [];
  const sign = Math.sign(signedArea(outer)) || 1;
  const holes = holesIn
    .map((h) => openRing(h))
    .filter((h) => h.length >= 3)
    // Opposite winding to the outer ring.
    .map((h) => (Math.sign(signedArea(h)) === sign ? h.slice().reverse() : h));

  const boundaries: Pt[][] = [outer, ...holes];
  let ring = outer.slice();

  // Right-most holes first: they are the easiest to see from the outside.
  const order = holes.map((h, i) => ({ h, i, x: Math.max(...h.map((p) => p.x)) })).sort((a, b) => b.x - a.x);

  for (const { h } of order) {
    // The hole's right-most vertex.
    let hi = 0;
    for (let i = 1; i < h.length; i++) if (h[i]!.x > h[hi]!.x) hi = i;
    const hp = h[hi]!;

    // Candidates: ring vertices by distance; take the first that sees the hole vertex.
    const candidates = ring.map((p, i) => ({ p, i, d: (p.x - hp.x) ** 2 + (p.y - hp.y) ** 2 })).sort((a, b) => a.d - b.d);
    const seen = candidates.find((c) => !crossesAny(hp, c.p, boundaries));
    if (!seen) continue;

    const rotated = [...h.slice(hi), ...h.slice(0, hi), hp];
    ring = [...ring.slice(0, seen.i + 1), ...rotated, ring[seen.i]!, ...ring.slice(seen.i + 1)];
  }
  return ring;
}

/** Point in a single ring (even-odd). */
export function pointInRing(x: number, y: number, ring: readonly Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i]!;
    const b = ring[j]!;
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

/** Point in a polygon with holes: inside the outer ring and outside every hole. */
export function pointInPolygon(x: number, y: number, rings: readonly (readonly Pt[])[]): boolean {
  if (rings.length === 0 || !pointInRing(x, y, rings[0]!)) return false;
  for (let i = 1; i < rings.length; i++) if (pointInRing(x, y, rings[i]!)) return false;
  return true;
}

/** Distance from a point to a segment. */
export function distanceToSegment(x: number, y: number, a: Pt, b: Pt): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / len2));
  return Math.hypot(x - (a.x + t * dx), y - (a.y + t * dy));
}

/** Distance from a point to a polyline. */
export function distanceToLine(x: number, y: number, line: readonly Pt[]): number {
  let best = Infinity;
  for (let i = 0; i + 1 < line.length; i++) best = Math.min(best, distanceToSegment(x, y, line[i]!, line[i + 1]!));
  return best;
}

/** A ground radius in kilometres as world units at `lat`. */
export function radiusKmToWorld(km: number, lat: number): number {
  return km * 1000 * worldUnitsPerMetre(lat);
}

/** The prepared form of one feature: world geometry, ready to publish and to hit-test. */
export type Prepared =
  | { kind: 'polygons'; polygons: Pt[][][] }
  | { kind: 'lines'; lines: Pt[][] }
  | { kind: 'point'; at: Pt; lat: number };

/** Why a geometry was refused, or `null` when it is drawable. */
export function validateGeometry(g: GeoGeometry): string | null {
  const finite = (p: Position): boolean => Number.isFinite(p[0]) && Number.isFinite(p[1]);
  switch (g.type) {
    case 'Point':
      return finite(g.coordinates) ? null : 'a Point has a non-finite coordinate';
    case 'LineString':
      return g.coordinates.length >= 2 && g.coordinates.every(finite) ? null : 'a LineString needs at least 2 finite positions';
    case 'MultiLineString':
      return g.coordinates.length > 0 && g.coordinates.every((l) => l.length >= 2 && l.every(finite))
        ? null
        : 'a MultiLineString needs lines of at least 2 finite positions';
    case 'Polygon':
      return polygonOk(g.coordinates) ? null : 'a Polygon needs rings of at least 4 finite positions (closed)';
    case 'MultiPolygon':
      return g.coordinates.length > 0 && g.coordinates.every(polygonOk) ? null : 'a MultiPolygon needs valid polygons';
    default:
      return `unsupported geometry`;
  }
  function polygonOk(rings: readonly (readonly Position[])[]): boolean {
    return rings.length > 0 && rings.every((r) => r.length >= 4 && r.every(finite));
  }
}

/** Project a drawable geometry to world coordinates. */
export function prepare(g: GeoGeometry): Prepared {
  switch (g.type) {
    case 'Point':
      return { kind: 'point', at: projectLngLat([g.coordinates[0], g.coordinates[1]]), lat: g.coordinates[1] };
    case 'LineString':
      return { kind: 'lines', lines: [projectRing(g.coordinates)] };
    case 'MultiLineString':
      return { kind: 'lines', lines: g.coordinates.map(projectRing) };
    case 'Polygon':
      return { kind: 'polygons', polygons: [g.coordinates.map(projectRing)] };
    case 'MultiPolygon':
      return { kind: 'polygons', polygons: g.coordinates.map((poly) => poly.map(projectRing)) };
    default:
      return { kind: 'lines', lines: [] };
  }
}

/** Axis-aligned bounds of points, or `null` when empty. */
export function boundsOf(points: readonly Pt[]): { x: number; y: number; w: number; h: number } | null {
  if (points.length === 0) return null;
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const p of points) {
    if (p.x < x0) x0 = p.x;
    if (p.y < y0) y0 = p.y;
    if (p.x > x1) x1 = p.x;
    if (p.y > y1) y1 = p.y;
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/** Centre-relative copy of points, plus the centre they are relative to (a `PathSpec`'s convention). */
export function centred(points: readonly Pt[]): { cx: number; cy: number; points: Pt[] } {
  const b = boundsOf(points)!;
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  return { cx, cy, points: points.map((p) => ({ x: p.x - cx, y: p.y - cy })) };
}

/** World units across the earth at zoom 0 — re-exported so callers need one import. */
export const WORLD = WORLD_SIZE;
