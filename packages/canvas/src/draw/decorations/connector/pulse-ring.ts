/**
 * `pulse-ring-connector` — animated halo: rings expand from `startPadding`
 * to `endPadding` while alpha fades to zero, looping forever. Multiple
 * rings (`ringCount > 1`) share one elapsed-time clock with even phase
 * staggering — at any moment one ring is starting while another is fully
 * expanded.
 *
 * State + style emitter. Owns elapsed time only. Per-ring styles are
 * silhouette-halo strokes (`connectorWidth + 2 * (padding + width / 2)`)
 * with `tintMarkers: true`, so when the consumer routes them through
 * `IConnector.paintInto` each ring wraps the entire silhouette including
 * markers and curve smoothing.
 *
 * Use a slot with negative `slotZIndex` (`'pulse'`, `'halo'`, `'glow'`) so
 * pulses stack below the connector body.
 */

import type {
  AnimatedConnectorDecoration,
  ConnectorPaintStyle,
} from '../../types';

export interface PulseRingConnectorOpts {
  readonly color: number;
  /** Ring stroke thickness. Default `2`. */
  readonly width?: number;
  /** Starting alpha at the begin-pulse moment. Default `0.6`. */
  readonly alpha?: number;
  /** Padding at the begin-pulse moment. Default `0`. */
  readonly startPadding?: number;
  /** Padding at the end-pulse moment. Default `24`. */
  readonly endPadding?: number;
  /** Loop period in ms. Default `1500`. */
  readonly periodMs?: number;
  /** Number of concurrently visible rings, evenly staggered. Default `1`. */
  readonly ringCount?: number;
}

export class PulseRingConnectorDecoration
  implements AnimatedConnectorDecoration
{
  private elapsed = 0;

  constructor(private readonly opts: PulseRingConnectorOpts) {}

  tick(deltaMs: number): boolean {
    const period = this.opts.periodMs ?? 1500;
    if (period > 0) this.elapsed = (this.elapsed + deltaMs) % period;
    return true;
  }

  /**
   * Per-ring paint styles, ordered by ring index. Each ring is at a
   * different point in the staggered cycle, so widths and alphas differ.
   * `connectorWidth` is the host's stroke width (pass `0` for draw-layer
   * demos with no host body).
   */
  styles(connectorWidth: number): readonly ConnectorPaintStyle[] {
    const strokeWidth = this.opts.width ?? 2;
    if (strokeWidth <= 0) return [];

    const ringCount = Math.max(1, Math.round(this.opts.ringCount ?? 1));
    const period = this.opts.periodMs ?? 1500;
    const startPad = this.opts.startPadding ?? 0;
    const endPad = this.opts.endPadding ?? 24;
    const startAlpha = this.opts.alpha ?? 0.6;

    const out: ConnectorPaintStyle[] = new Array(ringCount);
    for (let r = 0; r < ringCount; r++) {
      const t = (this.elapsed / period + r / ringCount) % 1;
      const padding = startPad + (endPad - startPad) * t;
      const alpha = startAlpha * (1 - t);
      out[r] = {
        stroke: {
          color: this.opts.color,
          width: connectorWidth + 2 * (padding + strokeWidth / 2),
          alpha,
        },
        tintMarkers: true,
      };
    }
    return out;
  }
}
