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

import type { Path, PathCommand, Point, Rect, Vec2 } from '@invana/canvas-store';

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

/**
 * Combined point + unit-tangent sample at parameter `t ∈ [0, 1]` along the
 * path. Used by labels-along-path and any other decoration that needs both
 * the location and the local direction at the same parameter (e.g. for
 * `autoRotate`). Cheaper than calling `samplePath` + `tangentAt` separately
 * because it walks the polyline once.
 *
 * `t` is fractional in arc-length space — the function picks the segment of
 * the densified polyline whose cumulative length most closely matches `t *
 * totalLength` and linearly interpolates inside it. For most practical path
 * kinds this matches an analytical sample to within a pixel; orthogonal
 * paths reproduce segment endpoints exactly.
 */
export function samplePathAt(path: Path, t: number): { point: Point; tangent: Vec2 } {
  const samples = samplePath(path);
  if (samples.length === 0) return { point: { x: 0, y: 0 }, tangent: { x: 1, y: 0 } };
  if (samples.length === 1) return { point: samples[0]!, tangent: { x: 1, y: 0 } };

  // Compute cumulative arc length once.
  let total = 0;
  const cum = new Array<number>(samples.length);
  cum[0] = 0;
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1]!;
    const b = samples[i]!;
    total += Math.hypot(b.x - a.x, b.y - a.y);
    cum[i] = total;
  }

  if (total <= 0) {
    return { point: samples[0]!, tangent: { x: 1, y: 0 } };
  }

  const clamped = t <= 0 ? 0 : t >= 1 ? 1 : t;
  const target = clamped * total;

  // Binary search for the segment containing `target`.
  let lo = 0;
  let hi = samples.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >>> 1;
    if (cum[mid]! <= target) lo = mid;
    else hi = mid;
  }
  const a = samples[lo]!;
  const b = samples[lo + 1]!;
  const segLen = cum[lo + 1]! - cum[lo]!;
  const u = segLen > 0 ? (target - cum[lo]!) / segLen : 0;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return {
    point: { x: a.x + dx * u, y: a.y + dy * u },
    tangent: normalize(dx, dy),
  };
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
 * Pull the path's start / end anchors inward by the requested arc-length
 * insets so the connector body stops short of where its markers will be
 * drawn. Markers themselves still anchor at the *original* endpoints (their
 * tips touch the target) — only the body is shortened.
 *
 * Correctness:
 *   - `L` segments are trimmed in closed form (exact).
 *   - `Q` / `C` segments are trimmed by walking arc length over a fine
 *     sub-step table, refining the parameter `t` between bracketing samples,
 *     and **De Casteljau subdividing** the curve at `t`. The kept half is
 *     emitted as a new `Q` / `C` command, preserving correct curvature on
 *     tight bends — chord-along-tangent approximation would diverge.
 *   - When an inset exceeds the trailing segment's arc length, the segment
 *     is consumed entirely and the trim continues into the prior segment.
 *
 * v0 only ships the `straight` router, so curve trimming is forward-looking
 * scaffolding for the upcoming `bezier` / `orthogonal` routers.
 */
export function trimPathEnds(path: Path, startInset: number, endInset: number): Path {
  if (path.length < 2) return path;
  if (startInset <= 0 && endInset <= 0) return path;

  let result: PathCommand[] = path.slice();

  if (endInset > 0) {
    result = trimPathEnd(result, endInset);
    if (result.length < 2) return result;
  }

  if (startInset > 0) {
    result = trimPathStart(result, startInset);
  }

  return result;
}

// ─── Internals ─────────────────────────────────────────────────────────────

/** Substeps used during arc-length trim — finer than display sampling. */
const TRIM_QUAD_STEPS = 24;
const TRIM_CUBIC_STEPS = 32;

/**
 * Trim `remaining` pixels from the end of the path, consuming whole segments
 * when they're shorter than what's left to remove. Returns a fresh
 * `PathCommand[]`. If the inset exceeds the path's total length, returns the
 * leading `M` (degenerate but well-formed).
 */
