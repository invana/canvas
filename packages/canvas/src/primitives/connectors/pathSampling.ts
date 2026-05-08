/**
 * Path-walking utilities. Used by:
 *  - `PrimitivesRenderer.hitTest` — needs a polyline approximation of the
 *    path for distance-to-segment checks.
 *  - `ConnectorBase.paintMarkers` — needs the tangent angle at the source /
 *    target endpoints to orient marker shapes.
 *  - Any future connector decoration that walks arc length (e.g. label-along-
 *    path). Static / glow / halo decorations don't sample — they call
 *    `connector.paintInto(...)` for native-rendered silhouettes.
 *
 * For v0 the only router is `straight` (just `[M, L]`), so the sampling /
 * tangent paths are degenerate. The functions are written to handle the full
 * `Path` type so additional router kinds drop in without changes.
 */

import type { Path, PathCommand, Point, Rect, Vec2 } from '../types';

/** Substeps per Q/C segment when densifying. Higher = smoother polyline. */
const QUAD_STEPS = 12;
const CUBIC_STEPS = 16;

/**
 * Densify a `Path` into a flat polyline. Lines emit two endpoints per
 * segment; quadratic / cubic curves are sampled with fixed substep counts.
 * Returns at least the move-to point when the path has only one command.
 */
export function samplePath(path: Path): Point[] {
  const out: Point[] = [];
  if (path.length === 0) return out;

  let cx = 0;
  let cy = 0;

  for (const cmd of path) {
    switch (cmd.kind) {
      case 'M':
        out.push({ x: cmd.x, y: cmd.y });
        cx = cmd.x;
        cy = cmd.y;
        break;
      case 'L':
        out.push({ x: cmd.x, y: cmd.y });
        cx = cmd.x;
        cy = cmd.y;
        break;
      case 'Q':
        for (let i = 1; i <= QUAD_STEPS; i++) {
          const t = i / QUAD_STEPS;
          const mt = 1 - t;
          out.push({
            x: mt * mt * cx + 2 * mt * t * cmd.cx + t * t * cmd.x,
            y: mt * mt * cy + 2 * mt * t * cmd.cy + t * t * cmd.y,
          });
        }
        cx = cmd.x;
        cy = cmd.y;
        break;
      case 'C':
        for (let i = 1; i <= CUBIC_STEPS; i++) {
          const t = i / CUBIC_STEPS;
          const mt = 1 - t;
          out.push({
            x: mt * mt * mt * cx + 3 * mt * mt * t * cmd.c1x + 3 * mt * t * t * cmd.c2x + t * t * t * cmd.x,
            y: mt * mt * mt * cy + 3 * mt * mt * t * cmd.c1y + 3 * mt * t * t * cmd.c2y + t * t * t * cmd.y,
          });
        }
        cx = cmd.x;
        cy = cmd.y;
        break;
    }
  }

  return out;
}

/**
 * Compute the tangent unit vector at `t ∈ [0, 1]` along the path.
 * For v0 we only need `t = 0` (source) and `t = 1` (target) for marker
 * orientation; intermediate `t` is sampled via `samplePath` for now.
 */
export function tangentAt(path: Path, t: number): Vec2 {
  if (path.length < 2) return { x: 1, y: 0 };

  if (t <= 0) return tangentAtStart(path);
  if (t >= 1) return tangentAtEnd(path);

  // Approximate intermediate t via sampled polyline.
  const samples = samplePath(path);
  if (samples.length < 2) return { x: 1, y: 0 };
  const idx = Math.min(samples.length - 2, Math.floor(t * (samples.length - 1)));
  const a = samples[idx]!;
  const b = samples[idx + 1]!;
  return normalize(b.x - a.x, b.y - a.y);
}

