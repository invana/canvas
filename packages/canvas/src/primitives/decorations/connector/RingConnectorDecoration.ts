import { Graphics } from 'pixi.js';
import { ConnectorDecorationBase } from '../../base/ConnectorDecorationBase';

/**
 * Static halo-style ring painted underneath a connector's path — a single
 * thick stroke tracing the host's routed geometry, behind the host stroke.
 *
 * Connectors are 1-D (no `inset`), so a true detached parallel-offset ring
 * would need separately routed geometry. This decoration takes the simpler
 * "single wider stroke" route: paint one band of `width` px behind the
 * host, optionally dashed, with `markerHalo` so the host's end markers
 * land inside the same band. Composes with `width` < host stroke for a
 * subtle outline or `width` > host stroke for a "highlighted edge" feel.
 *
 * For a thicker / softer feathered halo, use `GlowConnectorDecoration`
 * instead — it stacks multiple layers with alpha falloff.
 */
export interface RingConnectorDecorationStyle {
  readonly color: number;
  /** Halo band thickness in px. Default `6`. */
  readonly width?: number;
  /** Halo alpha, `[0, 1]`. Default `0.6`. */
  readonly alpha?: number;
  /** Dashed band — `[dashLength, gapLength]` in px. Default solid. */
  readonly dashArray?: readonly [number, number];
}

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