function trimPathEnd(path: PathCommand[], remaining: number): PathCommand[] {
  let work = path.slice();
  while (work.length >= 2 && remaining > 0) {
    const tail = work[work.length - 1]!;
    const prev = anchorBefore(work, work.length - 1);
    const segLen = segmentLength(prev, tail);

    if (segLen <= 0) {
      // Degenerate segment — drop it and continue.
      work.pop();
      continue;
    }

    if (remaining >= segLen) {
      // Consume the whole segment and continue trimming into the prior one.
      remaining -= segLen;
      work.pop();
      continue;
    }

    // Partial trim: clip the tail at arc-length distance `segLen - remaining`
    // from `prev`. The result is a fresh segment whose end anchor sits at
    // that interior point.
    const keepLen = segLen - remaining;
    work[work.length - 1] = clipSegmentEnd(prev, tail, keepLen);
    remaining = 0;
  }
  return work;
}

/**
 * Trim `remaining` pixels from the start of the path. Walks forward from
 * the leading `M`, dropping commands whose arc length is fully consumed and
 * partially clipping the first segment that survives.
 */
function trimPathStart(path: PathCommand[], remaining: number): PathCommand[] {
  if (path.length < 2) return path;
  const first = path[0];
  if (!first || first.kind !== 'M') return path;

  let cursor: Point = { x: first.x, y: first.y };
  let i = 1;
  while (i < path.length && remaining > 0) {
    const seg = path[i]!;
    const segLen = segmentLength(cursor, seg);

    if (segLen <= 0) {
      // Degenerate — advance cursor (without dropping; preserves anchor flow).
      cursor = endpointOf(seg, cursor);
      i++;
      continue;
    }

    if (remaining >= segLen) {
      remaining -= segLen;
      cursor = endpointOf(seg, cursor);
      i++;
      continue;
    }

    // Partial trim: split at arc-length `remaining` from cursor and keep
    // the back half. The new `M` lands at the split point.
    const split = clipSegmentStart(cursor, seg, remaining);
    const head: PathCommand[] = [{ kind: 'M', x: split.start.x, y: split.start.y }, split.tail];
    return head.concat(path.slice(i + 1));
  }

  // The inset consumed every segment — collapse to a bare moveTo at the
  // last anchor we walked through.
  return [{ kind: 'M', x: cursor.x, y: cursor.y }];
}

/**
 * Replace `seg` with a new segment that runs from `start` to the point on
 * `seg` at arc length `keepLen` (measured from `start`). For `Q` / `C`
 * segments, sub-divides via De Casteljau at the parameter t found by walking
 * the sampled arc-length table.
 */
function clipSegmentEnd(start: Point, seg: PathCommand, keepLen: number): PathCommand {
  switch (seg.kind) {
    case 'L': {
      const dx = seg.x - start.x;
      const dy = seg.y - start.y;
      const len = Math.hypot(dx, dy);
      if (len === 0) return seg;
      const u = keepLen / len;
      return { kind: 'L', x: start.x + dx * u, y: start.y + dy * u };
    }
    case 'Q': {
      const t = quadParamAtArcLength(start, seg, keepLen);
      const split = subdivideQuad(start, seg, t);
      return { kind: 'Q', cx: split.head.cx, cy: split.head.cy, x: split.head.x, y: split.head.y };
    }
    case 'C': {
      const t = cubicParamAtArcLength(start, seg, keepLen);
      const split = subdivideCubic(start, seg, t);
      return {
        kind: 'C',
        c1x: split.head.c1x, c1y: split.head.c1y,
        c2x: split.head.c2x, c2y: split.head.c2y,
        x: split.head.x, y: split.head.y,
      };
    }
    case 'M':
      return seg;
  }
}

/**
 * Split `seg` at arc length `dropLen` from `start` and return both halves,
 * along with the new start anchor for the back half. Used by start-trim.
 */
function clipSegmentStart(
  start: Point,
  seg: PathCommand,
  dropLen: number,
): { start: Point; tail: PathCommand } {
  switch (seg.kind) {
    case 'L': {
      const dx = seg.x - start.x;
      const dy = seg.y - start.y;
      const len = Math.hypot(dx, dy);
      if (len === 0) return { start, tail: seg };
      const u = dropLen / len;
      const splitPoint = { x: start.x + dx * u, y: start.y + dy * u };
      return { start: splitPoint, tail: { kind: 'L', x: seg.x, y: seg.y } };
    }
    case 'Q': {
      const t = quadParamAtArcLength(start, seg, dropLen);
      const split = subdivideQuad(start, seg, t);
      return {
        start: { x: split.head.x, y: split.head.y },
        tail: { kind: 'Q', cx: split.tail.cx, cy: split.tail.cy, x: split.tail.x, y: split.tail.y },
      };
    }
    case 'C': {
      const t = cubicParamAtArcLength(start, seg, dropLen);
      const split = subdivideCubic(start, seg, t);
      return {
        start: { x: split.head.x, y: split.head.y },
        tail: {
          kind: 'C',
          c1x: split.tail.c1x, c1y: split.tail.c1y,
          c2x: split.tail.c2x, c2y: split.tail.c2y,
          x: split.tail.x, y: split.tail.y,
        },
      };
    }
    case 'M':
      return { start, tail: seg };
  }
}

