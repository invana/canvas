/**
 * `HaloDecoration` — soft filled ring outside the host's bounds.
 *
 * Registered as kind `'halo'`, target `'shape'`. Static (no `tick`).
 *
 * Thin wrapper: owns the slot Container/Graphics + IShapeDecoration lifecycle
 * and delegates all geometry to the `draw.drawHalo` primitive. When the host
 * is a `polygon` / `path` (i.e. supplies an `outlinePolyline`), the halo
 * traces the actual outline via parallel offset; otherwise it falls back to
 * the AABB.
 */

import { Container, Graphics } from 'pixi.js';
import { drawHalo, type HaloOpts } from '../../draw/decorations/shape/halo';
import type { IShapeDecoration, ShapeDecorationHostInfo } from '../types';

export type HaloStyle = HaloOpts;

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
    this.graphics.clear();
    drawHalo(
      this.graphics,
      host.bounds,
      this.style,
      host.hostKind,
      host.outlinePolyline,
    );
  }
}
