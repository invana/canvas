/**
 * `PulsatingGlowConnectorDecoration` — soft animated glow that wraps the
 * connector silhouette with strength + alpha oscillating over time.
 *
 * Registered as kind `'pulsating-glow'`, target `'connector'`.
 *
 * Thin wrapper: owns the slot Container/Graphics + IConnectorDecoration
 * lifecycle and delegates all animation/geometry to the
 * `draw.PulsatingGlowConnectorDecoration` primitive (which sets the slot's
 * `filters` + `alpha` and repaints the polyline as a fat stroke).
 */

import { Container, Graphics } from 'pixi.js';
import {
  PulsatingGlowConnectorDecoration as DrawPulsatingGlowConnector,
  type PulsatingGlowConnectorOpts,
} from '../../draw/decorations/connector/pulsating-glow';
import type {
  ConnectorDecorationHostInfo,
  IConnectorDecoration,
} from '../types';

export type PulsatingGlowConnectorStyle = PulsatingGlowConnectorOpts;

export class PulsatingGlowConnectorDecoration
  implements IConnectorDecoration<PulsatingGlowConnectorStyle>
{
  readonly style: PulsatingGlowConnectorStyle;
  private readonly gfx: Container;
  private readonly graphics: Graphics;
  private readonly impl: DrawPulsatingGlowConnector;

  constructor(style: PulsatingGlowConnectorStyle) {
    this.style = style;
    this.gfx = new Container();
    this.gfx.label = 'deco:pulsating-glow';
    this.graphics = new Graphics();
    this.gfx.addChild(this.graphics);
    this.impl = new DrawPulsatingGlowConnector(this.gfx, this.graphics, style);
  }

  mount(host: ConnectorDecorationHostInfo): void {
    this.gfx.zIndex = host.slotZIndex;
    host.surface.addChild(this.gfx);
    this.impl.update(host.polyline);
  }

  update(host: ConnectorDecorationHostInfo): void {
    this.impl.update(host.polyline);
  }

  tick(deltaMs: number): boolean {
    return this.impl.tick(deltaMs);
  }

  destroy(): void {
    this.impl.destroy();
    this.gfx.destroy({ children: true });
  }
}
