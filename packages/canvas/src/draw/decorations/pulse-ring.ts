/**
 * `pulse-ring` — animated decoration: an expanding stroked ring that fades
 * as it grows, looping forever.
 *
 * Useful as an attention-getter on a hovered / freshly-spawned / target-of-
 * action node. Owns elapsed-time state; receives Graphics from the renderer.
 */

import type { Container, Graphics } from 'pixi.js';
import type { AnimatedDecoration, Rect } from '../types';

export interface PulseRingOpts {
  readonly color: number;
  readonly width?: number;
  /** Starting alpha at the begin-pulse moment. Default `0.6`. */
  readonly alpha?: number;
  readonly startPadding?: number;
  readonly endPadding?: number;
  /** Loop period in ms. Default `1500`. */
  readonly periodMs?: number;
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
  private elapsed = 0;

  constructor(
    _slot: Container,
    private readonly g: Graphics,
    private readonly opts: PulseRingOpts,
  ) {}

  update(bounds: Rect, hostKind?: string): void {
    this.bounds = bounds;
    this.hostKind = hostKind;
    this.redraw();
  }

  tick(deltaMs: number): boolean {
    const period = this.opts.periodMs ?? 1500;
    this.elapsed = (this.elapsed + deltaMs) % period;
    this.redraw();
    return true;
  }

  destroy(): void {
    this.g.clear();
  }

  private redraw(): void {
    const period = this.opts.periodMs ?? 1500;
    const t = this.elapsed / period;
    const startPad = this.opts.startPadding ?? 0;
    const endPad = this.opts.endPadding ?? 30;
    const padding = startPad + (endPad - startPad) * t;
    const startAlpha = this.opts.alpha ?? 0.6;
    const alpha = startAlpha * (1 - t);
    const cornerRadius = this.opts.cornerRadius ?? 0;

    this.g.clear();
    const { x, y, width, height } = this.bounds;
    const cx = x + width / 2;
    const cy = y + height / 2;

    if (this.hostKind === 'circle' || this.hostKind === 'ellipse') {
      this.g.ellipse(cx, cy, width / 2 + padding, height / 2 + padding);
    } else if (cornerRadius > 0) {
      this.g.roundRect(
        x - padding,
        y - padding,
        width + padding * 2,
        height + padding * 2,
        cornerRadius + padding,
      );
    } else {
      this.g.rect(x - padding, y - padding, width + padding * 2, height + padding * 2);
    }
    this.g.stroke({ color: this.opts.color, width: this.opts.width ?? 2, alpha });
  }
}
