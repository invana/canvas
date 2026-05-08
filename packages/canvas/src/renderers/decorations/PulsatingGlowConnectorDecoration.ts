/**
 * `PulsatingGlowConnectorDecoration` — thin Pixi adapter over the draw-layer
 * `draw.PulsatingGlowConnectorDecoration` animated state+style emitter.
 *
 * Registered as kind `'pulsating-glow'`, target `'connector'`.
 *
 * Lifecycle: owns a slot Container + N inner Graphics (one per layer:
 * outermost feather first, brightest core last). On `mount`/`update` it
 * paints each layer once via `host.connector.paintInto` so the glow hugs
 * the full silhouette (path + markers, curve-faithful). On each `tick` it
 * advances the pulse phase and applies the resulting alpha to the slot
 * Container — geometry is fixed between updates, so per-frame cost is one
 * scalar write.
 *
 * Pair with a slot whose `slotZIndex` is negative (e.g. `'glow'`) so the
 * glow stacks below the connector body.
 */

import { Container, Graphics } from 'pixi.js';
import {
  PulsatingGlowConnectorDecoration as DrawGlow,
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
  private readonly impl: DrawGlow;
  /** One Graphics per layer (outermost feather first, brightest core last). */
  private layers: Graphics[] = [];
  private host: ConnectorDecorationHostInfo | null = null;

  constructor(style: PulsatingGlowConnectorStyle) {
    this.style = style;
    this.gfx = new Container();
    this.gfx.label = 'deco:pulsating-glow';
    this.impl = new DrawGlow(style);
    this.gfx.alpha = this.impl.containerAlpha();
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
    this.gfx.alpha = this.impl.containerAlpha();
    return more;
  }

  destroy(): void {
    this.gfx.destroy({ children: true });
    this.layers = [];
  }

  private repaint(): void {
    const host = this.host;
    if (!host) return;
    const paintInto = host.connector.paintInto;
    const styles = this.impl.styles(readConnectorStrokeWidth(host.connectorSpec));
    this.syncLayers(styles.length);

    if (!paintInto || host.polyline.length < 2) {
      for (const g of this.layers) g.clear();
      return;
    }

    for (let i = 0; i < styles.length; i++) {
      const g = this.layers[i]!;
      g.clear();
      paintInto.call(host.connector, g, host.connectorSpec, host.polyline, styles[i]!);
    }
  }

  private syncLayers(count: number): void {
    while (this.layers.length < count) {
      const g = new Graphics();
      this.gfx.addChild(g);
      this.layers.push(g);
    }
    while (this.layers.length > count) {
      const g = this.layers.pop()!;
      g.destroy();
    }
  }
}

function readConnectorStrokeWidth(spec: unknown): number {
  const w = (spec as { strokeWidth?: number }).strokeWidth;
  return typeof w === 'number' && w > 0 ? w : 1;
}