/**
 * Total arc length of a single segment from `start` to its endpoint.
 * Straight segments use Euclidean distance; curved segments accumulate
 * chord lengths over a fixed substep count.
 */
function segmentLength(start: Point, seg: PathCommand): number {
  switch (seg.kind) {
    case 'L':
      return Math.hypot(seg.x - start.x, seg.y - start.y);
    case 'Q': {
      let total = 0;
      let px = start.x, py = start.y;
      for (let i = 1; i <= TRIM_QUAD_STEPS; i++) {
        const t = i / TRIM_QUAD_STEPS;
        const mt = 1 - t;
        const x = mt * mt * start.x + 2 * mt * t * seg.cx + t * t * seg.x;
        const y = mt * mt * start.y + 2 * mt * t * seg.cy + t * t * seg.y;
        total += Math.hypot(x - px, y - py);
        px = x; py = y;
      }
      return total;
    }
    case 'C': {
      let total = 0;
      let px = start.x, py = start.y;
      for (let i = 1; i <= TRIM_CUBIC_STEPS; i++) {
        const t = i / TRIM_CUBIC_STEPS;
        const mt = 1 - t;
        const x = mt * mt * mt * start.x + 3 * mt * mt * t * seg.c1x + 3 * mt * t * t * seg.c2x + t * t * t * seg.x;
        const y = mt * mt * mt * start.y + 3 * mt * mt * t * seg.c1y + 3 * mt * t * t * seg.c2y + t * t * t * seg.y;
        total += Math.hypot(x - px, y - py);
        px = x; py = y;
      }
      return total;
    }
    case 'M':
      return 0;
  }
}

function endpointOf(seg: PathCommand, fallback: Point): Point {
  if (seg.kind === 'M' || seg.kind === 'L' || seg.kind === 'Q' || seg.kind === 'C') {
    return { x: seg.x, y: seg.y };
  }
  return fallback;
}

/** Walk the quadratic and find `t` where cumulative arc length ≈ targetLen. */
function quadParamAtArcLength(
  start: Point,
  seg: { cx: number; cy: number; x: number; y: number },
  targetLen: number,
): number {
  let prevX = start.x, prevY = start.y;
  let acc = 0;
  for (let i = 1; i <= TRIM_QUAD_STEPS; i++) {
    const t = i / TRIM_QUAD_STEPS;
    const mt = 1 - t;
    const x = mt * mt * start.x + 2 * mt * t * seg.cx + t * t * seg.x;
    const y = mt * mt * start.y + 2 * mt * t * seg.cy + t * t * seg.y;
    const step = Math.hypot(x - prevX, y - prevY);
    if (acc + step >= targetLen) {
      const frac = step === 0 ? 0 : (targetLen - acc) / step;
      const tPrev = (i - 1) / TRIM_QUAD_STEPS;
      return tPrev + (t - tPrev) * frac;
    }
    acc += step;
    prevX = x; prevY = y;
  }
  return 1;
}

/** Walk the cubic and find `t` where cumulative arc length ≈ targetLen. */
function cubicParamAtArcLength(
  start: Point,
  seg: { c1x: number; c1y: number; c2x: number; c2y: number; x: number; y: number },
  targetLen: number,
): number {
  let prevX = start.x, prevY = start.y;
  let acc = 0;
  for (let i = 1; i <= TRIM_CUBIC_STEPS; i++) {
    const t = i / TRIM_CUBIC_STEPS;
    const mt = 1 - t;
    const x = mt * mt * mt * start.x + 3 * mt * mt * t * seg.c1x + 3 * mt * t * t * seg.c2x + t * t * t * seg.x;
    const y = mt * mt * mt * start.y + 3 * mt * mt * t * seg.c1y + 3 * mt * t * t * seg.c2y + t * t * t * seg.y;
    const step = Math.hypot(x - prevX, y - prevY);
    if (acc + step >= targetLen) {
      const frac = step === 0 ? 0 : (targetLen - acc) / step;
      const tPrev = (i - 1) / TRIM_CUBIC_STEPS;
      return tPrev + (t - tPrev) * frac;
    }
    acc += step;
    prevX = x; prevY = y;
  }
  return 1;
}

