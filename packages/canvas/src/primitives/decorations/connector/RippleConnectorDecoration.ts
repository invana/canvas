import { Graphics } from 'pixi.js';
import { ConnectorDecorationBase } from '../../base/ConnectorDecorationBase';

/**
 * Connector analogue of `PulseRingDecoration`. Each frame, every ring
 * strokes the host's body + markers at a width that grows outward over
 * one period and fades as it grows — so the wave inherits the connector's
 * silhouette (line shape, bends, arrowhead) instead of being a circular
 * pulse at a single point. Multiple concurrent rings are phase-
 * distributed across one period for a steady rhythm.
 *
 * Geometry is delegated to `connector.paintInto` with a widening
 * `strokeWidth` and `tintMarkers + markerHalo` (so the markers outline at
 * the ring's width, not scale up). The host's normal paint sits on top
 * (zIndex = 0; this decoration's slot z is typically < 0 for "behind"
 * rings, ≥ 0 for "above" rings — pick a slot name accordingly).
 */
export interface RippleConnectorDecorationStyle {
  readonly color: number;
  /**
   * Peak halo extent in px (half-width). Each ring's stroke widens from
   * `0` to `2 × maxRadius` over one period, so the silhouette appears to
   * push outward by up to `maxRadius` on each side. Default `16`.
   */
  readonly maxRadius?: number;
  /** Cycle length in ms. Default `1400`. */
  readonly periodMs?: number;
  /** Number of concurrent rings (phase-distributed). Default `2`. */
  readonly rings?: number;
  /** Initial (full-brightness) alpha at radius 0. Default `0.7`. */
  readonly innerAlpha?: number;
}

export class RippleConnectorDecoration extends ConnectorDecorationBase<RippleConnectorDecorationStyle> {
  private ringGfx: Graphics[] = [];
  private elapsed = 0;

  /**
   * The peak wave extends `maxRadius` px past each path endpoint (the
   * widest ring's stroke is `2 × maxRadius` centered on the path). Asking
   * the renderer to inset both ends by `maxRadius` makes the peak wave's
   * outer edge land at the anchor — the body / markers sit back from the
   * anchor by `maxRadius` so they're enveloped as each wave grows.
   */
  getEndPadding(): { source: number; target: number } {
    const r = this.style.maxRadius ?? 16;
    return { source: r, target: r };
  }

  protected repaint(): void {
    const rings = Math.max(1, this.style.rings ?? 2);
    this.syncRingCount(rings);
  }

  tick(deltaMs: number): boolean {
    const host = this.host;
    if (!host) return true;

    this.elapsed += deltaMs;
    const period = this.style.periodMs ?? 1400;
    const maxRadius = this.style.maxRadius ?? 16;
    const rings = Math.max(1, this.style.rings ?? 2);
    const innerAlpha = this.style.innerAlpha ?? 0.7;
    const color = this.style.color;

    // Phase-distribute rings: each ring leads the next by `1/rings` of period.
    for (let i = 0; i < rings; i++) {
      const phase = ((this.elapsed / period) + i / rings) % 1;     // [0, 1)
      const radius = maxRadius * phase;                              // grows outward
      const alpha = innerAlpha * (1 - phase);                        // fades as it grows
      const g = this.ringGfx[i]!;
      g.clear();
      if (radius <= 0 || alpha <= 0) continue;
      // Stroke the body at width = 2*radius (so it extends `radius` past
      // the line centerline on each side). The marker outlines at the same
      // width via `markerHalo`, so the whole silhouette pulses outward in
      // shape — line, bends, arrowhead alike.
      // No `cap` / `join` override here — Connector.drawGeometry falls back
      // to `spec.stroke.cap` / `join` when the style omits them, so the
      // ripple inherits whatever end / corner shape the host line uses.
      host.connector.paintInto(g, host.connectorSpec, host.path, {
        color,
        alpha,
        strokeWidth: 2 * radius,
        tintMarkers: true,
        markerHalo: true,
      });
    }
    return true;
  }

  private syncRingCount(n: number): void {
    while (this.ringGfx.length < n) {
      const g = new Graphics();
      g.label = `ripple:ring-${this.ringGfx.length}`;
      this.gfx.addChild(g);
      this.ringGfx.push(g);
    }
    while (this.ringGfx.length > n) {
      this.ringGfx.pop()!.destroy();
    }
  }
}
