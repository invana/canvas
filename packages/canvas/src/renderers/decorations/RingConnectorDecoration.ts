/**
 * `RingConnectorDecoration` — thin Pixi adapter over the draw-layer
 * `draw.RingConnectorDecoration` state-free style emitter.
 *
 * Registered as kind `'ring-connector'`, target `'connector'`.
 *
 * Lifecycle: owns a slot Container + N inner `Graphics` (one per ring,
 * isolated path state). On `mount`/`update` it asks the draw primitive for
 * the per-ring styles and routes each through `host.connector.paintInto`
 * so the rings hug the full silhouette including markers and curve
 * smoothing. No tick — `ring-connector` is static.
 *
 * Pair with a slot whose `slotZIndex` is negative (e.g. `'ring'`) so the
 * halo stacks below the connector body.
 */

import { Container, Graphics } from 'pixi.js';
import {
  RingConnectorDecoration as DrawRing,
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
  private readonly impl: DrawRing;
  /** One Graphics per ring (outermost-first), isolated path state. */
  private rings: Graphics[] = [];
  private host: ConnectorDecorationHostInfo | null = null;

  constructor(style: RingConnectorStyle) {
    this.style = style;
    this.gfx = new Container();
    this.gfx.label = 'deco:ring-connector';
    this.gfx.sortableChildren = true;
    this.impl = new DrawRing(style);
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
      // Outer rings (lower index) sit visually behind inner rings.
      g.zIndex = -(styles.length - i);
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
