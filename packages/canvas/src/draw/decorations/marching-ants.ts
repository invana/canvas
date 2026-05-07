/**
 * `marching-ants` — animated decoration: dashed outline with a scrolling
 * dash offset (the classic "selection ants" effect).
 *
 * Animated. Owns animation state (current `offset`) and a `tick(deltaMs)`
 * that advances the offset and re-emits the dashed polyline. Receives its
 * Graphics from the renderer — never creates one.
 *
 * Pixi v8's stroke API has no native dash array, so dashes are stamped as
 * straight chord segments. For circle/ellipse hosts the outline is sampled
 * around the ring; everything else gets a rectangular bbox perimeter.
 */

import type { Container, Graphics } from 'pixi.js';
import type { AnimatedDecoration, Rect } from '../types';

export interface MarchingAntsOpts {
  readonly color: number;
  readonly width?: number;
  readonly alpha?: number;
  readonly dashLength?: number;
  readonly gapLength?: number;
  /** Pixels per ms the offset advances. Default `0.04`. */
  readonly speed?: number;
  readonly inset?: number;
}

const ARC_STEP = 0.05;

export class MarchingAntsDecoration implements AnimatedDecoration {
  private bounds: Rect = { x: 0, y: 0, width: 0, height: 0 };
  private hostKind?: string;
  private offset = 0;

  constructor(
    _slot: Container,
    private readonly g: Graphics,
    private readonly opts: MarchingAntsOpts,
  ) {}

  update(bounds: Rect, hostKind?: string): void {
    this.bounds = bounds;
    this.hostKind = hostKind;
    this.redraw();
  }

  tick(deltaMs: number): boolean {
    const speed = this.opts.speed ?? 0.04;
    const dash = this.opts.dashLength ?? 6;
    const gap = this.opts.gapLength ?? 4;
    const cycle = dash + gap;
    this.offset = (this.offset + speed * deltaMs) % cycle;
    if (this.offset < 0) this.offset += cycle;
    this.redraw();
    return true;
  }

  destroy(): void {
    this.g.clear();
  }

  private redraw(): void {
    const dash = this.opts.dashLength ?? 6;
    const gap = this.opts.gapLength ?? 4;
    const inset = this.opts.inset ?? 2;
    const width = this.opts.width ?? 1.5;
    const alpha = this.opts.alpha ?? 1;

    this.g.clear();
    if (width <= 0) return;

    const samples = this.sampleOutline(inset);
    if (samples.length < 2) return;

    drawDashedPolyline(this.g, samples, dash, gap, this.offset);
    this.g.stroke({ color: this.opts.color, width, alpha });
  }

  private sampleOutline(inset: number): { x: number; y: number }[] {
    const { x, y, width, height } = this.bounds;
    const cx = x + width / 2;
    const cy = y + height / 2;

    if (this.hostKind === 'circle' || this.hostKind === 'ellipse') {
      const rx = width / 2 + inset;
      const ry = height / 2 + inset;
      const out: { x: number; y: number }[] = [];
      for (let theta = 0; theta < Math.PI * 2; theta += ARC_STEP) {
        out.push({ x: cx + Math.cos(theta) * rx, y: cy + Math.sin(theta) * ry });
      }
      out.push({ x: cx + rx, y: cy });
      return out;
    }

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

/** Stamp dashed chord segments along a polyline; dashes break cleanly at corners. */
function drawDashedPolyline(
  g: Graphics,
  poly: ReadonlyArray<{ x: number; y: number }>,
  dashLen: number,
  gapLen: number,
  offset: number,
): void {
  const cycle = dashLen + gapLen;
  if (cycle <= 0) return;
  let s = -offset;
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
        const sx = a.x + ux * local;
        const sy = a.y + uy * local;
        const ex = a.x + ux * (local + step);
        const ey = a.y + uy * (local + step);
        g.moveTo(sx, sy);
        g.lineTo(ex, ey);
      }
      const prev = local;
      local += step;
      // FP stall: step is sub-ULP at this magnitude — bail rather than spin.
      if (local === prev) break;
    }
    s += segLen;
  }
}