/**
 * De Casteljau subdivision for a quadratic Bézier at parameter `t`.
 * Returns the two halves: `head` runs from `start` to the split point,
 * `tail` runs from the split point to the original endpoint. Each half is
 * itself a valid quadratic.
 */
function subdivideQuad(
  start: Point,
  seg: { cx: number; cy: number; x: number; y: number },
  t: number,
): {
  head: { cx: number; cy: number; x: number; y: number };
  tail: { cx: number; cy: number; x: number; y: number };
} {
  const p0 = start, p1 = { x: seg.cx, y: seg.cy }, p2 = { x: seg.x, y: seg.y };
  const a = lerp(p0, p1, t);
  const b = lerp(p1, p2, t);
  const m = lerp(a, b, t);
  return {
    head: { cx: a.x, cy: a.y, x: m.x, y: m.y },
    tail: { cx: b.x, cy: b.y, x: p2.x, y: p2.y },
  };
}

/**
 * De Casteljau subdivision for a cubic Bézier at parameter `t`.
 * Returns the two halves as cubic segments.
 */
function subdivideCubic(
  start: Point,
  seg: { c1x: number; c1y: number; c2x: number; c2y: number; x: number; y: number },
  t: number,
): {
  head: { c1x: number; c1y: number; c2x: number; c2y: number; x: number; y: number };
  tail: { c1x: number; c1y: number; c2x: number; c2y: number; x: number; y: number };
} {
  const p0 = start;
  const p1 = { x: seg.c1x, y: seg.c1y };
  const p2 = { x: seg.c2x, y: seg.c2y };
  const p3 = { x: seg.x, y: seg.y };
  const a = lerp(p0, p1, t);
  const b = lerp(p1, p2, t);
  const c = lerp(p2, p3, t);
  const d = lerp(a, b, t);
  const e = lerp(b, c, t);
  const m = lerp(d, e, t);
  return {
    head: { c1x: a.x, c1y: a.y, c2x: d.x, c2y: d.y, x: m.x, y: m.y },
    tail: { c1x: e.x, c1y: e.y, c2x: c.x, c2y: c.y, x: p3.x, y: p3.y },
  };
}

function lerp(a: Point, b: Point, t: number): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

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
    case 'Q': {
      // Tangent at t=1 of a quadratic is 2·(P2 − P1). Degenerate when the
      // control point coincides with the endpoint — walk back one leg.
      const dx = last.x - last.cx;
      const dy = last.y - last.cy;
      const chordDx = last.x - prevAnchor.x;
      const chordDy = last.y - prevAnchor.y;
      if (isDegenerateLeg(dx, dy, chordDx, chordDy)) {
        return normalize(chordDx, chordDy);
      }
      return normalize(dx, dy);
    }
    case 'C': {
      // Tangent at t=1 of a cubic is 3·(P3 − P2). When the c2 → endpoint
      // leg is vanishingly short relative to the c1 → c2 leg (e.g. a polar
      // d3.linkRadial curve whose endpoints sit at near-equal radii from
      // the polar origin), that direction is ill-conditioned and bears no
      // resemblance to the curve's visual approach. Fall back to the
      // c1 → endpoint direction, which carries the dominant angular sweep.
      const dx = last.x - last.c2x;
      const dy = last.y - last.c2y;
      const c1dx = last.x - last.c1x;
      const c1dy = last.y - last.c1y;
      if (isDegenerateLeg(dx, dy, c1dx, c1dy)) {
        if (c1dx !== 0 || c1dy !== 0) return normalize(c1dx, c1dy);
        return normalize(last.x - prevAnchor.x, last.y - prevAnchor.y);
      }
      return normalize(dx, dy);
    }
  }
}

// A terminal Bézier handle is "degenerate" when its length is less than 1%
// of the preceding control-polygon leg. Compared squared to avoid sqrts.
function isDegenerateLeg(
  legDx: number, legDy: number,
  refDx: number, refDy: number,
): boolean {
  const legSq = legDx * legDx + legDy * legDy;
  const refSq = refDx * refDx + refDy * refDy;
  return refSq > 0 && legSq * 10000 < refSq;
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
