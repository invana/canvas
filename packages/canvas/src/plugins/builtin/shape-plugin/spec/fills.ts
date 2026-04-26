// ── Fill specifications ───────────────────────────────────────────────────────
// Pure type definitions — no runtime code.

export interface ColorStop {
  /** Position along the gradient, 0.0 (start) – 1.0 (end) */
  offset: number;
  color: string;
}

/** Flat solid color fill */
export interface SolidFill {
  type: 'solid';
  color: string;
  alpha?: number;
}

/** Linear gradient — rendered via PixiJS 8 FillGradient (native GPU) */
export interface LinearFill {
  type: 'linear';
  stops: ColorStop[];
  /** Gradient angle in degrees. 0 = left→right, 90 = top→bottom */
  angle?: number;
}

/** Radial gradient — rendered via PixiJS 8 FillGradient */
export interface RadialFill {
  type: 'radial';
  stops: ColorStop[];
  /** Center X as a ratio of shape width (0.5 = center). Default 0.5 */
  cx?: number;
  /** Center Y as a ratio of shape height (0.5 = center). Default 0.5 */
  cy?: number;
}

/**
 * Texture fill — renders a pre-registered texture as the shape fill.
 * The texture key must be registered via ShapePlugin.registerTexture() before use.
 * All shapes sharing the same key reference the same GPU texture — zero extra VRAM.
 */
export interface TextureFill {
  type: 'texture';
  /** Key previously registered with ShapePlugin.registerTexture(key, url) */
  src: string;
  alpha?: number;
}

/**
 * Icon fill — same as TextureFill but with an explicit tint color overlay.
 * Useful for monochrome SVG icons that need per-instance coloring.
 */
export interface IconFill {
  type: 'icon';
  /** Key previously registered with ShapePlugin.registerTexture(key, url) */
  src: string;
  tint?: string;
  alpha?: number;
}

export type FillSpec = SolidFill | LinearFill | RadialFill | TextureFill | IconFill;
