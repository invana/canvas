/**
 * `breathing-connector` — animated halo: a single silhouette stroke whose
 * padding from the connector centerline oscillates sinusoidally between
 * `minPadding` and `maxPadding`, with alpha co-pulsing.
 *
 * State + style emitter. Owns elapsed time only. The emitted
 * `ConnectorPaintStyle` is a halo stroke (`connectorWidth + 2 * (padding +
 * width / 2)`, `tintMarkers: true`) so when routed through
 * `IConnector.paintInto` it wraps the full silhouette uniformly.
 *
 * Use a slot with negative `slotZIndex` (`'breathing'`, `'halo'`, `'glow'`)
 * so the halo sits below the connector body.
 */

import type {
  AnimatedConnectorDecoration,
  ConnectorPaintStyle,
} from '../../types';

export interface BreathingConnectorOpts {
  readonly color: number;
  /** Stroke thickness component. Default `2`. */
  readonly width?: number;
  /**
   * Peak stroke alpha (at the peak of the cycle). Alpha co-pulses to
   * `alpha * 0.5` at the trough. Default `0.9`.
   */
  readonly alpha?: number;
  /** Padding at the trough of the cycle. Default `2`. */
  readonly minPadding?: number;
  /** Padding at the peak of the cycle. Default `12`. */
  readonly maxPadding?: number;
  /** Loop period in ms. Default `1800`. */
  readonly periodMs?: number;
}

export class BreathingConnectorDecoration
  implements AnimatedConnectorDecoration
{
  private elapsed = 0;

  constructor(private readonly opts: BreathingConnectorOpts) {}

  tick(deltaMs: number): boolean {
    const period = this.opts.periodMs ?? 1800;
    if (period > 0) this.elapsed = (this.elapsed + deltaMs) % period;
    return true;
  }

  /**
   * Current paint style. `connectorWidth` is the host's stroke width (pass
   * `0` for draw-layer demos with no host body). Returns `null` when the
   * configured stroke width is non-positive.
   */
  style(connectorWidth: number): ConnectorPaintStyle | null {
    const width = this.opts.width ?? 2;
    if (width <= 0) return null;

    const period = this.opts.periodMs ?? 1800;
    const minPad = this.opts.minPadding ?? 2;
    const maxPad = this.opts.maxPadding ?? 12;
    const phase = 0.5 - 0.5 * Math.cos((this.elapsed / period) * Math.PI * 2);
    const padding = minPad + (maxPad - minPad) * phase;
    const baseAlpha = this.opts.alpha ?? 0.9;
    const alpha = baseAlpha * (0.5 + 0.5 * phase);

    return {
      stroke: {
        color: this.opts.color,
        width: connectorWidth + 2 * (padding + width / 2),
        alpha,
      },
      tintMarkers: true,
    };
  }
}
