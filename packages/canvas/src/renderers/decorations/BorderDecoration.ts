/**
 * `BorderDecoration` — outline drawn on top of the host.
 *
 * Registered as kind `'border'`, target `'shape'`. Static (no `tick`).
 * Lands in the `'border'` slot z-band (above the shape).
 *
 * Like `HaloDecoration`, the outline traces a circle/ellipse for round
 * hosts and an AABB-rounded-rect for others. The optional `cornerRadius`
 * style overrides the auto-pick on rectangular hosts.
 */

import { Container, Graphics } from 'pixi.js';
import type { IShapeDecoration, ShapeDecorationHostInfo } from '../types';
import { expandPolyline, polyToShape } from './polylineUtils';

export interface BorderStyle {
  readonly color: number;
  /** Stroke width in pixels. Default `1`. */
  readonly width?: number;
  /** 0..1 stroke alpha. Default `1`. */
  readonly alpha?: number;
  /** Optional rounded corner radius for rect hosts. Default `0`. */
  readonly cornerRadius?: number;
  /**
   * Inset/outset relative to host bounds. Negative = outside the shape;
   * positive = inside. Default `0` (sits on the host edge).
   */
  readonly inset?: number;
}

export class BorderDecoration implements IShapeDecoration<BorderStyle> {
  readonly style: BorderStyle;
  private readonly gfx: Container;
  private readonly graphics: Graphics;

  constructor(style: BorderStyle) {
    this.style = style;
    this.gfx = new Container();
    this.gfx.label = 'deco:border';
    this.graphics = new Graphics();
    this.gfx.addChild(this.graphics);
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
    const width = this.style.width ?? 1;
    const alpha = this.style.alpha ?? 1;
    const inset = this.style.inset ?? 0;
    const cornerRadius = this.style.cornerRadius ?? 0;

    const g = this.graphics;
    g.clear();
    if (width <= 0) return;

    const { x, y, width: w, height: h } = host.bounds;
    const cx = x + w / 2;
    const cy = y + h / 2;

    if (host.hostKind === 'circle' || host.hostKind === 'ellipse') {
      const rx = Math.max(0, w / 2 - inset);
      const ry = Math.max(0, h / 2 - inset);
      g.ellipse(cx, cy, rx, ry);
    } else if (host.outlinePolyline && host.outlinePolyline.length >= 3) {
      // Positive inset shrinks toward centroid; negative expands outward.
      polyToShape(g, expandPolyline(host.outlinePolyline, -inset));
    } else if (cornerRadius > 0) {
      g.roundRect(x + inset, y + inset, w - 2 * inset, h - 2 * inset, cornerRadius);
    } else {
      g.rect(x + inset, y + inset, w - 2 * inset, h - 2 * inset);
    }

    g.stroke({ color: this.style.color, width, alpha });
  }
}
