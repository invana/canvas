/**
 * `PulsatingGlowConnectorDecoration` — soft animated glow that wraps the
 * connector silhouette including its markers, with strength + alpha
 * oscillating over time.
 *
 * Registered as kind `'pulsating-glow'`, target `'connector'`. Use slot
 * `'glow'` (z = -200) so the glow lands behind the connector's own stroke.
 *
 * Implementation: `mount` repaints the connector's silhouette via
 * `connector.paintInto(g, spec, polyline, { stroke, tintMarkers: true })`
 * into the decoration's Graphics, then attaches a `BlurFilter` to the
 * Graphics' container. `tick` advances a phase and mutates the filter's
 * `strength` plus `gfx.alpha` — **no redraw** per tick, since neither
 * geometry nor colour change frame-to-frame. Only `update` (polyline
 * change) triggers a repaint.
 */

import { BlurFilter, Container, Graphics } from 'pixi.js';
import type { ConnectorDecorationHostInfo, IConnectorDecoration } from '../types';

export interface PulsatingGlowConnectorStyle {
  readonly color: number;
  /** Stroke width baseline. Default `8`. */
  readonly width?: number;
  /** Minimum container alpha during the pulse cycle. Default `0.25`. */
  readonly alphaMin?: number;
  /** Maximum container alpha during the pulse cycle. Default `0.75`. */
  readonly alphaMax?: number;
  /** Minimum BlurFilter strength. Default `4`. */
  readonly blurMin?: number;
  /** Maximum BlurFilter strength. Default `12`. */
  readonly blurMax?: number;
  /** Pulse period in ms. Default `1500`. */
  readonly periodMs?: number;
  /** Pixi line cap. Default `'round'` for a softer look. */
  readonly cap?: 'butt' | 'round' | 'square';
}

export class PulsatingGlowConnectorDecoration
  implements IConnectorDecoration<PulsatingGlowConnectorStyle>
{
  readonly style: PulsatingGlowConnectorStyle;
  private readonly gfx: Container;
  private readonly graphics: Graphics;
  private readonly blur: BlurFilter;
  private host?: ConnectorDecorationHostInfo;
  private phase = 0;

  constructor(style: PulsatingGlowConnectorStyle) {
    this.style = style;
    this.gfx = new Container();
    this.gfx.label = 'deco:pulsating-glow';
    this.graphics = new Graphics();
    this.gfx.addChild(this.graphics);
    this.blur = new BlurFilter({ strength: style.blurMin ?? 4 });
    this.gfx.filters = [this.blur];
    this.gfx.alpha = style.alphaMin ?? 0.25;
  }

  mount(host: ConnectorDecorationHostInfo): void {
    this.host = host;
    this.gfx.zIndex = host.slotZIndex;
    host.surface.addChild(this.gfx);
    this.redraw();
  }

  update(host: ConnectorDecorationHostInfo): void {
    this.host = host;
    this.redraw();
  }

  tick(deltaMs: number): boolean {
    const period = this.style.periodMs ?? 1500;
    if (period > 0) {
      this.phase = (this.phase + (deltaMs / period) * Math.PI * 2) % (Math.PI * 2);
    }
    const k = (Math.sin(this.phase) + 1) / 2;
    const alphaMin = this.style.alphaMin ?? 0.25;
    const alphaMax = this.style.alphaMax ?? 0.75;
    const blurMin = this.style.blurMin ?? 4;
    const blurMax = this.style.blurMax ?? 12;
    this.gfx.alpha = alphaMin + (alphaMax - alphaMin) * k;
    this.blur.strength = blurMin + (blurMax - blurMin) * k;
    return true;
  }

  destroy(): void {
    this.gfx.destroy({ children: true });
  }

  private redraw(): void {
    const host = this.host;
    if (!host) return;
    const g = this.graphics;
    g.clear();
    if (!host.connector.paintInto) return;
    const width = this.style.width ?? 8;
    if (width <= 0) return;

    host.connector.paintInto(g, host.connectorSpec, host.polyline, {
      stroke: {
        color: this.style.color,
        width,
        alpha: 1,
        cap: this.style.cap ?? 'round',
      },
      tintMarkers: true,
    });
  }
}
