/**
 * `marching-ants-connector` — animated connector decoration: dashed overlay
 * that crawls along the routed polyline with a scrolling phase offset.
 *
 * The classic CAD-tool "selection ants" effect, applied to an edge instead
 * of a node outline. Owns animation state; receives Graphics from the
 * renderer.
 *
 * The draw primitive walks dashes along the polyline as straight chords
 * (one moveTo + lineTo through any corner the dash crosses, so Pixi applies
 * a proper line join instead of doubled butt-caps). For curve fidelity on
 * smoothed connectors, a renderer-level wrapper can re-paint via the
 * connector kind's `paintInto` instead — but the draw primitive itself is
 * polyline-only.
 */

import type { Container, Graphics } from 'pixi.js';
import type {
  AnimatedConnectorDecoration,
  Point,
} from '../../types';
import { drawDashedPolylineOpen } from '../_polylineUtils';

export interface MarchingAntsConnectorOpts {
  readonly color: number;
  /** Stroke width. Default `1.5`. */
  readonly width?: number;
  /** 0..1 alpha. Default `1`. */
  readonly alpha?: number;
  /** Length of each dash. Default `6`. */
  readonly dashLength?: number;
  /** Length of the gap between dashes. Default `4`. */
  readonly gapLength?: number;
  /** Pixels per ms the offset advances. Default `0.04` (≈ slow crawl). */
  readonly speed?: number;
  /** Pixi line cap. Default `'butt'`. */
  readonly cap?: 'butt' | 'round' | 'square';
  /** Pixi line join. Default `'miter'`. */
  readonly join?: 'miter' | 'round' | 'bevel';
}

export class MarchingAntsConnectorDecoration
  implements AnimatedConnectorDecoration
{
  private polyline: ReadonlyArray<Point> = [];
  private offset = 0;

  constructor(
    _slot: Container,
    private readonly g: Graphics,
    private readonly opts: MarchingAntsConnectorOpts,
  ) {}

  update(polyline: ReadonlyArray<Point>): void {
    this.polyline = polyline;
    this.redraw();
  }

  tick(deltaMs: number): boolean {
    const speed = this.opts.speed ?? 0.04;
    const dash = this.opts.dashLength ?? 6;
    const gap = this.opts.gapLength ?? 4;
    const cycle = dash + gap;
    if (cycle > 0) {
      this.offset = (this.offset + speed * deltaMs) % cycle;
      if (this.offset < 0) this.offset += cycle;
    }
    this.redraw();
    return true;
  }

  destroy(): void {
    this.g.clear();
  }

  private redraw(): void {
    const width = this.opts.width ?? 1.5;
    this.g.clear();
    if (width <= 0 || this.polyline.length < 2) return;

    drawDashedPolylineOpen(
      this.g,
      this.polyline,
      this.opts.dashLength ?? 6,
      this.opts.gapLength ?? 4,
      this.offset,
    );
    this.g.stroke({
      color: this.opts.color,
      width,
      alpha: this.opts.alpha ?? 1,
      cap: this.opts.cap ?? 'butt',
      join: this.opts.join ?? 'miter',
    });
  }
}
