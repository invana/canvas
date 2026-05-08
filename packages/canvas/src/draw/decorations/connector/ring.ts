/**
 * `ring-connector` — static halo decoration: one or more concentric strokes
 * around the connector's silhouette. State-free style emitter.
 *
 * Halo-style: each ring's `ConnectorPaintStyle` carries a stroke width that
 * INCLUDES the connector body (`connectorWidth + 2 * (inset + r * spacing +
 * width / 2)`), so when the consumer calls `IConnector.paintInto` the ring
 * extends `inset + r * spacing + width / 2` pixels beyond the connector
 * silhouette on each side. `tintMarkers: true` forces markers to paint in
 * the ring colour so the halo wraps the entire silhouette including arrows
 * / circles / diamonds.
 *
 * Concentric rings: outermost first in the returned array — consumers paint
 * in order so inner rings stack visually on top of outer rings within the
 * decoration's slot.
 *
 * Use a slot name with a negative `slotZIndex` (`'ring'`, `'halo'`, `'glow'`)
 * so the halo sits BELOW the connector body — see `SLOT_Z_TABLE` in the
 * renderer.
 *
 * No animation; no `tick`.
 */

import type { ConnectorPaintStyle } from '../../types';

export interface RingConnectorOpts {
  readonly color: number;
  /** Ring stroke thickness. Default `1`. */
  readonly width?: number;
  /** 0..1 alpha. Default `1`. */
  readonly alpha?: number;
  /** Perpendicular gap between connector body and innermost ring. Default `4`. */
  readonly inset?: number;
  /** Number of concentric rings, evenly spaced. Default `1`. */
  readonly ringCount?: number;
  /** Distance (px) between consecutive rings. Default `6`. */
  readonly ringSpacing?: number;
}

export class RingConnectorDecoration {
  constructor(private readonly opts: RingConnectorOpts) {}

  /**
   * Per-ring paint styles, outermost ring first. Returns an empty array
   * when stroke width is non-positive. `connectorWidth` is the host
   * connector's stroke width; pass `0` for draw-layer demos that want a
   * centerline-only halo (no host body).
   */
  styles(connectorWidth: number): readonly ConnectorPaintStyle[] {
    const width = this.opts.width ?? 1;
    if (width <= 0) return [];
    const alpha = this.opts.alpha ?? 1;
    const inset = this.opts.inset ?? 4;
    const ringCount = Math.max(1, Math.round(this.opts.ringCount ?? 1));
    const ringSpacing = this.opts.ringSpacing ?? 6;

    const out: ConnectorPaintStyle[] = new Array(ringCount);
    for (let r = 0; r < ringCount; r++) {
      const halo = inset + r * ringSpacing + width / 2;
      out[r] = {
        stroke: {
          color: this.opts.color,
          width: connectorWidth + 2 * halo,
          alpha,
        },
        tintMarkers: true,
      };
    }
    return out;
  }
}
