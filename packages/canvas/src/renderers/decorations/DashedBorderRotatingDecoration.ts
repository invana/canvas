/**
 * `DashedBorderRotatingDecoration` — dashed circular border that rotates
 * around the host center. Animated.
 *
 * Registered as kind `'dashed-border-rotating'`, target `'shape'`. Lands in
 * the `'border'` slot z-band.
 *
 * The decoration always traces a circle (its radius derived from the host's
 * AABB diagonal half-length, plus padding). Uses the same dashed-stroke
 * trick as `MarchingAntsDecoration` but draws once and animates the
 * container's `rotation` instead of advancing dash offset — cheaper than
 * re-stroking every frame.
 */

import { Container, Graphics } from 'pixi.js';
import type { IShapeDecoration, ShapeDecorationHostInfo } from '../types';
import { maxRadiusFromCentroid } from './polylineUtils';

export interface DashedBorderRotatingStyle {
  readonly color: number;
  readonly width?: number;
  readonly alpha?: number;
  readonly dashLength?: number;
  readonly gapLength?: number;
  /** Padding outside the host bounds. Default `4`. */
  readonly padding?: number;
  /** Radians per ms. Default `0.0008` (~ slow rotation). */
  readonly speed?: number;
}

export class DashedBorderRotatingDecoration
  implements IShapeDecoration<DashedBorderRotatingStyle>
{
  readonly style: DashedBorderRotatingStyle;
  private readonly gfx: Container;
  private readonly graphics: Graphics;
  private host?: ShapeDecorationHostInfo;

  constructor(style: DashedBorderRotatingStyle) {
    this.style = style;
    this.gfx = new Container();
    this.gfx.label = 'deco:dashed-border-rotating';
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
    const speed = this.style.speed ?? 0.0008;
    this.gfx.rotation += speed * deltaMs;
    return true;
  }

  destroy(): void {
    this.gfx.destroy({ children: true });
  }

  /**
   * Drawn once on `mount`/`update`. The animation is just a rotation
   * applied to the container.
   */
  private redraw(): void {
    if (!this.host) return;
    const dash = this.style.dashLength ?? 6;
    const gap = this.style.gapLength ?? 4;
    const padding = this.style.padding ?? 4;
    const width = this.style.width ?? 1.5;
    const alpha = this.style.alpha ?? 1;

    const g = this.graphics;
    g.clear();
    if (width <= 0) return;

    const { x, y, width: w, height: h } = this.host.bounds;
    const cx = x + w / 2;
    const cy = y + h / 2;
    // For polygon/path, use the actual max-vertex distance for a tighter fit.
    const radius = this.host.outlinePolyline
      ? maxRadiusFromCentroid(this.host.outlinePolyline) + padding
      : Math.hypot(w, h) / 2 + padding;

    // Pivot the gfx so rotation happens around the host center, not the
    // surface origin (which is the shape's origin = its center for centered
    // shapes, but explicit setting is safer).
    this.gfx.pivot.set(cx, cy);
    this.gfx.position.set(cx, cy);

    // Stamp circular dashes by emitting straight chord segments per dash.
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
        g.moveTo(x0, y0);
        g.lineTo(x1, y1);
      }
    }
    g.stroke({ color: this.style.color, width, alpha });
  }
}
