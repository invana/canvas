import { Graphics } from 'pixi.js';
import { ConnectorDecorationBase } from '../../base/ConnectorDecorationBase';

// Style types moved to the pixi-free spec vocabulary (`specs/decorationStyle.ts`)
// so domain packages can describe decorations without importing a backend.
// Re-exported here so existing importers keep working.
import type { RingConnectorDecorationStyle } from '../../../specs/decorationStyle';
export type { RingConnectorDecorationStyle } from '../../../specs/decorationStyle';



export class RingConnectorDecoration extends ConnectorDecorationBase<RingConnectorDecorationStyle> {
  private readonly band = new Graphics();

  constructor(style: RingConnectorDecorationStyle) {
    super(style);
    this.band.label = 'ring:band';
    this.gfx.addChild(this.band);
  }

  /**
   * The band extends `width / 2` past each path endpoint (a centered stroke
   * widens equally on both sides). Asking the renderer to inset both ends
   * by that amount keeps the halo's outer edge sitting at the anchor
   * instead of poking past it.
   */
  getEndPadding(): { source: number; target: number } {
    const half = (this.style.width ?? 6) / 2;
    return { source: half, target: half };
  }

  protected repaint(): void {
    const host = this.host;
    if (!host) return;

    const width = this.style.width ?? 6;
    const alpha = this.style.alpha ?? 0.6;
    const color = this.style.color;
    const dashArray = this.style.dashArray;

    this.band.clear();
    host.connector.paintInto(this.band, host.connectorSpec, host.path, {
      color,
      alpha,
      strokeWidth: width,
      tintMarkers: true,
      markerHalo: true,
      ...(dashArray ? { dashArray } : {}),
    });
  }
}
