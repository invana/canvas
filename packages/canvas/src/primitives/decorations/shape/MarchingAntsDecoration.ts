import { Graphics } from 'pixi.js';
import { ShapeDecorationBase } from '../../base/ShapeDecorationBase';

/**
 * Classic "marching ants" selection outline. Strokes the host silhouette
 * with a dashed border whose `dashOffset` advances each frame, producing
 * the characteristic crawling-along-the-edge animation seen in selection
 * marquees (Photoshop, Figma, etc.).
 *
 * Geometry is delegated to `host.shape.paintInto` with `dashArray` /
 * `dashOffset` overrides — the shape primitive itself does the
 * silhouette tessellation. Works on every shape that implements
 * `paintInto` (anything extending `ShapeBase`).
 */
export interface MarchingAntsDecorationStyle {
  readonly color: number;
  /** Stroke width in px. Default `1.5`. */
  readonly strokeWidth?: number;
  /** Dash length in px. Default `6`. */
  readonly dashLength?: number;
  /** Gap length in px. Default `4`. */
  readonly gapLength?: number;
  /**
   * March speed in px/sec along the perimeter. Default `24`.
   * Negative values reverse the march direction.
   */
  readonly speedPxPerSec?: number;
  /**
   * Distance from the host silhouette. Positive = inside, negative =
   * outside. Default `0` (on the silhouette itself).
   */
  readonly inset?: number;
  /** Overall decoration alpha. Default `1`. */
  readonly alpha?: number;
}

export class MarchingAntsDecoration extends ShapeDecorationBase<MarchingAntsDecorationStyle> {
  private antsGfx = new Graphics();
  private elapsedMs = 0;

  protected repaint(): void {
    // One-time attach; the tick loop redraws every frame so we don't need
    // to re-emit geometry here. Just ensure the Graphics child is mounted.
    if (this.antsGfx.parent !== this.gfx) {
      this.gfx.addChild(this.antsGfx);
    }
  }

  tick(deltaMs: number): boolean {
    const host = this.host;
    if (!host?.shape.paintInto) {
      this.antsGfx.clear();
      return true;
    }

    this.elapsedMs += deltaMs;
    const speed = this.style.speedPxPerSec ?? 24;
    const dashLen = Math.max(0.5, this.style.dashLength ?? 6);
    const gapLen = Math.max(0.5, this.style.gapLength ?? 4);
    // Negative offset → dashes appear to march in the direction the
    // shape's outline is traversed (counter-clockwise for circle, clockwise
    // for rect). Speed sign flips this.
    const dashOffset = -(this.elapsedMs / 1000) * speed;

    this.antsGfx.clear();
    host.shape.paintInto(this.antsGfx, {
      color: this.style.color,
      alpha: this.style.alpha ?? 1,
      strokeWidth: this.style.strokeWidth ?? 1.5,
      fill: false,
      dashArray: [dashLen, gapLen],
      dashOffset,
      inset: this.style.inset ?? 0,
    });
    return true;
  }
}
