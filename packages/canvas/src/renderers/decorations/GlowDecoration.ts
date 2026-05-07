/**
 * `GlowDecoration` — soft outer glow via Pixi's `BlurFilter`.
 *
 * Registered as kind `'glow'`, target `'shape'`. Static.
 *
 * Thin wrapper: owns the slot Container/Graphics + lifecycle. Calls
 * `setupGlow` once on construction (installs the BlurFilter on the slot)
 * and delegates geometry to `draw.drawGlow` on each `mount`/`update`.
 * Falls back to AABB rounded-rect when no `outlinePolyline` is supplied.
 */

import { Container, Graphics } from 'pixi.js';
import {
  drawGlow,
  setupGlow,
  type GlowOpts,
} from '../../draw/decorations/shape/glow';
import type { IShapeDecoration, ShapeDecorationHostInfo } from '../types';

export type GlowStyle = GlowOpts;

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
    setupGlow(this.gfx, style);
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
    drawGlow(
      this.graphics,
      host.bounds,
      this.style,
      host.hostKind,
      host.outlinePolyline,
    );
  }
}
