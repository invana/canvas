/**
 * `PulseRingDecoration` — expanding stroked ring that fades as it grows,
 * looping forever. Animated.
 *
 * Registered as kind `'pulse-ring'`, target `'shape'`. Lands in the `'pulse'`
 * slot z-band (above the shape).
 *
 * Shape fidelity: the ring traces the exact host outline geometry —
 * sharp-cornered rect for `rect` hosts, ellipse for `circle`/`ellipse`,
 * properly offset polygon for `polygon`/`path`. Offset uses edge-normal
 * intersection so every edge stays at a uniform `padding` distance from the
 * original shape.
 *
 * Multiple rings: set `ringCount > 1` to emit N evenly-phased concentric
 * rings simultaneously (radar-ping effect). Each ring owns a dedicated
 * `Graphics` object so Pixi's path state never bleeds between rings.
 */

import { Container, Graphics } from 'pixi.js';
import type { IShapeDecoration, ShapeDecorationHostInfo } from '../types';
import { offsetPolygon, polyToShape } from './polylineUtils';

export interface PulseRingStyle {
  readonly color: number;
  /** Stroke width in pixels. Default `2`. */
  readonly width?: number;
  /** Starting alpha at the moment a ring spawns. Default `0.6`. */
  readonly alpha?: number;
  /** Outset from host bounds when the ring first appears. Default `0`. */
  readonly startPadding?: number;
  /** Outset from host bounds when the ring disappears. Default `30`. */
  readonly endPadding?: number;
  /** Duration of one ring cycle in ms. Default `1500`. */
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

export class PulseRingDecoration implements IShapeDecoration<PulseRingStyle> {
  readonly style: PulseRingStyle;
  private readonly gfx: Container;
  private host?: ShapeDecorationHostInfo;
  private elapsed = 0;
  /** One `Graphics` per ring — isolated draw contexts, no cross-ring bleed. */
  private rings: Graphics[] = [];

  constructor(style: PulseRingStyle) {
    this.style = style;
    this.gfx = new Container();
    this.gfx.label = 'deco:pulse-ring';
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
    const period = this.style.periodMs ?? 1500;
    this.elapsed = (this.elapsed + deltaMs) % period;
    this.redraw();
    return true;
  }

  destroy(): void {
    this.gfx.destroy({ children: true });
    this.rings = [];
  }

  private redraw(): void {
    if (!this.host) return;
    const period = this.style.periodMs ?? 1500;
    const startPad = this.style.startPadding ?? 0;
    const endPad = this.style.endPadding ?? 30;
    const startAlpha = this.style.alpha ?? 0.6;
    const ringCount = Math.max(1, Math.round(this.style.ringCount ?? 1));
    const color = this.style.color;
    const strokeWidth = this.style.width ?? 2;

    this.syncRings(ringCount);

    for (let r = 0; r < ringCount; r++) {
      const t = ((this.elapsed / period) + r / ringCount) % 1;
      const padding = startPad + (endPad - startPad) * t;
      const alpha = startAlpha * (1 - t);

      const g = this.rings[r]!;
      g.clear();
      this.drawOutline(g, padding);
      g.stroke({ color, width: strokeWidth, alpha });
    }
  }

  /** Grow or shrink the ring pool to match `count`. */
  private syncRings(count: number): void {
    while (this.rings.length < count) {
      const g = new Graphics();
      this.gfx.addChild(g);
      this.rings.push(g);
    }
    while (this.rings.length > count) {
      const g = this.rings.pop()!;
      g.destroy();
    }
  }

  /** Draw the ring outline at `padding` px outset from the host bounds. */
  private drawOutline(g: Graphics, padding: number): void {
    const { x, y, width, height } = this.host!.bounds;
    const cornerRadius = this.style.cornerRadius ?? 0;

    if (this.host!.hostKind === 'circle' || this.host!.hostKind === 'ellipse') {
      const cx = x + width / 2;
      const cy = y + height / 2;
      g.ellipse(cx, cy, width / 2 + padding, height / 2 + padding);
      return;
    }

    if (this.host!.outlinePolyline && this.host!.outlinePolyline.length >= 3) {
      polyToShape(g, offsetPolygon(this.host!.outlinePolyline, padding));
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
