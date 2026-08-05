import { Container, FillGradient, Graphics } from 'pixi.js';
import { ShapeDecorationBase } from '../../base/ShapeDecorationBase';

/**
 * Liquid fill — paints a fluid level inside the host's silhouette, with a
 * vertical gradient and an optional wavy surface. Achieved without a "fill
 * provider" hook on shapes: the decoration paints a fluid polygon into its
 * own Graphics and masks the whole thing with the host silhouette via
 * `host.shape.paintInto({ fill: true })`.
 *
 * **Stroke compatibility.** When the host shape's stroke alignment is
 * `'outside'`, the stroke sits outside the silhouette and the mask leaves it
 * fully visible. For `'center'` / `'inside'`, the liquid covers the inside
 * portion of the stroke. Prefer `'outside'` for tank / pill diagrams.
 *
 * **Animation.** When `wave` is omitted the surface is a flat horizontal
 * line and `tick` returns `false` — the renderer retires the decoration
 * from its animation set, so still-water mode costs zero per frame after
 * `mount`. Supply `wave` to animate the meniscus.
 */
export interface LiquidFillDecorationStyle {
  /** Surface height as a fraction of host bounds height. `0` empty, `1` full. Default `0.6`. */
  readonly fillLevel?: number;
  /** Gradient colour at the surface. Default light blue (`0x9bbedb`). */
  readonly colorTop?: number;
  /** Gradient colour at the bottom. Default dark blue (`0x2d4d6e`). */
  readonly colorBottom?: number;
  /** Overall opacity of the fluid. Default `1`. */
  readonly alpha?: number;
  /**
   * Wave configuration. Omit (or pass `undefined`) for a flat still surface.
   * Provide for an animated meniscus — phase advances every frame.
   */
  readonly wave?: {
    /** Peak vertical displacement of the surface, px. Default `3`. */
    readonly amplitude?: number;
    /** Distance between wave crests, px. Default `80`. */
    readonly wavelength?: number;
    /** Time for one full phase cycle, ms. Default `1800`. */
    readonly periodMs?: number;
    /** Sample points per wavelength. Higher = smoother + more expensive. Default `12`. */
    readonly resolution?: number;
  };
  /**
   * Optional thin highlight band stroked along the surface (gloss / meniscus
   * effect). Opt-in: omit the field to skip drawing the highlight entirely.
   */
  readonly surfaceHighlight?: {
    /** Default `0xffffff`. */
    readonly color?: number;
    /** Default `0.35`. */
    readonly alpha?: number;
    /** Stroke width in px. Default `3`. */
    readonly thickness?: number;
  };
}

export class LiquidFillDecoration extends ShapeDecorationBase<LiquidFillDecorationStyle> {
  private maskGfx: Graphics | null = null;
  private fluidContainer: Container | null = null;
  private fluidGfx: Graphics | null = null;
  private highlightGfx: Graphics | null = null;
  private gradient: FillGradient | null = null;
  private wavePhase = 0;

