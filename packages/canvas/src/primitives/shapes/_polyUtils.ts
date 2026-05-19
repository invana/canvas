/**
 * Polygon math helpers shared by `PolygonShape`, `RegularPolygonShape`, and
 * `StarShape`. Pure functions, no `pixi.js` imports — everything operates on
 * plain `{x, y}` vertex arrays in shape-local space.
 *
 * Convention: all vertex arrays here are **centre-relative** — the silhouette
 * is traced around the origin so that `boundaryIntersect` (which receives
 * centre-relative input) works without an extra translation step.
 */

import type { Point, Rect } from '../types';

/** Tight axis-aligned bounding box around the vertex list. */
export function polygonBounds(vertices: ReadonlyArray<Point>): Rect {
  if (vertices.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  let minX = vertices[0]!.x;
  let maxX = minX;
  let minY = vertices[0]!.y;
  let maxY = minY;
  for (let i = 1; i < vertices.length; i++) {
    const v = vertices[i]!;
    if (v.x < minX) minX = v.x;
    else if (v.x > maxX) maxX = v.x;
    if (v.y < minY) minY = v.y;
    else if (v.y > maxY) maxY = v.y;
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/**
 * Even-odd ray-cast point-in-polygon test. Handles convex and concave
 * silhouettes. Treats the polygon as closed (last vertex implicitly
 * connects to first).
 */
export function pointInPolygon(
  localX: number,
  localY: number,
  vertices: ReadonlyArray<Point>,
): boolean {
  const n = vertices.length;
  if (n < 3) return false;
  let inside = false;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const vi = vertices[i]!;
    const vj = vertices[j]!;
    const intersects =
      vi.y > localY !== vj.y > localY &&
      localX < ((vj.x - vi.x) * (localY - vi.y)) / (vj.y - vi.y) + vi.x;
    if (intersects) inside = !inside;
  }
  return inside;
}

/**
 * Parallel-offset a closed polygon by `distance` along each edge's inward
 * normal. Positive `distance` shrinks (inset); negative grows (outset).
 *
 * Each vertex is moved along the **bisector** of its two adjacent edge
 * normals, scaled so the perpendicular offset along the edges equals
 * `distance`. Sufficient for convex and mildly concave silhouettes — the
 * regular-polygon and star convenience kinds always produce well-behaved
 * shapes, free-form `PolygonShape` insets are best-effort and may
 * self-intersect at extreme concavities.
 */
export function offsetPolygon(
  vertices: ReadonlyArray<Point>,
  distance: number,
): Point[] {
  const n = vertices.length;
  if (n < 3 || distance === 0) return vertices.map((v) => ({ x: v.x, y: v.y }));

  // Inward normal of edge (a → b) for a clockwise polygon is (dy, -dx)/len;
  // for counter-clockwise it's (-dy, dx)/len. We don't know orientation up
  // front, so compute the signed area and flip accordingly.
  const ccw = signedArea(vertices) > 0;

  const out: Point[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const prev = vertices[(i + n - 1) % n]!;
    const curr = vertices[i]!;
    const next = vertices[(i + 1) % n]!;

    const e1 = unitNormal(prev, curr, ccw);
    const e2 = unitNormal(curr, next, ccw);

    // Bisector = sum of the two edge normals. Scale to preserve perpendicular
    // distance: divide by (1 + n1·n2) / |n1+n2|² … which simplifies to
    // distance / (1 + n1·n2) when |n1| = |n2| = 1 (both unit normals).
    const bx = e1.x + e2.x;
    const by = e1.y + e2.y;
    const dot = e1.x * e2.x + e1.y * e2.y;
    const denom = 1 + dot;
    // `denom` collapses to ~0 at a 180° spike — fall back to the edge normal
    // to avoid blowing up the offset vertex.
    if (Math.abs(denom) < 1e-6) {
      out[i] = { x: curr.x + e1.x * distance, y: curr.y + e1.y * distance };
    } else {
      const k = distance / denom;
      out[i] = { x: curr.x + bx * k, y: curr.y + by * k };
    }
  }
  return out;
}

/**
 * Vertices of a regular polygon with `sides` sides and circum-radius
 * `radius`, centred at the origin. `rotationRad` is added to the base angle.
 *
 * Base placement: first vertex at angle `-π/2 + rotationRad` (straight up).
 * So with `rotation = 0`: triangle (sides=3) points up, pentagon points up,
 * hexagon has a vertex at the top (pointy-top). For a flat-top hexagon, pass
 * `rotation = Math.PI / 6`.
 */
export function regularPolygonVertices(
  sides: number,
  radius: number,
  rotationRad: number,
): Point[] {
  const n = Math.max(3, Math.floor(sides));
  const out: Point[] = new Array(n);
  const base = -Math.PI / 2 + rotationRad;
  const step = (Math.PI * 2) / n;
  for (let i = 0; i < n; i++) {
    const a = base + i * step;
    out[i] = { x: Math.cos(a) * radius, y: Math.sin(a) * radius };
  }
  return out;
}

/**
 * Vertices of a star with `points` outer points, alternating outer
 * (`outerRadius`) and inner (`innerRadius`) vertices around the origin.
 * `rotationRad` is added to the base angle.
 *
 * Base placement: first outer vertex at angle `-π/2 + rotationRad` (up).
 */
export function starVertices(
  points: number,
  innerRadius: number,
  outerRadius: number,
  rotationRad: number,
): Point[] {
  const p = Math.max(3, Math.floor(points));
  const total = p * 2;
  const out: Point[] = new Array(total);
  const base = -Math.PI / 2 + rotationRad;
  const step = Math.PI / p; // half of full angular step
  for (let i = 0; i < total; i++) {
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    const a = base + i * step;
    out[i] = { x: Math.cos(a) * r, y: Math.sin(a) * r };
  }
  return out;
}

/**
 * Ray from the origin toward `localFromCenter`, intersected with the polygon
 * silhouette. Returns the farthest hit (i.e. where the ray exits the
 * polygon) as a centre-relative point, or `null` if the ray doesn't cross
 * any edge.
 *
 * Used by `boundaryIntersect` to snap connector anchors to the exact
 * perimeter of polygonal shapes.
 */
export function rayPolygonIntersection(
  localFromCenter: Point,
  vertices: ReadonlyArray<Point>,
): Point | null {
  const n = vertices.length;
  if (n < 2) return null;
  const dx = localFromCenter.x;
  const dy = localFromCenter.y;
  if (dx === 0 && dy === 0) return null;

  let bestT = -Infinity;
  let hit: Point | null = null;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const a = vertices[j]!;
    const b = vertices[i]!;
    const ex = b.x - a.x;
    const ey = b.y - a.y;
    // Solve [dx -ex] [t] = [a.x]
    //       [dy -ey] [u]   [a.y]
    const denom = dx * -ey - dy * -ex;
    if (denom === 0) continue;
    const t = (a.x * -ey - a.y * -ex) / denom;
    const u = (dx * a.y - dy * a.x) / denom;
    if (t >= 0 && u >= 0 && u <= 1 && t > bestT) {
      bestT = t;
      hit = { x: dx * t, y: dy * t };
    }
  }
  return hit;
}

// ─── Internals ─────────────────────────────────────────────────────────────

function signedArea(vertices: ReadonlyArray<Point>): number {
  let sum = 0;
  const n = vertices.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const a = vertices[j]!;
    const b = vertices[i]!;
    sum += (b.x - a.x) * (b.y + a.y);
  }
  // Shoelace's signed area is half this sum, with sign flipped for screen
  // coordinates (y grows down). Positive return = counter-clockwise in
  // screen space.
  return -sum * 0.5;
}

function unitNormal(a: Point, b: Point, ccw: boolean): Point {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  // Inward-facing perpendicular: rotate the edge vector by ±90°.
  // CCW polygon (screen space): inward = rotate edge left → (-dy, dx).
  // CW polygon: inward = rotate edge right → (dy, -dx).
  return ccw ? { x: -dy / len, y: dx / len } : { x: dy / len, y: -dx / len };
}
