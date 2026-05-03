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
 * Outline geometry:
 *   • `circle` / `ellipse` hosts → arc-segmented ring
 *   • everything else            → rectangular bbox perimeter
 */

import { Container, Graphics } from 'pixi.js';
import type { IShapeDecoration, ShapeDecorationHostInfo } from '../types';

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

    drawDashedPolyline(g, samples, dash, gap, this.offset);
    g.stroke({ color: this.style.color, width, alpha });
  }

  /** Produce a polyline tracing the host's outline (offset by `inset` px). */
  private sampleOutline(inset: number): { x: number; y: number }[] {
    const { x, y, width, height } = this.host!.bounds;
    const cx = x + width / 2;
    const cy = y + height / 2;

    if (this.host!.hostKind === 'circle' || this.host!.hostKind === 'ellipse') {
      const rx = width / 2 + inset;
      const ry = height / 2 + inset;
      const out: { x: number; y: number }[] = [];
      for (let theta = 0; theta < Math.PI * 2; theta += ARC_STEP) {
        out.push({ x: cx + Math.cos(theta) * rx, y: cy + Math.sin(theta) * ry });
      }
      // Close the loop
      out.push({ x: cx + rx, y: cy });
      return out;
    }

    // Rectangular outline (closed).
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

/**
 * Stamp dashed segments along a polyline. Walks segment-by-segment with a
 * cumulative arc-length cursor so dashes that span polyline corners are
 * broken cleanly at the corner.
 */
function drawDashedPolyline(
  g: Graphics,
  poly: ReadonlyArray<{ x: number; y: number }>,
  dashLen: number,
  gapLen: number,
  offset: number,
): void {
  const cycle = dashLen + gapLen;
  let s = -offset; // arc-length cursor; first dash starts at `offset` px in
  for (let i = 0; i < poly.length - 1; i++) {
    const a = poly[i]!;
    const b = poly[i + 1]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const segLen = Math.hypot(dx, dy);
    if (segLen === 0) continue;
    const ux = dx / segLen;
    const uy = dy / segLen;

    // Walk the segment, emitting alternating dash/gap chunks of `cycle`.
    let local = 0;
    while (local < segLen) {
      // Distance into the current cycle:
      const within = ((s + local) % cycle + cycle) % cycle;
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
      local += step;
    }
    s += segLen;
  }
}