  protected repaint(): void {
    const host = this.host;
    if (!host || !host.shape.paintInto) return;

    if (!this.maskGfx) {
      this.maskGfx = new Graphics();
      this.maskGfx.label = 'liquid:mask';
      this.gfx.addChild(this.maskGfx);
    }
    if (!this.fluidContainer) {
      this.fluidContainer = new Container();
      this.fluidContainer.label = 'liquid:fluid';
      this.gfx.addChild(this.fluidContainer);
    }
    if (!this.fluidGfx) {
      this.fluidGfx = new Graphics();
      this.fluidGfx.label = 'liquid:wave';
      this.fluidContainer.addChild(this.fluidGfx);
    }
    if (!this.highlightGfx) {
      this.highlightGfx = new Graphics();
      this.highlightGfx.label = 'liquid:highlight';
      this.fluidContainer.addChild(this.highlightGfx);
    }
    this.fluidContainer.mask = this.maskGfx;

    // Repaint silhouette mask — any non-transparent fill works as a mask.
    this.maskGfx.clear();
    host.shape.paintInto(this.maskGfx, {
      color: 0xffffff,
      alpha: 1,
      strokeWidth: 0,
      fill: true,
    });

    // (Re)build gradient when colours change. Local-space gradient auto-fits
    // its bounding box to the fill shape — top → surface, bottom → bottom.
    const colorTop = this.style.colorTop ?? 0x9bbedb;
    const colorBottom = this.style.colorBottom ?? 0x2d4d6e;
    this.gradient?.destroy();
    this.gradient = new FillGradient({
      type: 'linear',
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
      colorStops: [
        { offset: 0, color: colorTop },
        { offset: 1, color: colorBottom },
      ],
      textureSpace: 'local',
    });

    this.gfx.alpha = this.style.alpha ?? 1;
    this.drawFluid();
  }

  tick(deltaMs: number): boolean {
    if (!this.style.wave) {
      // Still water — no animation needed; renderer retires us.
      return false;
    }
    const period = this.style.wave.periodMs ?? 1800;
    this.wavePhase += (deltaMs / period) * Math.PI * 2;
    this.drawFluid();
    return true;
  }

  destroy(): void {
    this.gradient?.destroy();
    this.gradient = null;
    super.destroy();
  }

  private drawFluid(): void {
    const host = this.host;
    const fluid = this.fluidGfx;
    const highlight = this.highlightGfx;
    const gradient = this.gradient;
    if (!host || !fluid || !highlight || !gradient) return;

    const bounds = host.bounds;
    const fillLevel = Math.min(1, Math.max(0, this.style.fillLevel ?? 0.6));
    const wave = this.style.wave;

    const surfaceY = bounds.y + bounds.height * (1 - fillLevel);
    const left = bounds.x;
    const right = bounds.x + bounds.width;
    const bottom = bounds.y + bounds.height;
    const width = right - left;

    // Sample the surface polyline. Flat for still water; sinusoidal otherwise.
    const surfacePts: { x: number; y: number }[] = [];
    if (wave) {
      const amplitude = wave.amplitude ?? 3;
      const wavelength = Math.max(1, wave.wavelength ?? 80);
      const resolution = Math.max(2, wave.resolution ?? 12);
      const samples = Math.max(4, Math.ceil((width / wavelength) * resolution));
      for (let i = 0; i <= samples; i++) {
        const x = left + (width * i) / samples;
        const y = surfaceY + Math.sin((x / wavelength) * Math.PI * 2 + this.wavePhase) * amplitude;
        surfacePts.push({ x, y });
      }
    } else {
      surfacePts.push({ x: left, y: surfaceY }, { x: right, y: surfaceY });
    }

    // Body polygon: bottom-left → up to surface-left → wavy top → down to bottom-right → close.
    fluid.clear();
    fluid.moveTo(left, bottom);
    fluid.lineTo(surfacePts[0]!.x, surfacePts[0]!.y);
    for (let i = 1; i < surfacePts.length; i++) {
      fluid.lineTo(surfacePts[i]!.x, surfacePts[i]!.y);
    }
    fluid.lineTo(right, bottom);
    fluid.closePath();
    fluid.fill(gradient);

    // Optional highlight band along the surface — opt-in via style.
    highlight.clear();
    const hl = this.style.surfaceHighlight;
    if (hl) {
      const color = hl.color ?? 0xffffff;
      const alpha = hl.alpha ?? 0.35;
      const width = hl.thickness ?? 3;
      highlight.moveTo(surfacePts[0]!.x, surfacePts[0]!.y);
      for (let i = 1; i < surfacePts.length; i++) {
        highlight.lineTo(surfacePts[i]!.x, surfacePts[i]!.y);
      }
      highlight.stroke({ color, alpha, width });
    }
  }
}
