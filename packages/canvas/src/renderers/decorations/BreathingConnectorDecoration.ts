/**
 * `BreathingConnectorDecoration` — calm, continuous "alive" cue for an edge:
 * tube outline whose padding from the connector centerline oscillates
 * sinusoidally with alpha co-pulsing.
 *
 * Registered as kind `'breathing-connector'`, target `'connector'`.
 *
 * Thin wrapper: owns the slot Container/Graphics + IConnectorDecoration
 * lifecycle and delegates animation/geometry to
 * `draw.BreathingConnectorDecoration`.
 */

import { Container, Graphics } from 'pixi.js';
import {
  BreathingConnectorDecoration as DrawBreathingConnector,
  type BreathingConnectorOpts,
} from '../../draw/decorations/connector/breathing';
import type {
  ConnectorDecorationHostInfo,
  IConnectorDecoration,
} from '../types';

export type BreathingConnectorStyle = BreathingConnectorOpts;

export class BreathingConnectorDecoration
  implements IConnectorDecoration<BreathingConnectorStyle>
{
  readonly style: BreathingConnectorStyle;
  private readonly gfx: Container;
  private readonly graphics: Graphics;
  private readonly impl: DrawBreathingConnector;

  constructor(style: BreathingConnectorStyle) {
    this.style = style;
    this.gfx = new Container();
    this.gfx.label = 'deco:breathing-connector';
    this.graphics = new Graphics();
    this.gfx.addChild(this.graphics);
    this.impl = new DrawBreathingConnector(this.gfx, this.graphics, style);
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
