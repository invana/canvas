/**
 * `MarchingAntsConnectorDecoration` — animated dashed overlay for connectors
 * with a scrolling phase offset (the classic crawling-ants animation).
 *
 * Registered as kind `'marching-ants-connector'`, target `'connector'`. Lands
 * in the `'fx'` slot z-band (above the connector) by default.
 *
 * Implementation: each `tick` advances `dashOffset` by `speed * deltaMs`
 * pixels and replays the connector's silhouette via
 * `connector.paintInto(g, spec, polyline, { stroke, dash })`. Because
 * `paintInto` knows the connector's actual primitives (e.g.
 * `quadraticCurveTo` for `CurveConnector`), the ants follow the real curve
 * shape — they don't draw straight chords across smoothed segments.
 *
 * Markers paint in their own spec colour (no `tintMarkers`) so the dashed
 * line appears to "feed into" a solid marker — the conventional CAD-tool
 * look. For unified-silhouette coverage (e.g. halo, glow), use a different
 * decoration that sets `tintMarkers`.
 */

import { Container, Graphics } from 'pixi.js';
import type { ConnectorDecorationHostInfo, IConnectorDecoration } from '../types';

export interface MarchingAntsConnectorStyle {
  readonly color: number;
  /** Stroke width. Default `1.5`. */
  readonly width?: number;
  /** 0..1. Default `1`. */
  readonly alpha?: number;
  /** Length of each dash. Default `6`. */
  readonly dashLength?: number;
  /** Length of the gap between dashes. Default `4`. */
  readonly gapLength?: number;
  /** Pixels per ms the offset advances. Default `0.04` (≈ slow crawl). */
  readonly speed?: number;
  /** Pixi line cap. Default `'butt'`. */
  readonly cap?: 'butt' | 'round' | 'square';
  /** Pixi line join. Default `'miter'`. */
  readonly join?: 'miter' | 'round' | 'bevel';
}

export class MarchingAntsConnectorDecoration
  implements IConnectorDecoration<MarchingAntsConnectorStyle>
{
  readonly style: MarchingAntsConnectorStyle;
  private readonly gfx: Container;
  private readonly graphics: Graphics;
  private host?: ConnectorDecorationHostInfo;
  private offset = 0;

  constructor(style: MarchingAntsConnectorStyle) {
    this.style = style;
    this.gfx = new Container();
    this.gfx.label = 'deco:marching-ants-connector';
    this.graphics = new Graphics();
    this.gfx.addChild(this.graphics);
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
    const speed = this.style.speed ?? 0.04;
    const dash = this.style.dashLength ?? 6;
    const gap = this.style.gapLength ?? 4;
    const cycle = dash + gap;
    if (cycle > 0) {
      this.offset = (this.offset + speed * deltaMs) % cycle;
      if (this.offset < 0) this.offset += cycle;
    }
    this.redraw();
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
    const width = this.style.width ?? 1.5;
    if (width <= 0) return;

    host.connector.paintInto(g, host.connectorSpec, host.polyline, {
      stroke: {
        color: this.style.color,
        width,
        alpha: this.style.alpha ?? 1,
        cap: this.style.cap,
        join: this.style.join,
      },
      dash: {
        dashLength: this.style.dashLength ?? 6,
        gapLength: this.style.gapLength ?? 4,
        dashOffset: this.offset,
      },
    });
  }
}
