/**
 * `pulsating-glow-connector` — animated connector decoration: soft glow that
 * wraps the routed polyline with strength + alpha oscillating over time.
 *
 * Implementation: `update` repaints the polyline as a fat stroke into the
 * decoration's Graphics and (re-)attaches a `BlurFilter` to the slot
 * Container. `tick` advances a phase and mutates the filter's `strength`
 * plus `slot.alpha` — no per-tick redraw, since neither geometry nor colour
 * change frame-to-frame. Cheap.
 *
 * The slot Container must be supplied (the decoration sets `filters` and
 * `alpha` on it). The Graphics is the polyline carrier and is expected to
 * already be a child of the slot.
 */

import { BlurFilter, type Container, type Graphics } from 'pixi.js';
import type {
  AnimatedConnectorDecoration,
  Point,
} from '../../types';

export interface PulsatingGlowConnectorOpts {
  readonly color: number;
  /** Stroke width baseline. Default `8`. */
  readonly width?: number;
  /** Minimum container alpha during the pulse cycle. Default `0.25`. */
  readonly alphaMin?: number;
  /** Maximum container alpha during the pulse cycle. Default `0.75`. */
  readonly alphaMax?: number;
  /** Minimum BlurFilter strength. Default `4`. */
  readonly blurMin?: number;
  /** Maximum BlurFilter strength. Default `12`. */
  readonly blurMax?: number;
  /** Pulse period in ms. Default `1500`. */
  readonly periodMs?: number;
  /** Pixi line cap. Default `'round'` for a softer look. */
  readonly cap?: 'butt' | 'round' | 'square';
}

export class PulsatingGlowConnectorDecoration
  implements AnimatedConnectorDecoration
{
  private polyline: ReadonlyArray<Point> = [];
  private phase = 0;
  private readonly blur: BlurFilter;

  constructor(
    private readonly slot: Container,
    private readonly g: Graphics,
    private readonly opts: PulsatingGlowConnectorOpts,
  ) {
    this.blur = new BlurFilter({ strength: opts.blurMin ?? 4 });
    this.slot.filters = [this.blur];
    this.slot.alpha = opts.alphaMin ?? 0.25;
  }

  update(polyline: ReadonlyArray<Point>): void {
    this.polyline = polyline;
    this.redraw();
  }

  tick(deltaMs: number): boolean {
    const period = this.opts.periodMs ?? 1500;
    if (period > 0) {
      this.phase =
        (this.phase + (deltaMs / period) * Math.PI * 2) % (Math.PI * 2);
    }
    const k = (Math.sin(this.phase) + 1) / 2;
    const alphaMin = this.opts.alphaMin ?? 0.25;
    const alphaMax = this.opts.alphaMax ?? 0.75;
    const blurMin = this.opts.blurMin ?? 4;
    const blurMax = this.opts.blurMax ?? 12;
    this.slot.alpha = alphaMin + (alphaMax - alphaMin) * k;
    this.blur.strength = blurMin + (blurMax - blurMin) * k;
    return true;
  }

  destroy(): void {
    this.slot.filters = [];
    this.g.clear();
  }

  private redraw(): void {
    const width = this.opts.width ?? 8;
    this.g.clear();
    if (width <= 0 || this.polyline.length < 2) return;

    const first = this.polyline[0]!;
    this.g.moveTo(first.x, first.y);
    for (let i = 1; i < this.polyline.length; i++) {
      const p = this.polyline[i]!;
      this.g.lineTo(p.x, p.y);
    }
    this.g.stroke({
      color: this.opts.color,
      width,
      alpha: 1,
      cap: this.opts.cap ?? 'round',
    });
  }
}
