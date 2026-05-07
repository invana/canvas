/**
 * `dashed-rotating` — animated decoration: a dashed circular border that
 * rotates around the host center.
 *
 * Stamps the dashes once on `update`, then animates the slot Container's
 * `rotation` per `tick` — much cheaper than re-stroking every frame. Uses
 * the slot Container (handed in at construction) for transform animation;
 * uses the Graphics (also handed in) for the one-time dash stamping.
 *
 * The ring radius is derived from the host's AABB diagonal half-length plus
 * padding — the dashes wrap any host shape, not just round ones.
 */

import type { Container, Graphics } from 'pixi.js';
import type { AnimatedDecoration, Rect } from '../types';

export interface DashedBorderRotatingOpts {
  readonly color: number;
  readonly width?: number;
  readonly alpha?: number;
  readonly dashLength?: number;
  readonly gapLength?: number;
  readonly padding?: number;
  /** Radians per ms. Default `0.0008`. */
  readonly speed?: number;
}

export class DashedBorderRotatingDecoration implements AnimatedDecoration {
  private bounds: Rect = { x: 0, y: 0, width: 0, height: 0 };

  constructor(
    private readonly slot: Container,
    private readonly g: Graphics,
    private readonly opts: DashedBorderRotatingOpts,
  ) {}

  update(bounds: Rect): void {
    this.bounds = bounds;
    this.redraw();
  }

  tick(deltaMs: number): boolean {
    const speed = this.opts.speed ?? 0.0008;
    this.slot.rotation += speed * deltaMs;
    return true;
  }

  destroy(): void {
    this.g.clear();
    this.slot.rotation = 0;
  }

  private redraw(): void {
    const dash = this.opts.dashLength ?? 6;
    const gap = this.opts.gapLength ?? 4;
    const padding = this.opts.padding ?? 4;
    const width = this.opts.width ?? 1.5;
    const alpha = this.opts.alpha ?? 1;

    this.g.clear();
    if (width <= 0) return;

    const { x, y, width: w, height: h } = this.bounds;
    const cx = x + w / 2;
    const cy = y + h / 2;
    const radius = Math.hypot(w, h) / 2 + padding;

    // Pivot the slot so rotation happens around the host center.
    this.slot.pivot.set(cx, cy);
    this.slot.position.set(cx, cy);

    const circumference = 2 * Math.PI * radius;
    const cycle = dash + gap;
    const cycles = Math.max(1, Math.floor(circumference / cycle));
    const dashAngle = (dash / circumference) * 2 * Math.PI;
    const cycleAngle = (cycle / circumference) * 2 * Math.PI;

    for (let i = 0; i < cycles; i++) {
      const a0 = i * cycleAngle;
      const a1 = a0 + dashAngle;
      const arcSamples = 6;
      for (let k = 0; k < arcSamples; k++) {
        const t0 = k / arcSamples;
        const t1 = (k + 1) / arcSamples;
        const theta0 = a0 + (a1 - a0) * t0;
        const theta1 = a0 + (a1 - a0) * t1;
        const x0 = cx + Math.cos(theta0) * radius;
        const y0 = cy + Math.sin(theta0) * radius;
        const x1 = cx + Math.cos(theta1) * radius;
        const y1 = cy + Math.sin(theta1) * radius;
        this.g.moveTo(x0, y0);
        this.g.lineTo(x1, y1);
      }
    }
    this.g.stroke({ color: this.opts.color, width, alpha });
  }
}
