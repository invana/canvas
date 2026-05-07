/**
 * `BreathingDecoration` — calm, continuous "alive" cue: stroked outline
 * whose padding oscillates sinusoidally with co-pulsing alpha. Animated.
 *
 * Registered as kind `'breathing'`, target `'shape'`. Useful for sustained
 * focus states (selected node bound to a side-panel form, "watching" status,
 * etc.) — distinct from `'pulse-ring'` (one-shot expand-and-fade) by being
 * a steady heartbeat.
 *
 * Thin wrapper: owns the slot Container/Graphics + IShapeDecoration
 * lifecycle and delegates all animation/geometry to the
 * `draw.BreathingDecoration` primitive — including shape-following parallel
 * offset for polygon/path hosts.
 */

import { Container, Graphics } from 'pixi.js';
import {
  BreathingDecoration as DrawBreathing,
  type BreathingOpts,
} from '../../draw/decorations/shape/breathing';
import type { IShapeDecoration, ShapeDecorationHostInfo } from '../types';

export type BreathingStyle = BreathingOpts;

export class BreathingDecoration implements IShapeDecoration<BreathingStyle> {
  readonly style: BreathingStyle;
  private readonly gfx: Container;
  private readonly graphics: Graphics;
  private readonly impl: DrawBreathing;

  constructor(style: BreathingStyle) {
    this.style = style;
    this.gfx = new Container();
    this.gfx.label = 'deco:breathing';
    this.graphics = new Graphics();
    this.gfx.addChild(this.graphics);
    this.impl = new DrawBreathing(this.gfx, this.graphics, style);
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
