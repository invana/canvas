/**
 * `HaloDecoration` — soft filled ring outside the host's bounds.
 *
 * Registered as kind `'halo'`, target `'shape'`. Static (no `tick`).
 *
 * The visible part is the `padding` band that pokes out beyond the shape's
 * draw region — the inner area is hidden behind the host shape since halos
 * land in the `'halo'` slot z-band (below the shape).
 *
 * For circle / ellipse hosts the halo traces the same rounded form. For all
 * other host kinds the halo is an axis-aligned rounded rectangle that
 * envelops the host's local-space AABB. Custom hosts can register their
 * own halo variants if they need shape-fitting halos.
 */

import { Container, Graphics } from 'pixi.js';
import type { IShapeDecoration, ShapeDecorationHostInfo } from '../types';
import { expandPolyline, polyToShape } from './polylineUtils';

export interface HaloStyle {
  /** Halo color (hex). */
  readonly color: number;
  /** 0..1 fill alpha. Default `0.4`. */
  readonly alpha?: number;
  /** Padding outside the host bounds. Default `4`. */
  readonly padding?: number;
}

export class HaloDecoration implements IShapeDecoration<HaloStyle> {
  readonly style: HaloStyle;
  private readonly gfx: Container;
  private readonly graphics: Graphics;

  constructor(style: HaloStyle) {
    this.style = style;
    this.gfx = new Container();
    this.gfx.label = 'deco:halo';
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
    const padding = this.style.padding ?? 4;
    const alpha = this.style.alpha ?? 0.4;
    const g = this.graphics;
    g.clear();

    // Bounds are local to the shape's gfx (which is positioned at spec.x/y),
    // so the host's center sits at (0, 0) for centered shapes (circle, rect,
    // ellipse, image, text) — which is the typical case here.
    const { x, y, width, height } = host.bounds;
    const cx = x + width / 2;
    const cy = y + height / 2;

    if (host.hostKind === 'circle' || host.hostKind === 'ellipse') {
      const rx = width / 2 + padding;
      const ry = height / 2 + padding;
      g.ellipse(cx, cy, rx, ry);
    } else if (host.outlinePolyline && host.outlinePolyline.length >= 3) {
      polyToShape(g, expandPolyline(host.outlinePolyline, padding));
    } else {
      g.roundRect(
        x - padding,
        y - padding,
        width + padding * 2,
        height + padding * 2,
        Math.max(padding, 4),
      );
    }
    g.fill({ color: this.style.color, alpha });
  }
}
