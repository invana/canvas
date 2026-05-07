/**
 * `BorderDecoration` — outline drawn on top of the host.
 *
 * Registered as kind `'border'`, target `'shape'`. Static.
 *
 * Thin wrapper: owns the slot Container/Graphics + lifecycle and delegates
 * geometry to the `draw.drawBorder` primitive (shape-following parallel
 * offset when an `outlinePolyline` is available).
 */

import { Container, Graphics } from 'pixi.js';
import { drawBorder, type BorderOpts } from '../../draw/decorations/shape/border';
import type { IShapeDecoration, ShapeDecorationHostInfo } from '../types';

export type BorderStyle = BorderOpts;

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
    this.graphics.clear();
    drawBorder(
      this.graphics,
      host.bounds,
      this.style,
      host.hostKind,
      host.outlinePolyline,
    );
  }
}
