import { Graphics } from 'pixi.js';
import { ShapeDecorationBase } from '../../base/ShapeDecorationBase';

// Style types moved to the pixi-free spec vocabulary (`specs/decorationStyle.ts`)
// so domain packages can describe decorations without importing a backend.
// Re-exported here so existing importers keep working.
import type { GlowDecorationStyle } from '../../../specs/decorationStyle';
export type { GlowDecorationStyle } from '../../../specs/decorationStyle';



export class GlowDecoration extends ShapeDecorationBase<GlowDecorationStyle> {
  private layerGfx: Graphics[] = [];
  private pulseElapsed = 0;

  protected repaint(): void {
    const host = this.host;
    if (!host) return;

    const maxStroke = this.style.strokeWidth ?? 12;
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
      const strokeWidth = maxStroke * (1 - t) + 1;       // wide outside, thin inside
      const alpha = innerAlpha * (t * t);                // quadratic falloff
      const g = this.layerGfx[i]!;
      g.clear();
      shape.paintInto(g, { color, alpha, strokeWidth, fill: false });
    }
  }

  /**
   * Advance the optional pulse phase. Geometry is repainted once at mount
   * (cheap) and never again — only `this.gfx.alpha` is touched per frame,
   * so animated pulse is essentially free.
   */
  tick(deltaMs: number): boolean {
    if (!this.style.pulse) return false;
    this.pulseElapsed += deltaMs;
    const period = this.style.pulse.periodMs ?? 1200;
    const amplitude = this.style.pulse.amplitude ?? 0.5;
    const phase = (this.pulseElapsed / period) * Math.PI * 2;
    // Map sin from [-1, 1] to [1 - amplitude, 1].
    this.gfx.alpha = 1 - amplitude * (0.5 - 0.5 * Math.sin(phase));
    return true;
  }

  /**
   * Outer edge of the halo — the widest stroke layer paints at roughly
   * `strokeWidth` past the silhouette (`paintInto` defaults to `'outside'`
   * alignment, so the full stroke sits outward). Reported so
   * `LabelDecoration` can push outside-placement labels past the glow.
   * The optional `pulse` only modulates alpha, not geometry, so the
   * resting extent is the only one worth reporting.
   */
  getOuterExtent(): number {
    return this.style.strokeWidth ?? 12;
  }

  private syncLayerCount(n: number): void {
    while (this.layerGfx.length < n) {
      const g = new Graphics();
      g.label = `glow:ring-${this.layerGfx.length}`;
      this.gfx.addChild(g);
      this.layerGfx.push(g);
    }
    while (this.layerGfx.length > n) {
      this.layerGfx.pop()!.destroy();
    }
  }
}
