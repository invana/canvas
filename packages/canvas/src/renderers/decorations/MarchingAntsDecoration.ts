/**
 * `MarchingAntsDecoration` — animated dashed outline with scrolling offset.
 *
 * Registered as kind `'marching-ants'`, target `'shape'`. Lands in the
 * `'border'` slot z-band (above the shape) by default.
 *
 * Pixi v8's stroke API doesn't expose a native dash array, so dashes are
 * stamped manually by walking the host outline polyline. The `offset`
 * advances each tick, producing the classic crawling-ants animation.
 *
 * Heavy work (sample the outline, measure perimeter, snap dash/gap so
 * `perimeter = N * (dashLen + gapLen)`) is cached on `mount` / `update` and
 * reused on every `tick`. The walker (`drawDashedPolylineClosed`) handles
 * the closing seam internally — dashes never split at the seam, so we don't
 * have to rotate the polyline per frame to keep the seam inside a gap.
 *
 * Outline geometry:
 *   • `circle` / `ellipse` hosts → arc-length-uniform sampling
 *   • polygon / path hosts        → host outline polyline expanded by `inset`
 *   • everything else (rect, …)  → bbox perimeter; rounded with arc samples
 *                                   when `cornerRadius > 0`
 */

import { Container, Graphics } from 'pixi.js';
import type { IShapeDecoration, ShapeDecorationHostInfo } from '../types';
import { expandPolyline } from './polylineUtils';
import { drawDashedPolylineClosed } from './polyline';

export interface MarchingAntsStyle {
  readonly color: number;
  /** Stroke width. Default `1.5`. */
  readonly width?: number;
  /** 0..1. Default `1`. */
  readonly alpha?: number;
  /** Length of each dash. Default `6`. */
  readonly dashLength?: number;
  /** Length of the gap between dashes. Default `4`. */
  readonly gapLength?: number;
  /** Pixels per ms the offset advances. Default `0.04` (≈ slow crawl). */
  readonly speed?: number;
  /** Outset from host bounds. Default `2`. */
  readonly inset?: number;
  /**
   * Rounded corner radius for rect-like hosts. Default `0` (sharp).
   * Outer radius is `cornerRadius + inset` so the dashes wrap a host with
   * the same `cornerRadius` concentrically.
   */
  readonly cornerRadius?: number;
}

const ARC_STEP = 0.05; // radians per arc sample
type Pt = { x: number; y: number };

export class MarchingAntsDecoration implements IShapeDecoration<MarchingAntsStyle> {
  readonly style: MarchingAntsStyle;
  private readonly gfx: Container;
  private readonly graphics: Graphics;
  private host?: ShapeDecorationHostInfo;
  private offset = 0;

  // Cache populated by `update()` / `mount()` and reused by `tick()`.
  private cachedSamples: Pt[] = [];
  private snappedDash = 0;
  private snappedGap = 0;

  constructor(style: MarchingAntsStyle) {
    this.style = style;
    this.gfx = new Container();
    this.gfx.label = 'deco:marching-ants';
    this.graphics = new Graphics();
    this.gfx.addChild(this.graphics);
  }

  mount(host: ShapeDecorationHostInfo): void {
    this.host = host;
    this.gfx.zIndex = host.slotZIndex;
    host.surface.addChild(this.gfx);
    this.rebuildCache();
    this.redraw();
  }

  update(host: ShapeDecorationHostInfo): void {
    this.host = host;
    this.rebuildCache();
    this.redraw();
  }

  tick(deltaMs: number): boolean {
    const speed = this.style.speed ?? 0.04;
    const cycle = this.snappedDash + this.snappedGap;
    if (cycle <= 0) return true;
    this.offset = (this.offset + speed * deltaMs) % cycle;
    if (this.offset < 0) this.offset += cycle;
    this.redraw();
    return true;
  }

  destroy(): void {
    this.gfx.destroy({ children: true });
  }

  private rebuildCache(): void {
    if (!this.host) return;
    const inset = this.style.inset ?? 2;
    const cornerRadius = this.style.cornerRadius ?? 0;
    const dash = this.style.dashLength ?? 6;
    const gap = this.style.gapLength ?? 4;

    this.cachedSamples = this.sampleOutline(inset, cornerRadius);

    // Snap dash + gap so perimeter is an integer multiple of (dash + gap) →
    // phase wraps cleanly at the seam.
    const samples = this.cachedSamples;
    let perimeter = 0;
    for (let i = 0; i < samples.length - 1; i++) {
      perimeter += Math.hypot(
        samples[i + 1]!.x - samples[i]!.x,
        samples[i + 1]!.y - samples[i]!.y,
      );
    }
    const cycle = dash + gap;
    if (perimeter > 0 && cycle > 0) {
      const n = Math.max(1, Math.round(perimeter / cycle));
      const scale = perimeter / n / cycle;
      this.snappedDash = dash * scale;
      this.snappedGap = gap * scale;
    } else {
      this.snappedDash = dash;
      this.snappedGap = gap;
    }
  }

