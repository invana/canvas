/**
 * `breathing-connector` — animated connector decoration: a tube outline whose
 * perpendicular padding from the connector centerline oscillates sinusoidally
 * between `minPadding` and `maxPadding`, with alpha co-pulsing softly so the
 * outline reads as a steady heartbeat rather than a one-shot pulse.
 *
 * Useful as a calm, continuous attention cue on a focused / sustained-state
 * connector — e.g. an edge currently bound to a side-panel form, or one held
 * in a "watching" state.
 *
 * Geometry: closed ribbon polygon at half-width `padding + width/2`, stroked
 * at `width`. Visual analog of `shape/breathing` for connectors.
 */

import type { Container, Graphics } from 'pixi.js';
import type {
  AnimatedConnectorDecoration,
  Point,
} from '../../types';
import { polyToShape, ribbonPolygon } from '../_polylineUtils';

export interface BreathingConnectorOpts {
  readonly color: number;
  /** Stroke width. Default `2`. */
  readonly width?: number;
  /**
   * Peak stroke alpha (at the peak of the cycle). Alpha co-pulses to
   * `alpha * 0.5` at the trough. Default `0.9`.
   */
  readonly alpha?: number;
  /** Padding at the trough of the cycle. Default `2`. */
  readonly minPadding?: number;
  /** Padding at the peak of the cycle. Default `12`. */
  readonly maxPadding?: number;
  /** Loop period in ms. Default `1800`. */
  readonly periodMs?: number;
}

export class BreathingConnectorDecoration
  implements AnimatedConnectorDecoration
{
  private polyline: ReadonlyArray<Point> = [];
  private elapsed = 0;

  constructor(
    _slot: Container,
    private readonly g: Graphics,
    private readonly opts: BreathingConnectorOpts,
  ) {}

  update(polyline: ReadonlyArray<Point>): void {
    this.polyline = polyline;
    this.redraw();
  }

  tick(deltaMs: number): boolean {
    const period = this.opts.periodMs ?? 1800;
    if (period > 0) this.elapsed = (this.elapsed + deltaMs) % period;
    this.redraw();
    return true;
  }

  destroy(): void {
    this.g.clear();
  }

  private redraw(): void {
    const period = this.opts.periodMs ?? 1800;
    const minPad = this.opts.minPadding ?? 2;
    const maxPad = this.opts.maxPadding ?? 12;
    const phase = 0.5 - 0.5 * Math.cos((this.elapsed / period) * Math.PI * 2);
    const padding = minPad + (maxPad - minPad) * phase;
    const baseAlpha = this.opts.alpha ?? 0.9;
    const alpha = baseAlpha * (0.5 + 0.5 * phase);
    const width = this.opts.width ?? 2;

    this.g.clear();
    if (width <= 0 || this.polyline.length < 2) return;

    const ribbon = ribbonPolygon(this.polyline, padding + width / 2);
    if (ribbon.length < 3) return;
    polyToShape(this.g, ribbon);
    this.g.stroke({ color: this.opts.color, width, alpha });
  }
}
