/**
 * `MarchingAntsDecoration` — animated dashed outline with scrolling offset.
 *
 * Registered as kind `'marching-ants'`, target `'shape'`.
 *
 * Thin wrapper: owns the slot Container/Graphics + IShapeDecoration
 * lifecycle and delegates all animation/geometry to the
 * `draw.MarchingAntsDecoration` primitive — including shape-following
 * dashed outline for polygon/path hosts via parallel-offset polygon.
 */

import { Container, Graphics } from 'pixi.js';
import {
  MarchingAntsDecoration as DrawMarchingAnts,
  type MarchingAntsOpts,
} from '../../draw/decorations/shape/marching-ants';
import type { IShapeDecoration, ShapeDecorationHostInfo } from '../types';

export type MarchingAntsStyle = MarchingAntsOpts;

export class MarchingAntsDecoration
  implements IShapeDecoration<MarchingAntsStyle>
{
  readonly style: MarchingAntsStyle;
  private readonly gfx: Container;
  private readonly graphics: Graphics;
  private readonly impl: DrawMarchingAnts;

  constructor(style: MarchingAntsStyle) {
    this.style = style;
    this.gfx = new Container();
    this.gfx.label = 'deco:marching-ants';
    this.graphics = new Graphics();
    this.gfx.addChild(this.graphics);
    this.impl = new DrawMarchingAnts(this.gfx, this.graphics, style);
  }

  mount(host: ShapeDecorationHostInfo): void {
    this.gfx.zIndex = host.slotZIndex;
    host.surface.addChild(this.gfx);
    this.impl.update(host.bounds, host.hostKind, host.outlinePolyline);
  }

  update(host: ShapeDecorationHostInfo): void {
    this.impl.update(host.bounds, host.hostKind, host.outlinePolyline);
  }

  tick(deltaMs: number): boolean {
    return this.impl.tick(deltaMs);
  }

  destroy(): void {
    this.impl.destroy();
    this.gfx.destroy({ children: true });
  }
}
