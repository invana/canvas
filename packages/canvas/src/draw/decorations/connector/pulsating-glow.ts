/**
 * `pulsating-glow-connector` — animated soft halo: stacked silhouette
 * strokes (one core + N feather layers, each at progressively wider stroke
 * and lower alpha) with the slot's `alpha` oscillating over time.
 *
 * State + style emitter. Owns the pulse phase only — geometry is
 * fixed-per-update; the per-tick cost is a single scalar (`containerAlpha`)
 * the wrapper applies to the slot Container.
 *
 * Why thicker silhouette strokes instead of a Pixi `BlurFilter`: filters
 * render against the Container's AABB texture, which for a thin diagonal
 * connector is a tall rectangle — producing a rectangular halo rather than
 * one that hugs the line. Stacked silhouette repaints follow the connector
 * exactly, including curve smoothing and markers.
 *
 * Use a slot with negative `slotZIndex` (`'glow'`, `'halo'`) so the glow
 * sits below the connector body.
 */

import type {
  AnimatedConnectorDecoration,
  ConnectorPaintStyle,
} from '../../types';

export interface PulsatingGlowConnectorOpts {
  readonly color: number;
  /** Core stroke width (extra px added beyond the connector body). Default `8`. */
  readonly width?: number;
  /** Minimum container alpha during the pulse cycle. Default `0.35`. */
  readonly alphaMin?: number;
  /** Maximum container alpha during the pulse cycle. Default `0.9`. */
  readonly alphaMax?: number;
  /** Pulse period in ms. Default `1500`. */
  readonly periodMs?: number;
  /**
   * Number of feather layers stacked outside the core (in addition to the
   * core). Default `3`.
   */
  readonly layerCount?: number;
  /** Half-width step added per feather layer, in pixels. Default `5`. */
  readonly featherStep?: number;
  /**
   * Per-layer alpha multiplier. Each successive feather layer's alpha is
   * `prev * featherFalloff`. Default `0.5`.
   */
  readonly featherFalloff?: number;
}

export class PulsatingGlowConnectorDecoration
  implements AnimatedConnectorDecoration
{
  private phase = 0;

  constructor(private readonly opts: PulsatingGlowConnectorOpts) {}

  tick(deltaMs: number): boolean {
    const period = this.opts.periodMs ?? 1500;
    if (period > 0) {
      this.phase =
        (this.phase + (deltaMs / period) * Math.PI * 2) % (Math.PI * 2);
    }
    return true;
  }

  /**
   * Current container-level alpha multiplier. The wrapper applies this to
   * the decoration slot's Container `alpha` once per tick (one scalar
   * write), avoiding per-frame geometry repaints.
   */
  containerAlpha(): number {
    const k = (Math.sin(this.phase) + 1) / 2;
    const alphaMin = this.opts.alphaMin ?? 0.35;
    const alphaMax = this.opts.alphaMax ?? 0.9;
    return alphaMin + (alphaMax - alphaMin) * k;
  }

  /**
   * Stacked silhouette layer styles — outermost feather first, brightest
   * core last. Consumers paint them in this order so the core overlays the
   * feather. `connectorWidth` is the host's stroke width (pass `0` for
   * draw-layer demos with no host body).
   */
  styles(connectorWidth: number): readonly ConnectorPaintStyle[] {
    const width = this.opts.width ?? 8;
    if (width <= 0) return [];

    const layerCount = Math.max(0, Math.floor(this.opts.layerCount ?? 3));
    const featherStep = this.opts.featherStep ?? 5;
    const featherFalloff = this.opts.featherFalloff ?? 0.5;
    const color = this.opts.color;

    const out: ConnectorPaintStyle[] = new Array(layerCount + 1);
    let idx = 0;
    for (let i = layerCount; i >= 1; i--) {
      const halo = width / 2 + i * featherStep;
      out[idx++] = {
        stroke: {
          color,
          width: connectorWidth + 2 * halo,
          alpha: Math.pow(featherFalloff, i),
        },
        tintMarkers: true,
      };
    }
    out[idx] = {
      stroke: {
        color,
        width: connectorWidth + width,
        alpha: 1,
      },
      tintMarkers: true,
    };
    return out;
  }
}
