/**
 * `MarchingAntsDecoration` — animated dashed outline with scrolling offset.
 *
 * Registered as kind `'marching-ants'`, target `'shape'`. Lands in the
 * `'border'` slot z-band (above the shape) by default.
 *
 * Pixi v8's stroke API doesn't expose a native dash array, so we draw the
 * dashes manually by walking the host's outline path and emitting straight
 * line segments alternating dash / gap. The `dashOffset` advances each
 * tick, producing the classic crawling-ants animation.
 *
 * Dashes that span a polyline corner are rendered as a single continuous path
 * so the line join is drawn correctly. A separate `moveTo` is only emitted at
 * the true start of each dash.
 *
 * Outline geometry:
 *   • `circle` / `ellipse` hosts → arc-segmented ring
 *   • everything else            → rectangular bbox perimeter
 */

import { Container, Graphics } from 'pixi.js';
import type { IShapeDecoration, ShapeDecorationHostInfo } from '../types';
import { expandPolyline } from './polylineUtils';
import { drawDashedPolyline, rotateClosedPolyline } from './polyline';

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
}

const ARC_STEP = 0.05; // radians per sample when building circular outline

export class MarchingAntsDecoration implements IShapeDecoration<MarchingAntsStyle> {
  readonly style: MarchingAntsStyle;
  private readonly gfx: Container;
  private readonly graphics: Graphics;
  private host?: ShapeDecorationHostInfo;
  private offset = 0;

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
    this.redraw();
  }

  update(host: ShapeDecorationHostInfo): void {
    this.host = host;
    this.redraw();
  }

  tick(deltaMs: number): boolean {
    const speed = this.style.speed ?? 0.04;
    const dash = this.style.dashLength ?? 6;
    const gap = this.style.gapLength ?? 4;
    const cycle = dash + gap;
    this.offset = (this.offset + speed * deltaMs) % cycle;
    if (this.offset < 0) this.offset += cycle;
    this.redraw();
    return true;
  }

  destroy(): void {
    this.gfx.destroy({ children: true });
  }

  private redraw(): void {
    if (!this.host) return;
    const dash = this.style.dashLength ?? 6;
    const gap = this.style.gapLength ?? 4;
    const inset = this.style.inset ?? 2;
    const width = this.style.width ?? 1.5;
    const alpha = this.style.alpha ?? 1;

    const g = this.graphics;
    g.clear();
    if (width <= 0) return;

    const samples = this.sampleOutline(inset);
    if (samples.length < 2) return;

    let drawDash = dash;
    let drawGap = gap;
    let drawOffset = this.offset;
    let drawSamples: { x: number; y: number }[] = samples;
    const first = samples[0]!;
    const last = samples[samples.length - 1]!;
    const closed = first.x === last.x && first.y === last.y;
    if (closed) {
      let perimeter = 0;
      for (let i = 0; i < samples.length - 1; i++) {
        perimeter += Math.hypot(samples[i + 1]!.x - samples[i]!.x, samples[i + 1]!.y - samples[i]!.y);
      }
      const cycle = dash + gap;
      if (perimeter > 0 && cycle > 0) {
        // Snap so perimeter is an exact integer multiple of (dash + gap):
        // kills the phase discontinuity at the loop seam.
        const n = Math.max(1, Math.round(perimeter / cycle));
        const scale = perimeter / n / cycle;
        drawDash = dash * scale;
        drawGap = gap * scale;
        const snappedCycle = drawDash + drawGap;

        // Rotate the polyline so its seam lands inside a gap rather than
        // mid-dash. With drawOffset = drawGap below, the rotated start has
        // dash phase = drawDash (gap-start) and the end wraps back to the
        // same phase — both endpoints sit inside a gap, so we never split a
        // dash across the seam and never produce abutting butt-caps.
        // The animation crawl still happens because sAlign moves with offset.
        const sAlign = (this.offset * scale + drawDash) % snappedCycle;
        drawSamples = rotateClosedPolyline(samples, sAlign);
        drawOffset = drawGap;
      }
    }

    drawDashedPolyline(g, drawSamples, drawDash, drawGap, drawOffset);
    g.stroke({ color: this.style.color, width, alpha });
  }

  /** Produce a polyline tracing the host's outline (offset by `inset` px). */
  private sampleOutline(inset: number): { x: number; y: number }[] {
    const { x, y, width, height } = this.host!.bounds;
    const cx = x + width / 2;
    const cy = y + height / 2;

    if (this.host!.hostKind === 'circle' || this.host!.hostKind === 'ellipse') {
      // Sample by arc length, not by uniform θ. For a circle the two are
      // identical, but for an ellipse uniform-θ produces longer chords near
      // the ends of the long axis — visibly stretched dashes there. We build
      // a dense cumulative-arc-length table (M θ-samples), then place N
      // output samples at uniform fractions of total arc length.
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
      const out: { x: number; y: number }[] = [];
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

    // For polygon/path hosts, trace the actual outline expanded by `inset`.
    if (this.host!.outlinePolyline && this.host!.outlinePolyline.length >= 3) {
      return expandPolyline(this.host!.outlinePolyline, inset);
    }

    // Rectangular outline fallback (rect, image, text, etc.).
    const x0 = x - inset;
    const y0 = y - inset;
    const x1 = x + width + inset;
    const y1 = y + height + inset;
    return [
      { x: x0, y: y0 },
      { x: x1, y: y0 },
      { x: x1, y: y1 },
      { x: x0, y: y1 },
      { x: x0, y: y0 },
    ];
  }
}