/** AABB of the path's anchor + control points. Used by hit-test bbox indexing. */
export function pathBounds(path: Path): Rect {
  if (path.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const visit = (x: number, y: number): void => {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  };
  for (const cmd of path) {
    switch (cmd.kind) {
      case 'M':
      case 'L':
        visit(cmd.x, cmd.y);
        break;
      case 'Q':
        visit(cmd.cx, cmd.cy);
        visit(cmd.x, cmd.y);
        break;
      case 'C':
        visit(cmd.c1x, cmd.c1y);
        visit(cmd.c2x, cmd.c2y);
        visit(cmd.x, cmd.y);
        break;
    }
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/**
 * Pull the path's start / end anchors inward along their local tangents so
 * the connector body stops short of where its markers will be drawn. The
 * marker still anchors at the *original* endpoint (its tip touches the
 * target) — only the body is shortened.
 *
 * For straight (`L`) ends this is exact. For `Q` / `C` curve ends the
 * endpoint is shifted along the incoming tangent without rewalking arc
 * length — visually correct for short insets, approximate for long ones.
 * v0 only ships the `straight` router, so the curve cases are forward-
 * compatible scaffolding rather than a hot path.
 */
export function trimPathEnds(path: Path, startInset: number, endInset: number): Path {
  if (path.length < 2) return path;
  if (startInset <= 0 && endInset <= 0) return path;

  const first = path[0]!;
  if (first.kind !== 'M') return path;

  const result: PathCommand[] = path.slice();

  if (startInset > 0) {
    const t = tangentAtStart(path);
    result[0] = { kind: 'M', x: first.x + t.x * startInset, y: first.y + t.y * startInset };
  }

  if (endInset > 0) {
    const t = tangentAtEnd(path);
    const last = result[result.length - 1]!;
    switch (last.kind) {
      case 'L':
        result[result.length - 1] = {
          kind: 'L',
          x: last.x - t.x * endInset,
          y: last.y - t.y * endInset,
        };
        break;
      case 'Q':
        result[result.length - 1] = {
          kind: 'Q',
          cx: last.cx,
          cy: last.cy,
          x: last.x - t.x * endInset,
          y: last.y - t.y * endInset,
        };
        break;
      case 'C':
        result[result.length - 1] = {
          kind: 'C',
          c1x: last.c1x,
          c1y: last.c1y,
          c2x: last.c2x,
          c2y: last.c2y,
          x: last.x - t.x * endInset,
          y: last.y - t.y * endInset,
        };
        break;
      case 'M':
        // Bare moveTo at the tail — nothing to trim.
        break;
    }
  }

  return result;
}

// ─── Internals ─────────────────────────────────────────────────────────────

function tangentAtStart(path: Path): Vec2 {
  // Find the first non-M command; tangent points from M's anchor toward it.
  const m = path[0];
  if (!m || m.kind !== 'M') return { x: 1, y: 0 };
  const next = path[1];
  if (!next) return { x: 1, y: 0 };
  switch (next.kind) {
    case 'L':
      return normalize(next.x - m.x, next.y - m.y);
    case 'Q':
      return normalize(next.cx - m.x, next.cy - m.y);
    case 'C':
      return normalize(next.c1x - m.x, next.c1y - m.y);
    default:
      return { x: 1, y: 0 };
  }
}

function tangentAtEnd(path: Path): Vec2 {
  const last = path[path.length - 1];
  if (!last) return { x: 1, y: 0 };
  // Need the prior point (or control point) to compute the incoming tangent.
  const prevAnchor = anchorBefore(path, path.length - 1);
  switch (last.kind) {
    case 'M':
      return { x: 1, y: 0 };
    case 'L':
      return normalize(last.x - prevAnchor.x, last.y - prevAnchor.y);
    case 'Q':
      return normalize(last.x - last.cx, last.y - last.cy);
    case 'C':
      return normalize(last.x - last.c2x, last.y - last.c2y);
  }
}

function anchorBefore(path: Path, idx: number): Point {
  // Return the anchor point reached after executing path[0..idx-1].
  let x = 0, y = 0;
  for (let i = 0; i < idx; i++) {
    const c: PathCommand = path[i]!;
    if (c.kind === 'M' || c.kind === 'L' || c.kind === 'Q' || c.kind === 'C') {
      x = c.x;
      y = c.y;
    }
  }
  return { x, y };
}

function normalize(dx: number, dy: number): Vec2 {
  const len = Math.hypot(dx, dy);
  if (len === 0) return { x: 1, y: 0 };
  return { x: dx / len, y: dy / len };
}

/**
 * Squared minimum distance from `(px, py)` to any segment of the polyline.
 * Squared (no sqrt) so callers can compare against a squared tolerance —
 * faster + branch-free for the common no-hit case.
 */
export function distanceToPolylineSq(
  poly: ReadonlyArray<Point>,
  px: number,
  py: number,
): number {
  if (poly.length < 2) return Infinity;
  let best = Infinity;
  for (let i = 0; i < poly.length - 1; i++) {
    const a = poly[i]!;
    const b = poly[i + 1]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
    let t = lenSq === 0 ? 0 : ((px - a.x) * dx + (py - a.y) * dy) / lenSq;
    if (t < 0) t = 0;
    else if (t > 1) t = 1;
    const cx = a.x + dx * t;
    const cy = a.y + dy * t;
    const ex = px - cx;
    const ey = py - cy;
    const d = ex * ex + ey * ey;
    if (d < best) best = d;
  }
  return best;
}
