/**
 * `breathing` — animated shape decoration: a stroked outline whose padding
 * oscillates sinusoidally between `minPadding` and `maxPadding`, with alpha
 * co-pulsing softly so the outline reads as "alive" even on shapes that fall
 * back to the AABB rectangle (where only padding moves).
 *
 * Useful as a calm, continuous attention cue on a focused / sustained-state
 * node — e.g. the node currently bound to a side-panel form, or one held in
 * a "watching" status. The smooth in-and-out motion reads as a steady
 * heartbeat rather than a one-shot pulse.
 *
 * Geometry strategy:
 * - circle / ellipse host: ellipse expanded by current padding
 * - non-circle host with `outlinePolyline`: parallel-offset polygon
 * - non-circle host without polyline: rect (or rounded rect) fallback
 */

import type { Container, Graphics } from 'pixi.js';
import type { AnimatedDecoration, Point, Rect } from '../../types';
import { offsetPolygon, polyToShape } from '../_polylineUtils';

export interface BreathingOpts {
  readonly color: number;
  readonly width?: number;
  /**
   * Peak stroke alpha (at the peak of the cycle). Alpha co-pulses to
   * `alpha * 0.5` at the trough so the outline reads as "alive" even on
   * shapes that fall back to the AABB rectangle. Default `0.9`.
   */
  readonly alpha?: number;
  /** Padding at the trough of the cycle. Default `2`. */
  readonly minPadding?: number;
  /** Padding at the peak of the cycle. Default `18`. */
  readonly maxPadding?: number;
  /** Loop period in ms. Default `1800`. */
  readonly periodMs?: number;
  /**
   * Rounded corner radius for rect-like hosts. Default `0` (sharp).
   * Outer radius is `cornerRadius + currentPadding` so the ring stays
   * concentric with a host that has the same `cornerRadius`.
   */
  readonly cornerRadius?: number;
}

export class BreathingDecoration implements AnimatedDecoration {
  private bounds: Rect = { x: 0, y: 0, width: 0, height: 0 };
  private hostKind?: string;
  private outlinePolyline?: ReadonlyArray<Point>;
  private elapsed = 0;

  constructor(
    _slot: Container,
    private readonly g: Graphics,
    private readonly opts: BreathingOpts,
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
    const period = this.opts.periodMs ?? 1800;
    this.elapsed = (this.elapsed + deltaMs) % period;
    this.redraw();
    return true;
  }

  destroy(): void {
    this.g.clear();
  }

  private redraw(): void {
    const period = this.opts.periodMs ?? 1800;
    const minPad = this.opts.minPadding ?? 2;
    const maxPad = this.opts.maxPadding ?? 18;
    // Sinusoid in [0..1]: 0.5 - 0.5*cos(2πt) — starts at trough, peaks mid-cycle.
    const phase = 0.5 - 0.5 * Math.cos((this.elapsed / period) * Math.PI * 2);
    const padding = minPad + (maxPad - minPad) * phase;
    const baseAlpha = this.opts.alpha ?? 0.9;
    const alpha = baseAlpha * (0.5 + 0.5 * phase);
    const width = this.opts.width ?? 2;
    const cornerRadius = this.opts.cornerRadius ?? 0;

    this.g.clear();
    if (width <= 0) return;

    const { x, y, width: w, height: h } = this.bounds;
    const cx = x + w / 2;
    const cy = y + h / 2;

    if (this.hostKind === 'circle' || this.hostKind === 'ellipse') {
      this.g.ellipse(cx, cy, w / 2 + padding, h / 2 + padding);
    } else if (this.outlinePolyline && this.outlinePolyline.length >= 3) {
      polyToShape(this.g, offsetPolygon(this.outlinePolyline, padding));
    } else if (cornerRadius > 0) {
      this.g.roundRect(
        x - padding,
        y - padding,
        w + padding * 2,
        h + padding * 2,
        cornerRadius + padding,
      );
    } else {
      this.g.rect(x - padding, y - padding, w + padding * 2, h + padding * 2);
    }
    this.g.stroke({ color: this.opts.color, width, alpha });
  }
}
