/**
 * `RingDecoration` — outline drawn on top of the host.
 *
 * Registered as kind `'ring'`, target `'shape'`. Static.
 *
 * Thin wrapper: owns the slot Container/Graphics + lifecycle and delegates
 * geometry to the `draw.drawRing` primitive (shape-following parallel
 * offset when an `outlinePolyline` is available).
 */

import { Container, Graphics } from 'pixi.js';
import { drawRing, type RingOpts } from '../../draw/decorations/shape/ring';
import type { IShapeDecoration, ShapeDecorationHostInfo } from '../types';

export type RingStyle = RingOpts;

export class RingDecoration implements IShapeDecoration<RingStyle> {
  readonly style: RingStyle;
  private readonly gfx: Container;
  private readonly graphics: Graphics;

  constructor(style: RingStyle) {
    this.style = style;
    this.gfx = new Container();
    this.gfx.label = 'deco:ring';
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
    drawRing(
      this.graphics,
      host.bounds,
      this.style,
      host.hostKind,
      host.outlinePolyline,
    );
  }
}
