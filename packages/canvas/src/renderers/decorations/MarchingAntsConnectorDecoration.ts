/**
 * `MarchingAntsConnectorDecoration` — thin Pixi adapter over the draw-layer
 * `draw.MarchingAntsConnectorDecoration` state+style emitter.
 *
 * Registered as kind `'marching-ants-connector'`, target `'connector'`.
 *
 * Lifecycle: owns a slot Container + one Graphics. On `mount`/`update`/each
 * `tick` it asks the draw primitive for the current `ConnectorPaintStyle`
 * and routes it to `host.connector.paintInto` — so dashes follow the
 * connector's actual rendered curve, not the router's centerline polyline,
 * and pick up markers as part of the silhouette.
 *
 * No animation logic lives here — that's all in
 * `draw/decorations/connector/marching-ants.ts`.
 */

import { Container, Graphics } from 'pixi.js';
import {
  MarchingAntsConnectorDecoration as DrawMarchingAnts,
  type MarchingAntsConnectorOpts,
} from '../../draw/decorations/connector/marching-ants';
import type {
  ConnectorDecorationHostInfo,
  IConnectorDecoration,
} from '../types';

export type MarchingAntsConnectorStyle = MarchingAntsConnectorOpts;

export class MarchingAntsConnectorDecoration
  implements IConnectorDecoration<MarchingAntsConnectorStyle>
{
  readonly style: MarchingAntsConnectorStyle;
  private readonly gfx: Container;
  private readonly graphics: Graphics;
  private readonly impl: DrawMarchingAnts;
  private host: ConnectorDecorationHostInfo | null = null;

  constructor(style: MarchingAntsConnectorStyle) {
    this.style = style;
    this.gfx = new Container();
    this.gfx.label = 'deco:marching-ants-connector';
    this.graphics = new Graphics();
    this.gfx.addChild(this.graphics);
    this.impl = new DrawMarchingAnts(style);
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
    const style = this.impl.style();
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
