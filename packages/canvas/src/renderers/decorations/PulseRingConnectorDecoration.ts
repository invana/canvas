/**
 * `PulseRingConnectorDecoration` — expanding tube outlines around the routed
 * polyline that fade as they grow (radar-ping along an edge).
 *
 * Registered as kind `'pulse-ring-connector'`, target `'connector'`.
 *
 * Thin wrapper: owns the slot Container/Graphics + IConnectorDecoration
 * lifecycle and delegates animation/geometry to
 * `draw.PulseRingConnectorDecoration`. Multi-ring rendering allocates its
 * own sub-Graphics inside the slot Container so Pixi's path state never
 * bleeds between rings.
 */

import { Container, Graphics } from 'pixi.js';
import {
  PulseRingConnectorDecoration as DrawPulseRingConnector,
  type PulseRingConnectorOpts,
} from '../../draw/decorations/connector/pulse-ring';
import type {
  ConnectorDecorationHostInfo,
  IConnectorDecoration,
} from '../types';

export type PulseRingConnectorStyle = PulseRingConnectorOpts;

export class PulseRingConnectorDecoration
  implements IConnectorDecoration<PulseRingConnectorStyle>
{
  readonly style: PulseRingConnectorStyle;
  private readonly gfx: Container;
  private readonly graphics: Graphics;
  private readonly impl: DrawPulseRingConnector;

  constructor(style: PulseRingConnectorStyle) {
    this.style = style;
    this.gfx = new Container();
    this.gfx.label = 'deco:pulse-ring-connector';
    this.graphics = new Graphics();
    this.gfx.addChild(this.graphics);
    this.impl = new DrawPulseRingConnector(this.gfx, this.graphics, style);
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
