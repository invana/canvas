import { Graphics } from 'pixi.js';
import { ShapeDecorationBase } from '../../base/ShapeDecorationBase';

// Style types moved to the pixi-free spec vocabulary (`specs/decorationStyle.ts`)
// so domain packages can describe decorations without importing a backend.
// Re-exported here so existing importers keep working.
import type { RingDecorationStyle } from '../../../specs/decorationStyle';
export type { RingDecorationStyle } from '../../../specs/decorationStyle';



export class RingDecoration extends ShapeDecorationBase<RingDecorationStyle> {
  private readonly band = new Graphics();

  constructor(style: RingDecorationStyle) {
    super(style);
    this.band.label = 'ring:band';
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

    // Paint a stroke at `inset = -gap` (the silhouette pushed `gap` outward)
    // and let alignment: 'outside' place the entire `width`-thick band on
    // the *outside* of that path. Net result: visible ring sits at
    // [gap, gap + width] outside the body, with no bleed into the fill.
    shape.paintInto(this.band, {
      color,
      alpha,
      strokeWidth: width,
      alignment: 'outside',
      fill: false,
      inset: -gap,
      ...(dashArray ? { dashArray } : {}),
    });
  }

  /**
   * Outer edge of the band: `gap` pushes the silhouette outward, then the
   * full stroke width sits past that. Reported so `LabelDecoration` can
   * offset outside-placement labels past the ring.
   */
  getOuterExtent(): number {
    const width = this.style.width ?? 2;
    const gap = this.style.gap ?? 4;
    return gap + width;
  }
}
