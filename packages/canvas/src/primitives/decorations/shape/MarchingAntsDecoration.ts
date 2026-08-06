import { Graphics } from 'pixi.js';
import { ShapeDecorationBase } from '../../base/ShapeDecorationBase';

// Style types moved to the pixi-free spec vocabulary (`specs/decorationStyle.ts`)
// so domain packages can describe decorations without importing a backend.
// Re-exported here so existing importers keep working.
import type { MarchingAntsDecorationStyle } from '../../../specs/decorationStyle';
export type { MarchingAntsDecorationStyle } from '../../../specs/decorationStyle';



export class MarchingAntsDecoration extends ShapeDecorationBase<MarchingAntsDecorationStyle> {
  private antsGfx = new Graphics();
  private elapsedMs = 0;

  constructor(style: MarchingAntsDecorationStyle) {
    super(style);
    this.antsGfx.label = 'ants:path';
  }

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
