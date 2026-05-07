/**
 * `pulsating-glow-connector` — animated connector decoration: soft glow that
 * wraps the routed polyline with alpha oscillating over time.
 *
 * Implementation: `update` repaints the polyline as `layerCount` stacked
 * ribbon polygons (one core + N feather layers, each at progressively larger
 * half-width and lower alpha). `tick` advances a phase and mutates
 * `slot.alpha` only — geometry is fixed once drawn, so per-tick cost is one
 * scalar write. Cheap.
 *
 * Why ribbons instead of a Pixi BlurFilter: filters render against the
 * Container's AABB texture, which for a thin diagonal stroke is a tall
 * rectangle — producing a rectangular halo rather than one that hugs the
 * line. Stacked offset-polygon ribbons follow the polyline exactly.
 *
 * The slot Container must be supplied (the decoration mutates its `alpha`).
 * The Graphics is the polyline carrier and is expected to already be a child
 * of the slot.
 */

import type { Container, Graphics } from 'pixi.js';
import type {
  AnimatedConnectorDecoration,
  Point,
} from '../../types';
import { polyToShape, ribbonPolygon } from '../_polylineUtils';

export interface PulsatingGlowConnectorOpts {
  readonly color: number;
  /** Core stroke width (innermost ribbon's full width). Default `8`. */
  readonly width?: number;
  /** Minimum container alpha during the pulse cycle. Default `0.35`. */
  readonly alphaMin?: number;
  /** Maximum container alpha during the pulse cycle. Default `0.9`. */
  readonly alphaMax?: number;
  /** Pulse period in ms. Default `1500`. */
  readonly periodMs?: number;
  /**
   * Number of feather layers stacked outside the core (in addition to the
   * core). Default `3`.
   */
  readonly layerCount?: number;
  /**
   * Half-width step added per feather layer, in pixels. Default `5`.
   */
  readonly featherStep?: number;
  /**
   * Per-layer alpha multiplier. Each successive feather layer's alpha is
   * `prev * featherFalloff`. Default `0.5`.
   */
  readonly featherFalloff?: number;
}

export class PulsatingGlowConnectorDecoration
  implements AnimatedConnectorDecoration
{
  private polyline: ReadonlyArray<Point> = [];
  private phase = 0;

  constructor(
    private readonly slot: Container,
    private readonly g: Graphics,
    private readonly opts: PulsatingGlowConnectorOpts,
  ) {
    this.slot.alpha = opts.alphaMin ?? 0.35;
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
    const alphaMin = this.opts.alphaMin ?? 0.35;
    const alphaMax = this.opts.alphaMax ?? 0.9;
    this.slot.alpha = alphaMin + (alphaMax - alphaMin) * k;
    return true;
  }

  destroy(): void {
    this.slot.alpha = 1;
    this.g.clear();
  }

  private redraw(): void {
    this.g.clear();
    const width = this.opts.width ?? 8;
    if (width <= 0 || this.polyline.length < 2) return;

    const layerCount = Math.max(0, Math.floor(this.opts.layerCount ?? 3));
    const featherStep = this.opts.featherStep ?? 5;
    const featherFalloff = this.opts.featherFalloff ?? 0.5;
    const color = this.opts.color;

    // Outer feather layers first (lowest alpha, largest), so the inner core
    // overlays them and reads as the brightest band.
    for (let i = layerCount; i >= 1; i--) {
      const halfWidth = width / 2 + i * featherStep;
      const layerAlpha = Math.pow(featherFalloff, i);
      const ribbon = ribbonPolygon(this.polyline, halfWidth);
      if (ribbon.length >= 3) {
        polyToShape(this.g, ribbon);
        this.g.fill({ color, alpha: layerAlpha });
      }
    }

    const core = ribbonPolygon(this.polyline, width / 2);
    if (core.length >= 3) {
      polyToShape(this.g, core);
      this.g.fill({ color, alpha: 1 });
    }
  }
}
