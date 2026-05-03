/**
 * `PulseRingDecoration` — expanding stroked ring that fades as it grows,
 * looping forever. Animated.
 *
 * Registered as kind `'pulse-ring'`, target `'shape'`. Lands in the `'pulse'`
 * slot z-band (above the shape).
 *
 * Useful as an attention-getter on a hovered / freshly-spawned / target-of-
 * action node. The ring traces a circle/ellipse on round hosts and an
 * AABB-rounded-rect on others.
 */

import { Container, Graphics } from 'pixi.js';
import type { IShapeDecoration, ShapeDecorationHostInfo } from '../types';

export interface PulseRingStyle {
  readonly color: number;
  /** Stroke width. Default `2`. */
  readonly width?: number;
  /** Starting alpha at the begin-pulse moment. Default `0.6`. */
  readonly alpha?: number;
  /** Padding from host bounds at pulse start (pixels). Default `0`. */
  readonly startPadding?: number;
  /** Padding from host bounds at pulse end (pixels). Default `30`. */
  readonly endPadding?: number;
  /** Loop period in ms. Default `1500`. */
  readonly periodMs?: number;
}

export class PulseRingDecoration implements IShapeDecoration<PulseRingStyle> {
  readonly style: PulseRingStyle;
  private readonly gfx: Container;
  private readonly graphics: Graphics;
  private host?: ShapeDecorationHostInfo;
  private elapsed = 0;

  constructor(style: PulseRingStyle) {
    this.style = style;
    this.gfx = new Container();
    this.gfx.label = 'deco:pulse-ring';
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
    const period = this.style.periodMs ?? 1500;
    this.elapsed = (this.elapsed + deltaMs) % period;
    this.redraw();
    return true; // never retire
  }

  destroy(): void {
    this.gfx.destroy({ children: true });
  }

  private redraw(): void {
    if (!this.host) return;
    const period = this.style.periodMs ?? 1500;
    const t = this.elapsed / period;
    const startPad = this.style.startPadding ?? 0;
    const endPad = this.style.endPadding ?? 30;
    const padding = startPad + (endPad - startPad) * t;
    const startAlpha = this.style.alpha ?? 0.6;
    const alpha = startAlpha * (1 - t);

    const g = this.graphics;
    g.clear();
    const { x, y, width, height } = this.host.bounds;
    const cx = x + width / 2;
    const cy = y + height / 2;

    if (this.host.hostKind === 'circle' || this.host.hostKind === 'ellipse') {
      g.ellipse(cx, cy, width / 2 + padding, height / 2 + padding);
    } else {
      g.roundRect(
        x - padding,
        y - padding,
        width + padding * 2,
        height + padding * 2,
        Math.max(padding, 4),
      );
    }
    g.stroke({ color: this.style.color, width: this.style.width ?? 2, alpha });
  }
}
