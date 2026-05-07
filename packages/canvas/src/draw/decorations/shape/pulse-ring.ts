/**
 * `pulse-ring` — animated shape decoration: an expanding stroked ring that
 * fades as it grows, looping forever.
 *
 * Useful as an attention-getter on a hovered / freshly-spawned / target-of-
 * action node. Owns elapsed-time state; receives Graphics from the renderer.
 *
 * Multiple rings: set `ringCount > 1` for evenly-staggered concentric rings
 * (radar-ping effect). Each ring owns its own sub-Graphics so Pixi's path
 * state never bleeds between rings.
 *
 * Geometry strategy (per ring):
 * - circle / ellipse host: ellipse expanded by `padding`
 * - non-circle host with `outlinePolyline`: parallel-offset polygon
 * - non-circle host without polyline: rect (or rounded rect) fallback
 */

import { Graphics, type Container } from 'pixi.js';
import type { AnimatedDecoration, Point, Rect } from '../../types';
import { offsetPolygon, polyToShape } from '../_polylineUtils';

export interface PulseRingOpts {
  readonly color: number;
  readonly width?: number;
  /** Starting alpha at the begin-pulse moment. Default `0.6`. */
  readonly alpha?: number;
  readonly startPadding?: number;
  readonly endPadding?: number;
  /** Loop period in ms. Default `1500`. */
  readonly periodMs?: number;
  /** Number of concurrently visible rings, evenly staggered. Default `1`. */
  readonly ringCount?: number;
  /**
   * Rounded corner radius for rect-like hosts. Default `0` (sharp).
   * Outer radius is `cornerRadius + padding` so the ring stays concentric
   * with a host that has the same `cornerRadius`.
   */
  readonly cornerRadius?: number;
}

export class PulseRingDecoration implements AnimatedDecoration {
  private bounds: Rect = { x: 0, y: 0, width: 0, height: 0 };
  private hostKind?: string;
  private outlinePolyline?: ReadonlyArray<Point>;
  private elapsed = 0;
  /** One sub-Graphics per ring — isolated path state, no cross-ring bleed. */
  private rings: Graphics[] = [];

  constructor(
    private readonly slot: Container,
    private readonly g: Graphics,
    private readonly opts: PulseRingOpts,
  ) {}

  update(
    bounds: Rect,
    hostKind?: string,
    outlinePolyline?: ReadonlyArray<Point>,
  ): void {
    this.bounds = bounds;
    this.hostKind = hostKind;
    this.outlinePolyline = outlinePolyline;
    this.redraw();
  }

  tick(deltaMs: number): boolean {
    const period = this.opts.periodMs ?? 1500;
    this.elapsed = (this.elapsed + deltaMs) % period;
    this.redraw();
    return true;
  }

  destroy(): void {
    for (const r of this.rings) r.destroy();
    this.rings = [];
    this.g.clear();
  }

  private redraw(): void {
    const period = this.opts.periodMs ?? 1500;
    const startPad = this.opts.startPadding ?? 0;
    const endPad = this.opts.endPadding ?? 30;
    const startAlpha = this.opts.alpha ?? 0.6;
    const ringCount = Math.max(1, Math.round(this.opts.ringCount ?? 1));
    const color = this.opts.color;
    const strokeWidth = this.opts.width ?? 2;

    this.syncRings(ringCount);

    // Single-ring fast path: render into the externally-supplied Graphics so
    // the simplest case allocates no extra Graphics.
    if (ringCount === 1) {
      const t = (this.elapsed / period) % 1;
      const padding = startPad + (endPad - startPad) * t;
      const alpha = startAlpha * (1 - t);
      this.g.clear();
      this.drawOutline(this.g, padding);
      this.g.stroke({ color, width: strokeWidth, alpha });
      return;
    }

    // Multi-ring: clear primary g, draw each ring into its own sub-graphics.
    this.g.clear();
    for (let r = 0; r < ringCount; r++) {
      const t = (this.elapsed / period + r / ringCount) % 1;
      const padding = startPad + (endPad - startPad) * t;
      const alpha = startAlpha * (1 - t);
      const sub = this.rings[r]!;
      sub.clear();
      this.drawOutline(sub, padding);
      sub.stroke({ color, width: strokeWidth, alpha });
    }
  }

  private syncRings(count: number): void {
    const need = count > 1 ? count : 0;
    while (this.rings.length < need) {
      const sub = new Graphics();
      this.slot.addChild(sub);
      this.rings.push(sub);
    }
    while (this.rings.length > need) {
      const sub = this.rings.pop()!;
      sub.destroy();
    }
  }

  private drawOutline(g: Graphics, padding: number): void {
    const { x, y, width, height } = this.bounds;
    const cornerRadius = this.opts.cornerRadius ?? 0;
    const cx = x + width / 2;
    const cy = y + height / 2;

    if (this.hostKind === 'circle' || this.hostKind === 'ellipse') {
      g.ellipse(cx, cy, width / 2 + padding, height / 2 + padding);
      return;
    }
    if (this.outlinePolyline && this.outlinePolyline.length >= 3) {
      polyToShape(g, offsetPolygon(this.outlinePolyline, padding));
      return;
    }
    if (cornerRadius > 0) {
      g.roundRect(
        x - padding,
        y - padding,
        width + padding * 2,
        height + padding * 2,
        cornerRadius + padding,
      );
    } else {
      g.rect(x - padding, y - padding, width + padding * 2, height + padding * 2);
    }
  }
}
