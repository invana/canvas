import { Graphics } from 'pixi.js';
import { ShapeDecorationBase } from '../../base/ShapeDecorationBase';

/**
 * Static ring that traces the host silhouette at a fixed outward offset.
 *
 * Geometry: one `paintInto` call with a negative inset, so the ring sits
 * cleanly *outside* the body — independent from the host's own stroke.
 * Multiple rings (e.g. inner + outer) compose by attaching multiple Ring
 * decorations with different `gap` values; this class itself paints one
 * band per instance.
 *
 * Works on every shape that implements `paintInto` (everything extending
 * `ShapeBase`). On shape kinds without `paintInto` (e.g. plain text) the
 * decoration silently clears — same fallback as `GlowDecoration`.
 */
export interface RingDecorationStyle {
  readonly color: number;
  /** Ring stroke thickness, px. Default `2`. */
  readonly width?: number;
  /**
   * Gap between the host silhouette and the ring's inner edge, px.
   * Default `4`. Zero hugs the body; larger values produce a detached ring.
   */
  readonly gap?: number;
  /** Ring alpha, `[0, 1]`. Default `1`. */
  readonly alpha?: number;
  /** Dashed ring — `[dashLength, gapLength]` in px. Default solid. */
  readonly dashArray?: readonly [number, number];
}

export class RingDecoration extends ShapeDecorationBase<RingDecorationStyle> {
  private readonly band = new Graphics();

  constructor(style: RingDecorationStyle) {
    super(style);
    this.gfx.addChild(this.band);
  }

  protected repaint(): void {
    const host = this.host;
    if (!host) return;

    const width = this.style.width ?? 2;
    const gap = this.style.gap ?? 4;
    const alpha = this.style.alpha ?? 1;
    const color = this.style.color;
    const dashArray = this.style.dashArray;

    this.band.clear();

    const shape = host.shape;
    if (!shape.paintInto) {
      // Host shape doesn't support paintInto (e.g. plain text labels) —
      // silently skip, matching GlowDecoration's behaviour.
      return;
    }

    // Stroke center sits at `gap + width / 2` outside the silhouette, so
    // the visible band's inner edge lands at `gap` and outer edge at
    // `gap + width`. Negative inset = "outside" in shape.paintInto's vocab.
    shape.paintInto(this.band, {
      color,
      alpha,
      strokeWidth: width,
      fill: false,
      inset: -(gap + width / 2),
      ...(dashArray ? { dashArray } : {}),
    });
  }
}
