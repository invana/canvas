import { Graphics } from 'pixi.js';
import { ShapeDecorationBase } from '../../base/ShapeDecorationBase';

/**
 * Halo / outer glow. Repaints the host's silhouette N times with widening
 * stroke and quadratic alpha falloff, producing a soft glow that hugs
 * whatever silhouette the host paints. Works on every shape that
 * implements `paintInto` (everything extending `ShapeBase`).
 *
 * Static by default. Supply `pulse` to animate brightness sinusoidally —
 * the renderer will register `tick` and advance the phase each frame.
 */
export interface GlowDecorationStyle {
  readonly color: number;
  /** Outermost glow extent, px. Default `12`. */
  readonly radius?: number;
  /** Number of feather layers (more = smoother + more expensive). Default `6`. */
  readonly layers?: number;
  /** Innermost (brightest) layer alpha. Default `0.55`. */
  readonly innerAlpha?: number;
  /**
   * Optional brightness pulse. When omitted, the glow is static. When set,
   * the decoration alpha-multiplies between `1` and `1 - amplitude` on a
   * sinusoidal cycle of `periodMs` milliseconds.
   */
  readonly pulse?: {
    /** Cycle length in ms. Default `1200`. */
    readonly periodMs?: number;
    /** How far below full brightness the dim phase reaches, `[0, 1]`. Default `0.5`. */
    readonly amplitude?: number;
  };
}

export class GlowDecoration extends ShapeDecorationBase<GlowDecorationStyle> {
  private layerGfx: Graphics[] = [];
  private pulseElapsed = 0;

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
