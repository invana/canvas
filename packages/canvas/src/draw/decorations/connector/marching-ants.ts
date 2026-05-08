/**
 * `marching-ants-connector` — animated dashed overlay along a connector with
 * a scrolling dash phase (the classic CAD "selection ants" effect).
 *
 * State + style emitter — owns animation phase only. Consumers obtain the
 * current `ConnectorPaintStyle` via `style()` and route it to whichever
 * paint path is appropriate:
 *   - The renderer wrapper (`renderers/decorations/MarchingAntsConnectorDecoration`)
 *     passes it to `IConnector.paintInto`, which strokes the full silhouette
 *     (path + markers, curve-smoothed) with the dash applied — so dashes
 *     follow the rendered curve, not the router's centerline polyline.
 *   - Draw-layer demos pass it to `paintCenterline` for a polyline-only
 *     dashed visual.
 *
 * Markers paint in their own spec colour (no `tintMarkers`) so the dashed
 * line appears to "feed into" a solid marker — the conventional CAD-tool
 * look. Halo-style decorations (glow, ring, pulse-ring, breathing) set
 * `tintMarkers: true` instead.
 */

import type {
  AnimatedConnectorDecoration,
  ConnectorPaintStyle,
} from '../../types';

export interface MarchingAntsConnectorOpts {
  readonly color: number;
  /** Stroke width. Default `1.5`. */
  readonly width?: number;
  /** 0..1 alpha. Default `1`. */
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
  implements AnimatedConnectorDecoration
{
  private offset = 0;

  constructor(private readonly opts: MarchingAntsConnectorOpts) {}

  tick(deltaMs: number): boolean {
    const cycle = (this.opts.dashLength ?? 6) + (this.opts.gapLength ?? 4);
    if (cycle > 0) {
      const speed = this.opts.speed ?? 0.04;
      this.offset = (this.offset + speed * deltaMs) % cycle;
      if (this.offset < 0) this.offset += cycle;
    }
    return true;
  }

  /**
   * Current paint style. Returns `null` when the configured stroke width is
   * non-positive (caller should skip painting). The style consumes the
   * connector's body width via `paintInto` (the renderer wrapper) — at the
   * draw layer the centerline-only stroke is rendered with the same width.
   */
  style(): ConnectorPaintStyle | null {
    const width = this.opts.width ?? 1.5;
    if (width <= 0) return null;
    return {
      stroke: {
        color: this.opts.color,
        width,
        alpha: this.opts.alpha ?? 1,
        cap: this.opts.cap ?? 'butt',
        join: this.opts.join ?? 'miter',
      },
      dash: {
        dashLength: this.opts.dashLength ?? 6,
        gapLength: this.opts.gapLength ?? 4,
        dashOffset: this.offset,
      },
    };
  }
}
