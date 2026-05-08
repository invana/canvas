/**
 * `BreathingConnectorDecoration` — thin Pixi adapter over the draw-layer
 * `draw.BreathingConnectorDecoration` animated state+style emitter.
 *
 * Registered as kind `'breathing-connector'`, target `'connector'`.
 *
 * Lifecycle: owns a slot Container + one Graphics. On each `tick` the draw
 * primitive advances the breathing phase; the wrapper asks for the current
 * style and routes it through `host.connector.paintInto` so the halo hugs
 * the full silhouette (path + markers, curve-faithful).
 *
 * Pair with a slot whose `slotZIndex` is negative (e.g. `'breathing'`) so
 * the halo stacks below the connector body.
 */

import { Container, Graphics } from 'pixi.js';
import {
  BreathingConnectorDecoration as DrawBreathing,
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
  private readonly impl: DrawBreathing;
  private host: ConnectorDecorationHostInfo | null = null;

  constructor(style: BreathingConnectorStyle) {
    this.style = style;
    this.gfx = new Container();
    this.gfx.label = 'deco:breathing-connector';
    this.graphics = new Graphics();
    this.gfx.addChild(this.graphics);
    this.impl = new DrawBreathing(style);
  }

  mount(host: ConnectorDecorationHostInfo): void {
    this.host = host;
    this.gfx.zIndex = host.slotZIndex;
    host.surface.addChild(this.gfx);
    this.repaint();
  }

  update(host: ConnectorDecorationHostInfo): void {
    this.host = host;
    this.repaint();
  }

  tick(deltaMs: number): boolean {
    const more = this.impl.tick(deltaMs);
    this.repaint();
    return more;
  }

  destroy(): void {
    this.gfx.destroy({ children: true });
  }

  private repaint(): void {
    const host = this.host;
    if (!host) return;
    this.graphics.clear();
    const paintInto = host.connector.paintInto;
    if (!paintInto || host.polyline.length < 2) return;
    const style = this.impl.style(readConnectorStrokeWidth(host.connectorSpec));
    if (!style) return;
    paintInto.call(
      host.connector,
      this.graphics,
      host.connectorSpec,
      host.polyline,
      style,
    );
  }
}

function readConnectorStrokeWidth(spec: unknown): number {
  const w = (spec as { strokeWidth?: number }).strokeWidth;
  return typeof w === 'number' && w > 0 ? w : 1;
}
