import { Graphics } from 'pixi.js';
import { ConnectorDecorationBase } from '../../base/ConnectorDecorationBase';

// Style types moved to the pixi-free spec vocabulary (`specs/decorationStyle.ts`)
// so domain packages can describe decorations without importing a backend.
// Re-exported here so existing importers keep working.
import type { GlowConnectorDecorationStyle } from '../../../specs/decorationStyle';
export type { GlowConnectorDecorationStyle } from '../../../specs/decorationStyle';



export class GlowConnectorDecoration extends ConnectorDecorationBase<GlowConnectorDecorationStyle> {
  private layerGfx: Graphics[] = [];
  private pulseElapsed = 0;

  /**
   * Halo extends `radius` px past each path endpoint (the outermost layer's
   * stroke is centered on the path and `radius` wide). Returning that as
   * end-padding asks the renderer to inset both ends by `radius` — so the
   * halo's outer edge lands at the anchor instead of overshooting.
   */
  getEndPadding(): { source: number; target: number } {
    const radius = this.style.radius ?? 12;
    return { source: radius, target: radius };
  }

  protected repaint(): void {
    const host = this.host;
    if (!host) return;

    const radius = this.style.radius ?? 12;
    const layers = Math.max(1, this.style.layers ?? 6);
    const innerAlpha = this.style.innerAlpha ?? 0.55;
    const color = this.style.color;

    this.syncLayerCount(layers);

    // Outermost first (i=0), brightest last (i=layers-1).
    for (let i = 0; i < layers; i++) {
      const t = i / (layers - 1 || 1);             // 0 (outer) .. 1 (inner)
      const strokeWidth = radius * (1 - t) + 1;     // wide outside, thin inside
      const alpha = innerAlpha * (t * t);           // quadratic falloff
      const g = this.layerGfx[i]!;
      g.clear();
      // No `cap` / `join` override — Connector.drawGeometry inherits them
      // from `spec.stroke` when omitted, so the halo matches the host's
      // own end / corner shape (matters at non-marker ends, where a round
      // cap would push the halo past the anchor with no marker to hide it).
      host.connector.paintInto(g, host.connectorSpec, host.path, {
        color,
        alpha,
        strokeWidth,
        // Halo the markers too: outline (don't fill) at this layer's width
        // and alpha. Marker geometry stays at host-stroke size; only the
        // outline thickness grows. The host paints its own filled marker on
        // top, so the visible result is "filled arrow inside a soft halo".
        tintMarkers: true,
        markerHalo: true,
      });
    }
  }

  tick(deltaMs: number): boolean {
    if (!this.style.pulse) return false;
    this.pulseElapsed += deltaMs;
    const period = this.style.pulse.periodMs ?? 1200;
    const amplitude = this.style.pulse.amplitude ?? 0.5;
    const phase = (this.pulseElapsed / period) * Math.PI * 2;
    this.gfx.alpha = 1 - amplitude * (0.5 - 0.5 * Math.sin(phase));
    return true;
  }

  private syncLayerCount(n: number): void {
    while (this.layerGfx.length < n) {
      const g = new Graphics();
      g.label = `glow:ring-${this.layerGfx.length}`;
      this.gfx.addChild(g);
      this.layerGfx.push(g);
    }
    while (this.layerGfx.length > n) {
      this.layerGfx.pop()!.destroy();
    }
  }
}
