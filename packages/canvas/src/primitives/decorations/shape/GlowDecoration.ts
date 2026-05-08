import { Graphics } from 'pixi.js';
import { ShapeDecorationBase } from '../../base/ShapeDecorationBase';

/**
 * Halo / outer glow. Repaints the host's silhouette N times with widening
 * stroke and quadratic alpha falloff, producing a soft glow that hugs
 * whatever silhouette the host paints. Works on every shape that
 * implements `paintInto` (everything extending `ShapeBase`).
 *
 * Static — does not animate. Future variants (pulsating glow, breathing
 * glow) will extend this and add a `tick`.
 */
export interface GlowDecorationStyle {
  readonly color: number;
  /** Outermost glow extent, px. Default `12`. */
  readonly radius?: number;
  /** Number of feather layers (more = smoother + more expensive). Default `6`. */
  readonly layers?: number;
  /** Innermost (brightest) layer alpha. Default `0.55`. */
  readonly innerAlpha?: number;
}

export class GlowDecoration extends ShapeDecorationBase<GlowDecorationStyle> {
  private layerGfx: Graphics[] = [];

  protected repaint(): void {
    const host = this.host;
    if (!host) return;

    const radius = this.style.radius ?? 12;
    const layers = Math.max(1, this.style.layers ?? 6);
    const innerAlpha = this.style.innerAlpha ?? 0.55;
    const color = this.style.color;

    this.syncLayerCount(layers);

    const shape = host.shape;
    if (!shape.paintInto) {
      // Host shape doesn't support paintInto (e.g. text labels). Silently
      // clear all layers and skip — no glow on this shape kind.
      for (const g of this.layerGfx) g.clear();
      return;
    }

    // Outermost first (i=0), brightest last (i=layers-1).
    for (let i = 0; i < layers; i++) {
      const t = i / (layers - 1 || 1);                  // 0 (outer) .. 1 (inner)
      const strokeWidth = radius * (1 - t) + 1;          // wide outside, thin inside
      const alpha = innerAlpha * (t * t);                // quadratic falloff
      const g = this.layerGfx[i]!;
      g.clear();
      shape.paintInto(g, { color, alpha, strokeWidth, fill: false });
    }
  }

  private syncLayerCount(n: number): void {
    while (this.layerGfx.length < n) {
      const g = new Graphics();
      this.gfx.addChild(g);
      this.layerGfx.push(g);
    }
    while (this.layerGfx.length > n) {
      this.layerGfx.pop()!.destroy();
    }
  }
}
