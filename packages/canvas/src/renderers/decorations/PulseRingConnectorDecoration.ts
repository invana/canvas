/**
 * `PulseRingConnectorDecoration` — thin Pixi adapter over the draw-layer
 * `draw.PulseRingConnectorDecoration` animated state+style emitter.
 *
 * Registered as kind `'pulse-ring-connector'`, target `'connector'`.
 *
 * Lifecycle: owns a slot Container + N inner `Graphics` (one per ring). On
 * each `tick` the draw primitive advances elapsed time; the wrapper then
 * asks for the current per-ring styles and routes each through
 * `host.connector.paintInto`, so the pulse rings hug the silhouette
 * uniformly (including markers and curve smoothing).
 *
 * Pair with a slot whose `slotZIndex` is negative (e.g. `'pulse'`) so the
 * pulse halos stack below the connector body.
 */

import { Container, Graphics } from 'pixi.js';
import {
  PulseRingConnectorDecoration as DrawPulseRing,
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
  private readonly impl: DrawPulseRing;
  private rings: Graphics[] = [];
  private host: ConnectorDecorationHostInfo | null = null;

  constructor(style: PulseRingConnectorStyle) {
    this.style = style;
    this.gfx = new Container();
    this.gfx.label = 'deco:pulse-ring-connector';
    this.impl = new DrawPulseRing(style);
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
    this.rings = [];
  }

  private repaint(): void {
    const host = this.host;
    if (!host) return;
    const paintInto = host.connector.paintInto;
    const styles = this.impl.styles(readConnectorStrokeWidth(host.connectorSpec));
    this.syncRings(styles.length);

    if (!paintInto || host.polyline.length < 2) {
      for (const g of this.rings) g.clear();
      return;
    }

    for (let i = 0; i < styles.length; i++) {
      const g = this.rings[i]!;
      g.clear();
      paintInto.call(host.connector, g, host.connectorSpec, host.polyline, styles[i]!);
    }
  }

  private syncRings(count: number): void {
    while (this.rings.length < count) {
      const g = new Graphics();
      this.gfx.addChild(g);
      this.rings.push(g);
    }
    while (this.rings.length > count) {
      const g = this.rings.pop()!;
      g.destroy();
    }
  }
}

function readConnectorStrokeWidth(spec: unknown): number {
  const w = (spec as { strokeWidth?: number }).strokeWidth;
  return typeof w === 'number' && w > 0 ? w : 1;
}