  private redraw(): void {
    if (!this.host) return;
    const width = this.style.width ?? 1.5;
    const alpha = this.style.alpha ?? 1;

    const g = this.graphics;
    g.clear();
    if (width <= 0 || this.cachedSamples.length < 2) return;

    drawDashedPolylineClosed(
      g,
      this.cachedSamples,
      this.snappedDash,
      this.snappedGap,
      this.offset,
    );
    g.stroke({ color: this.style.color, width, alpha });
  }

  /** Produce a closed polyline tracing the host's outline (inset/expanded). */
  private sampleOutline(inset: number, cornerRadius: number): Pt[] {
    const { x, y, width, height } = this.host!.bounds;
    const cx = x + width / 2;
    const cy = y + height / 2;

    if (this.host!.hostKind === 'circle' || this.host!.hostKind === 'ellipse') {
      // Sample by arc length, not by uniform θ — uniform-θ produces stretched
      // chords near the long-axis tips of an ellipse.
      const rx = width / 2 + inset;
      const ry = height / 2 + inset;
      const n = Math.max(8, Math.round((Math.PI * 2) / ARC_STEP));
      const M = 720;
      const dtheta = (Math.PI * 2) / M;
      const cum = new Float64Array(M + 1);
      let prevX = cx + rx;
      let prevY = cy;
      for (let i = 1; i <= M; i++) {
        const theta = i * dtheta;
        const px = cx + Math.cos(theta) * rx;
        const py = cy + Math.sin(theta) * ry;
        cum[i] = cum[i - 1]! + Math.hypot(px - prevX, py - prevY);
        prevX = px;
        prevY = py;
      }
      const total = cum[M]!;
      const out: Pt[] = [];
      for (let i = 0; i < n; i++) {
        const target = (i * total) / n;
        let lo = 0;
        let hi = M;
        while (lo < hi) {
          const mid = (lo + hi) >>> 1;
          if (cum[mid]! < target) lo = mid + 1;
          else hi = mid;
        }
        const k = lo === 0 ? 1 : lo;
        const arcA = cum[k - 1]!;
        const arcB = cum[k]!;
        const f = arcB > arcA ? (target - arcA) / (arcB - arcA) : 0;
        const theta = (k - 1 + f) * dtheta;
        out.push({ x: cx + Math.cos(theta) * rx, y: cy + Math.sin(theta) * ry });
      }
      out.push({ x: out[0]!.x, y: out[0]!.y });
      return out;
    }

    if (this.host!.outlinePolyline && this.host!.outlinePolyline.length >= 3) {
      return expandPolyline(this.host!.outlinePolyline, inset).map((p) => ({
        x: p.x,
        y: p.y,
      }));
    }

    // Rect-like fallback. cornerRadius > 0 → trace rounded-rect outline.
    const x0 = x - inset;
    const y0 = y - inset;
    const x1 = x + width + inset;
    const y1 = y + height + inset;
    if (cornerRadius > 0) {
      const r = Math.min(cornerRadius + inset, (x1 - x0) / 2, (y1 - y0) / 2);
      return rectRoundedOutline(x0, y0, x1, y1, r);
    }
    return [
      { x: x0, y: y0 },
      { x: x1, y: y0 },
      { x: x1, y: y1 },
      { x: x0, y: y1 },
      { x: x0, y: y0 },
    ];
  }
}

/** Closed polyline tracing a rounded rect outline; corners arc-sampled. */
function rectRoundedOutline(x0: number, y0: number, x1: number, y1: number, r: number): Pt[] {
  if (r <= 0) {
    return [
      { x: x0, y: y0 },
      { x: x1, y: y0 },
      { x: x1, y: y1 },
      { x: x0, y: y1 },
      { x: x0, y: y0 },
    ];
  }
  const arcSteps = Math.max(4, Math.round((Math.PI / 2) / ARC_STEP));
  const out: Pt[] = [];
  // Start at top edge after the top-left corner.
  out.push({ x: x0 + r, y: y0 });
  // Top edge → top-right corner arc (centered at (x1-r, y0+r)).
  out.push({ x: x1 - r, y: y0 });
  pushArc(out, x1 - r, y0 + r, r, -Math.PI / 2, 0, arcSteps);
  // Right edge → bottom-right corner arc.
  out.push({ x: x1, y: y1 - r });
  pushArc(out, x1 - r, y1 - r, r, 0, Math.PI / 2, arcSteps);
  // Bottom edge → bottom-left corner arc.
  out.push({ x: x0 + r, y: y1 });
  pushArc(out, x0 + r, y1 - r, r, Math.PI / 2, Math.PI, arcSteps);
  // Left edge → top-left corner arc.
  out.push({ x: x0, y: y0 + r });
  pushArc(out, x0 + r, y0 + r, r, Math.PI, (3 * Math.PI) / 2, arcSteps);
  // Close.
  out.push({ x: out[0]!.x, y: out[0]!.y });
  return out;
}

function pushArc(
  out: Pt[],
  cx: number,
  cy: number,
  r: number,
  a0: number,
  a1: number,
  steps: number,
): void {
  for (let i = 1; i <= steps; i++) {
    const a = a0 + ((a1 - a0) * i) / steps;
    out.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
  }
}
