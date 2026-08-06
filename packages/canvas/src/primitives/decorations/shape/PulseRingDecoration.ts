import { Graphics } from 'pixi.js';
import { ShapeDecorationBase } from '../../base/ShapeDecorationBase';

// Style types moved to the pixi-free spec vocabulary (`specs/decorationStyle.ts`)
// so domain packages can describe decorations without importing a backend.
// Re-exported here so existing importers keep working.
import type { PulseRingDecorationStyle } from '../../../specs/decorationStyle';
export type { PulseRingDecorationStyle } from '../../../specs/decorationStyle';



export class PulseRingDecoration extends ShapeDecorationBase<PulseRingDecorationStyle> {
  private ringGfx: Graphics[] = [];
  private elapsed = 0;

  protected repaint(): void {
    // Pulse geometry is purely a function of phase, so any host-bounds
    // change re-applies on the next tick. We only ensure the right number
    // of ring Graphics exist here.
    const rings = Math.max(1, this.style.rings ?? 2);
    this.syncRingCount(rings);
  }

  tick(deltaMs: number): boolean {
    const host = this.host;
    if (!host || !host.shape.paintInto) return true;

    this.elapsed += deltaMs;
    const period = this.style.periodMs ?? 1400;
    const maxRadius = this.style.maxRadius ?? 24;
    const rings = Math.max(1, this.style.rings ?? 2);
    const strokeWidth = this.style.strokeWidth ?? 2;
    const innerAlpha = this.style.innerAlpha ?? 0.7;
    const color = this.style.color;

    // Phase-distribute rings: each ring leads the next by `1/rings` of period.
    for (let i = 0; i < rings; i++) {
      const phase = ((this.elapsed / period) + i / rings) % 1;       // [0, 1)
      const radius = maxRadius * phase;                                // grows outward
      const alpha = innerAlpha * (1 - phase);                          // fades as it grows
      const g = this.ringGfx[i]!;
      g.clear();
      // Negative inset draws the silhouette OUTSIDE the shape by `radius` px.
      host.shape.paintInto(g, {
        color,
        alpha,
        strokeWidth,
        fill: false,
        inset: -radius,
      });
    }
    return true;
  }

  private syncRingCount(n: number): void {
    while (this.ringGfx.length < n) {
      const g = new Graphics();
      g.label = `pulse:ring-${this.ringGfx.length}`;
      this.gfx.addChild(g);
      this.ringGfx.push(g);
    }
    while (this.ringGfx.length > n) {
      this.ringGfx.pop()!.destroy();
    }
  }
}
