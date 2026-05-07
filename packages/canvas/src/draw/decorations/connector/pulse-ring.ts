/**
 * `pulse-ring-connector` — animated connector decoration: one or more
 * expanding tube outlines around the routed polyline that fade as they grow,
 * looping forever (radar-ping along an edge).
 *
 * Useful as an attention-getter on a hovered / freshly-spawned / target-of-
 * action connector. Owns elapsed-time state; receives Graphics from the
 * renderer.
 *
 * Multiple rings: set `ringCount > 1` for evenly-staggered concentric rings.
 * Each ring owns its own sub-Graphics so Pixi's path state never bleeds
 * between rings.
 *
 * Geometry (per ring): closed ribbon polygon at half-width `padding + width/2`,
 * stroked at `width`. Visual analog of `shape/pulse-ring` for connectors.
 */

import { Graphics, type Container } from 'pixi.js';
import type {
  AnimatedConnectorDecoration,
  Point,
} from '../../types';
import { polyToShape, ribbonPolygon } from '../_polylineUtils';

export interface PulseRingConnectorOpts {
  readonly color: number;
  /** Stroke width. Default `2`. */
  readonly width?: number;
  /** Starting alpha at the begin-pulse moment. Default `0.6`. */
  readonly alpha?: number;
  /** Padding at the begin-pulse moment. Default `0`. */
  readonly startPadding?: number;
  /** Padding at the end-pulse moment. Default `24`. */
  readonly endPadding?: number;
  /** Loop period in ms. Default `1500`. */
  readonly periodMs?: number;
  /** Number of concurrently visible rings, evenly staggered. Default `1`. */
  readonly ringCount?: number;
}

export class PulseRingConnectorDecoration
  implements AnimatedConnectorDecoration
{
  private polyline: ReadonlyArray<Point> = [];
  private elapsed = 0;
  /** One sub-Graphics per ring — isolated path state, no cross-ring bleed. */
  private rings: Graphics[] = [];

  constructor(
    private readonly slot: Container,
    private readonly g: Graphics,
    private readonly opts: PulseRingConnectorOpts,
  ) {}

  update(polyline: ReadonlyArray<Point>): void {
    this.polyline = polyline;
    this.redraw();
  }

  tick(deltaMs: number): boolean {
    const period = this.opts.periodMs ?? 1500;
    if (period > 0) this.elapsed = (this.elapsed + deltaMs) % period;
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
    const endPad = this.opts.endPadding ?? 24;
    const startAlpha = this.opts.alpha ?? 0.6;
    const ringCount = Math.max(1, Math.round(this.opts.ringCount ?? 1));
    const color = this.opts.color;
    const strokeWidth = this.opts.width ?? 2;

    this.syncRings(ringCount);

    if (ringCount === 1) {
      const t = (this.elapsed / period) % 1;
      const padding = startPad + (endPad - startPad) * t;
      const alpha = startAlpha * (1 - t);
      this.g.clear();
      this.drawRing(this.g, padding, strokeWidth);
      this.g.stroke({ color, width: strokeWidth, alpha });
      return;
    }

    this.g.clear();
    for (let r = 0; r < ringCount; r++) {
      const t = (this.elapsed / period + r / ringCount) % 1;
      const padding = startPad + (endPad - startPad) * t;
      const alpha = startAlpha * (1 - t);
      const sub = this.rings[r]!;
      sub.clear();
      this.drawRing(sub, padding, strokeWidth);
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

  private drawRing(g: Graphics, padding: number, width: number): void {
    if (this.polyline.length < 2) return;
    const ribbon = ribbonPolygon(this.polyline, padding + width / 2);
    if (ribbon.length < 3) return;
    polyToShape(g, ribbon);
  }
}
