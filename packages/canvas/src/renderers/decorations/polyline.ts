/**
 * Reusable polyline drawing primitives for decorations.
 */

import { Graphics } from 'pixi.js';

type Pt = { readonly x: number; readonly y: number };

/**
 * Rotate a closed polyline so the new start sits at arc-length `sAlign`
 * measured from the current start point. The returned polyline is also closed
 * (first point duplicated at the end).
 *
 * Used by closed-loop dashed rendering: by rotating to a phase-zero (or
 * phase-equals-dashLen) position, the seam where the loop closes can be made
 * to land inside a gap rather than mid-dash, eliminating the abutting
 * butt-caps Pixi would otherwise stroke at the seam.
 *
 * Assumes input is closed (first point == last point) and has at least 3
 * unique vertices. Returns a copy of the input on degenerate cases.
 */
export function rotateClosedPolyline(poly: ReadonlyArray<Pt>, sAlign: number): Pt[] {
  if (poly.length < 3) return poly.map(p => ({ x: p.x, y: p.y }));
  const N = poly.length - 1;
  const segLens: number[] = new Array(N);
  let total = 0;
  for (let i = 0; i < N; i++) {
    const a = poly[i]!;
    const b = poly[i + 1]!;
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    segLens[i] = len;
    total += len;
  }
  if (total <= 0) return poly.map(p => ({ x: p.x, y: p.y }));

  const target = ((sAlign % total) + total) % total;
  if (target === 0) return poly.map(p => ({ x: p.x, y: p.y }));

  let segIdx = 0;
  let acc = 0;
  for (let i = 0; i < N; i++) {
    if (acc + segLens[i]! >= target) {
      segIdx = i;
      break;
    }
    acc += segLens[i]!;
  }
  const a = poly[segIdx]!;
  const b = poly[segIdx + 1]!;
  const segLen = segLens[segIdx]!;
  const t = segLen > 0 ? (target - acc) / segLen : 0;
  const startPt: Pt = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };

  const out: Pt[] = [{ x: startPt.x, y: startPt.y }];
  for (let k = 1; k <= N; k++) {
    const idx = (segIdx + k) % N;
    out.push({ x: poly[idx]!.x, y: poly[idx]!.y });
  }
  out.push({ x: startPt.x, y: startPt.y });
  return out;
}

/**
 * Stamp dashed segments along a polyline. Walks segment-by-segment with a
 * cumulative arc-length cursor. Dashes that span a polyline corner are drawn
 * as a single continuous path (one moveTo + multiple lineTo's) so Pixi
 * applies a proper line join at the corner instead of separate butt-cap
 * end-pieces that create a double-cap flicker artifact.
 *
 * Caller issues `g.stroke({...})` after to set the visual style. For a closed
 * polyline, scale `dashLen` / `gapLen` / `offset` so the perimeter is an exact
 * integer multiple of `dashLen + gapLen` first — otherwise the dash phase
 * jumps where the loop closes (most visible on circle/ellipse outlines).
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
