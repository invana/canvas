/**
 * Reusable polyline drawing primitives for decorations.
 */

import { Graphics } from 'pixi.js';

type Pt = { readonly x: number; readonly y: number };

/**
 * Stamp dashed segments along a CLOSED polyline (last point === first). Each
 * dash is emitted as one self-contained sub-path (`moveTo` + one or more
 * `lineTo`s through any corners it crosses). When a dash spans the closing
 * seam, the trailing portion continues into a second arc with no `moveTo`
 * between the two — Pixi joins them at `poly[0]` as a regular polyline
 * vertex, so there's no doubled butt-cap and no per-tick polyline rotation.
 *
 * Caller issues `g.stroke({...})` afterwards. Scale `dashLen` / `gapLen` so
 * the perimeter is an exact integer multiple of `dashLen + gapLen` first —
 * otherwise the dash phase jumps where the loop closes.
 */
export function drawDashedPolylineClosed(
  g: Graphics,
  poly: ReadonlyArray<Pt>,
  dashLen: number,
  gapLen: number,
  offset: number,
): void {
  const cycle = dashLen + gapLen;
  if (cycle <= 0 || poly.length < 3 || dashLen <= 0) return;
  const N = poly.length - 1;

  const segLens: number[] = new Array(N);
  let perimeter = 0;
  for (let i = 0; i < N; i++) {
    const a = poly[i]!;
    const b = poly[i + 1]!;
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    segLens[i] = len;
    perimeter += len;
  }
  if (perimeter <= 0) return;

  // Phase normalization: at arc-length `s`, dash phase = (s - offset) mod cycle.
  // The first dash that lies (at least partially) in [0, perimeter) starts at
  // arc-length `firstDashStart` ∈ [0, cycle).
  const normOffset = ((offset % cycle) + cycle) % cycle;
  const firstDashStart = normOffset === 0 ? 0 : cycle - normOffset;

  // Number of dashes that fit around the perimeter, given perimeter is
  // pre-snapped to an integer multiple of `cycle` by the caller.
  const numDashes = Math.max(1, Math.round(perimeter / cycle));

  for (let k = 0; k < numDashes; k++) {
    let dashStart = (firstDashStart + k * cycle) % perimeter;
    let dashEnd = dashStart + dashLen;
    if (dashEnd <= perimeter) {
      emitArc(g, poly, segLens, dashStart, dashEnd, false);
    } else {
      // Dash wraps the seam — emit it as two connected arcs joined at poly[0].
      emitArc(g, poly, segLens, dashStart, perimeter, false);
      emitArc(g, poly, segLens, 0, dashEnd - perimeter, true);
    }
  }
}

/**
 * Emit one dash arc from arc-length `from` to `to` along `poly`. When
 * `continueDash` is true, skip the leading `moveTo` so the new arc joins
 * the existing sub-path at `poly[0]` (used for seam-wrapped dashes).
 */
function emitArc(
  g: Graphics,
  poly: ReadonlyArray<Pt>,
  segLens: ReadonlyArray<number>,
  from: number,
  to: number,
  continueDash: boolean,
): void {
  if (to <= from) return;

  // Locate segment + local offset for `from`.
  let acc = 0;
  let segIdx = 0;
  while (segIdx < segLens.length - 1 && acc + segLens[segIdx]! <= from) {
    acc += segLens[segIdx]!;
    segIdx++;
  }
  let local = from - acc;

  if (!continueDash) {
    const a = poly[segIdx]!;
    const b = poly[segIdx + 1]!;
    const segLen = segLens[segIdx]!;
    if (segLen <= 0) return;
    const ux = (b.x - a.x) / segLen;
    const uy = (b.y - a.y) / segLen;
    g.moveTo(a.x + ux * local, a.y + uy * local);
  }

  let remaining = to - from;
  while (remaining > 0 && segIdx < segLens.length) {
    const a = poly[segIdx]!;
    const b = poly[segIdx + 1]!;
    const segLen = segLens[segIdx]!;
    if (segLen <= 0) {
      segIdx++;
      local = 0;
      continue;
    }
    const ux = (b.x - a.x) / segLen;
    const uy = (b.y - a.y) / segLen;
    const stepInSeg = Math.min(remaining, segLen - local);
    g.lineTo(a.x + ux * (local + stepInSeg), a.y + uy * (local + stepInSeg));
    remaining -= stepInSeg;
    local += stepInSeg;
    if (local >= segLen - 1e-9) {
      segIdx++;
      local = 0;
    }
  }
}

/**
 * Stamp dashed segments along an open polyline. Walks segment-by-segment with
 * a cumulative arc-length cursor. Dashes that span a polyline corner are
 * drawn as a single continuous path (one moveTo + multiple lineTo's) so Pixi
 * applies a proper line join at the corner instead of separate butt-cap
 * end-pieces that create a double-cap flicker artifact.
 *
 * For closed polylines (last === first), prefer `drawDashedPolylineClosed`,
 * which also handles seam wrap so dashes never break at the closing point.
 */
export function drawDashedPolyline(
  g: Graphics,
  poly: ReadonlyArray<Pt>,
  dashLen: number,
  gapLen: number,
  offset: number,
): void {
  const cycle = dashLen + gapLen;
  if (cycle <= 0) return;
  let s = -offset;
  let dashOpen = false;

  for (let i = 0; i < poly.length - 1; i++) {
    const a = poly[i]!;
    const b = poly[i + 1]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const segLen = Math.hypot(dx, dy);
    if (segLen === 0) continue;
    const ux = dx / segLen;
    const uy = dy / segLen;

    let local = 0;
    while (local < segLen) {
      const within = (((s + local) % cycle) + cycle) % cycle;
      const isDash = within < dashLen;
      const remainingInPhase = isDash ? dashLen - within : cycle - within;
      const step = Math.min(remainingInPhase, segLen - local);

      if (isDash) {
        const px = a.x + ux * local;
        const py = a.y + uy * local;
        const ex = a.x + ux * (local + step);
        const ey = a.y + uy * (local + step);
        if (!dashOpen) {
          g.moveTo(px, py);
          dashOpen = true;
        }
        g.lineTo(ex, ey);
      } else {
        dashOpen = false;
      }

      const prev = local;
      local += step;
      if (local === prev) {
        // FP stall: step is sub-ULP at this magnitude — close the dash so
        // the next segment doesn't get a wrong lineTo continuation.
        dashOpen = false;
        break;
      }
    }
    s += segLen;
  }
}
