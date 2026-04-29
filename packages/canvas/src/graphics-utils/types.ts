import type { FillGradient, Texture } from 'pixi.js';

/** Minimal style shared by all graphics-utils drawing functions */
export interface DrawStyle {
  fill?: string | number | FillGradient | Texture;
  fillAlpha?: number;
  stroke?: string | number;
  strokeWidth?: number;
  strokeAlpha?: number;
  /** Dash pattern as [dashLength, gapLength]. Used by dashed-border animations. */
  dashArray?: [number, number];
}

/** Minimal style for path-only drawing functions */
export interface PathStyle {
  stroke?: string | number;
  strokeWidth?: number;
  strokeAlpha?: number;
}

/**
 * Resolve a fill value into the correct argument for `Graphics.fill()`.
 * PixiJS 8 accepts FillGradient/Texture directly, but not as `{ color: FillGradient }`.
 */
export function resolveFillArg(
  fill: DrawStyle['fill'],
  alpha: number,
): FillGradient | Texture | { color: string | number; alpha: number } | undefined {
  if (fill === undefined) return undefined;
  if (typeof fill === 'object') return fill; // FillGradient or Texture — pass directly
  return { color: fill, alpha };
}
