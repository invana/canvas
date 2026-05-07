/**
 * `RingConnectorDecoration` — static stroked outline tubing the routed
 * polyline at a perpendicular `inset` offset from the connector centerline.
 *
 * Registered as kind `'ring-connector'`, target `'connector'`.
 *
 * Thin wrapper: owns the slot Container/Graphics + IConnectorDecoration
 * lifecycle and delegates all geometry to `draw.drawRingConnector` (which
 * builds a closed ribbon polygon and strokes it).
 */

import { Container, Graphics } from 'pixi.js';
import {
  drawRingConnector,
  type RingConnectorOpts,
} from '../../draw/decorations/connector/ring';
import type {
  ConnectorDecorationHostInfo,
  IConnectorDecoration,
} from '../types';

export type RingConnectorStyle = RingConnectorOpts;

export class RingConnectorDecoration
  implements IConnectorDecoration<RingConnectorStyle>
{
  readonly style: RingConnectorStyle;
  private readonly gfx: Container;
  private readonly graphics: Graphics;

  constructor(style: RingConnectorStyle) {
    this.style = style;
    this.gfx = new Container();
    this.gfx.label = 'deco:ring-connector';
    this.graphics = new Graphics();
    this.gfx.addChild(this.graphics);
  }

  mount(host: ConnectorDecorationHostInfo): void {
    this.gfx.zIndex = host.slotZIndex;
    host.surface.addChild(this.gfx);
    this.draw(host);
  }

  update(host: ConnectorDecorationHostInfo): void {
    this.draw(host);
  }

  destroy(): void {
    this.gfx.destroy({ children: true });
  }

  private draw(host: ConnectorDecorationHostInfo): void {
    this.graphics.clear();
    drawRingConnector(this.graphics, host.polyline, this.style);
  }
}
