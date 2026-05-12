import { Graphics } from 'pixi.js';
import { ConnectorDecorationBase } from '../../base/ConnectorDecorationBase';

/**
 * Soft halo around the routed path of a connector. Repaints the path N
 * times with widening stroke and quadratic alpha falloff, producing a
 * glow that hugs whatever curve the path resolves to. Works on every
 * router / pathStyle because geometry is delegated to
 * `host.connector.paintInto`.
 *
 * Static by default. Supply `pulse` to animate brightness sinusoidally —
 * geometry is only repainted on `repaint`; per-frame work touches
 * `this.gfx.alpha` and nothing else, so the pulse is essentially free.
 */
export interface GlowConnectorDecorationStyle {
  readonly color: number;
  /** Outermost glow extent in px (widest stroke). Default `12`. */
  readonly radius?: number;
  /** Number of feather layers (more = smoother + more expensive). Default `6`. */
  readonly layers?: number;
  /** Innermost (brightest) layer alpha. Default `0.55`. */
  readonly innerAlpha?: number;
  /**
   * Optional brightness pulse. When omitted, the glow is static. When set,
   * the decoration alpha-multiplies between `1` and `1 - amplitude` on a
   * sinusoidal cycle of `periodMs` milliseconds.
   */
  readonly pulse?: {
    /** Cycle length in ms. Default `1200`. */
    readonly periodMs?: number;
    /** How far below full brightness the dim phase reaches, `[0, 1]`. Default `0.5`. */
    readonly amplitude?: number;
  };
}

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
      this.gfx.addChild(g);
      this.layerGfx.push(g);
    }
    while (this.layerGfx.length > n) {
      this.layerGfx.pop()!.destroy();
    }
  }
}
