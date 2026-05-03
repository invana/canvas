/**
 * `GlowDecoration` — soft outer glow via Pixi's `BlurFilter`.
 *
 * Registered as kind `'glow'`, target `'shape'`. Static (no `tick`).
 * Lands in the `'glow'` slot z-band (deepest behind the host) so the blur
 * radiates outward without occluding the shape itself.
 *
 * Implementation: same shape geometry as `HaloDecoration` but rendered with
 * a blur filter, larger padding, and lower alpha. Cheaper-than-it-looks —
 * BlurFilter runs once per frame on the small filter-area rect rather than
 * per shape pixel.
 */

import { BlurFilter, Container, Graphics } from 'pixi.js';
import type { IShapeDecoration, ShapeDecorationHostInfo } from '../types';

export interface GlowStyle {
  readonly color: number;
  /** Padding outside the host bounds (filter-area expansion). Default `12`. */
  readonly padding?: number;
  /** 0..1 fill alpha for the glow disc. Default `0.6`. */
  readonly alpha?: number;
  /** Pixi `BlurFilter.strength`. Default `8`. Higher = wider, softer glow. */
  readonly blur?: number;
}

export class GlowDecoration implements IShapeDecoration<GlowStyle> {
  readonly style: GlowStyle;
  private readonly gfx: Container;
  private readonly graphics: Graphics;

  constructor(style: GlowStyle) {
    this.style = style;
    this.gfx = new Container();
    this.gfx.label = 'deco:glow';
    this.graphics = new Graphics();
    this.gfx.addChild(this.graphics);
    this.gfx.filters = [new BlurFilter({ strength: this.style.blur ?? 8 })];
  }

  mount(host: ShapeDecorationHostInfo): void {
    this.gfx.zIndex = host.slotZIndex;
    host.surface.addChild(this.gfx);
    this.draw(host);
  }

  update(host: ShapeDecorationHostInfo): void {
    this.draw(host);
  }

  destroy(): void {
    this.gfx.destroy({ children: true });
  }

  private draw(host: ShapeDecorationHostInfo): void {
    const padding = this.style.padding ?? 12;
    const alpha = this.style.alpha ?? 0.6;

    const g = this.graphics;
    g.clear();
    const { x, y, width, height } = host.bounds;
    const cx = x + width / 2;
    const cy = y + height / 2;

    if (host.hostKind === 'circle' || host.hostKind === 'ellipse') {
      g.ellipse(cx, cy, width / 2 + padding, height / 2 + padding);
    } else {
      g.roundRect(
        x - padding,
        y - padding,
        width + padding * 2,
        height + padding * 2,
        Math.max(padding, 6),
      );
    }
    g.fill({ color: this.style.color, alpha });
  }
}
