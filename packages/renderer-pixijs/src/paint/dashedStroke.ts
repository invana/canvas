/**
 * Dashed-stroke emitter. PixiJS v8's `g.stroke()` has no native dashed
 * support, so any shape / connector that needs a dashed silhouette routes
 * through here. The emitter walks a polyline cumulatively by arc length,
 * alternating dash / gap intervals; each in-dash segment is emitted as a
 * `moveTo` + `lineTo` pair. A single `g.stroke({...})` at the end paints
 * every dash uniformly.
 *
 * Callers:
 *   - `ShapeBase` subclasses sample their silhouette into points and call
 *     `emitDashedStroke(g, points, { closed: true, ... })`.
 *   - `Connector` densifies its routed `Path` via `samplePath(...)` and
 *     calls `emitDashedStroke(g, points, { closed: false, ... })`.
 *
 * `dashOffset` semantics: at arc length `s`, the position in the dash
 * cycle is `(s + dashOffset) mod (dash + gap)`. Negative `dashOffset`
 * shifts the pattern backward — which visually moves dashes forward along
 * the path, producing the "marching ants" effect for a continuously
 * decreasing offset.
 */

import type { Graphics } from 'pixi.js';
import type { Point } from '../types';

export interface DashedStrokeOptions {
  readonly color: number;
  readonly alpha?: number;
  readonly width: number;
  readonly dashArray: readonly [number, number];
  readonly dashOffset?: number;
  /** When `true`, an implicit closing segment joins last → first. */
  readonly closed?: boolean;
  readonly cap?: 'butt' | 'round' | 'square';
  readonly join?: 'miter' | 'round' | 'bevel';
}

export function emitDashedStroke(
  g: Graphics,
  points: ReadonlyArray<Point>,
  opts: DashedStrokeOptions,
): void {
  const [dash, gap] = opts.dashArray;
  const period = dash + gap;
  if (points.length < 2 || dash <= 0 || period <= 0 || opts.width <= 0) return;

  // Normalize offset into [0, period). `dashOffset` shifts the pattern: at
  // arc-length 0 the cycle phase is `dashOffset mod period`. Phase < dash
  // → currently inside a dash; otherwise inside a gap.
  const rawOffset = opts.dashOffset ?? 0;
  let phase = rawOffset % period;
  if (phase < 0) phase += period;

  let inDash = phase < dash;
  let remaining = inDash ? dash - phase : period - phase;
  let penX = points[0]!.x;
  let penY = points[0]!.y;
  let segIdx = 0;

  const segmentCount = opts.closed ? points.length : points.length - 1;

  while (segIdx < segmentCount) {
    const a = points[segIdx]!;
    const b = points[(segIdx + 1) % points.length]!;
    const dx = b.x - penX;
    const dy = b.y - penY;
    const segLen = Math.hypot(dx, dy);

    if (segLen <= 0) {
      segIdx++;
      if (segIdx < segmentCount) {
        const next = points[segIdx]!;
        penX = next.x;
        penY = next.y;
      }
      continue;
    }

    if (remaining >= segLen) {
      // Entire remaining segment fits inside the current dash/gap interval.
      if (inDash) {
        g.moveTo(penX, penY);
        g.lineTo(b.x, b.y);
      }
      remaining -= segLen;
      penX = b.x;
      penY = b.y;
      segIdx++;
    } else {
      // Boundary crossing partway through the segment.
      const t = remaining / segLen;
      const cx = penX + dx * t;
      const cy = penY + dy * t;
      if (inDash) {
        g.moveTo(penX, penY);
        g.lineTo(cx, cy);
      }
      penX = cx;
      penY = cy;
      inDash = !inDash;
      remaining = inDash ? dash : gap;
    }
    // Avoid using `a` after consumption (suppresses unused-var on tight loops).
    void a;
  }

  g.stroke({
    color: opts.color,
    alpha: opts.alpha ?? 1,
    width: opts.width,
    cap: opts.cap,
    join: opts.join,
  });
}
