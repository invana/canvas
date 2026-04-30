import type { FillGradient, Texture } from 'pixi.js';

/** PixiJS stroke line-cap. Controls how the ends of an open path look. */
export type LineCap = 'butt' | 'round' | 'square';

/** PixiJS stroke line-join. Controls how corners between segments look. */
export type LineJoin = 'miter' | 'round' | 'bevel';

/**
 * Minimal style shared by all graphics-utils drawing functions.
 *
 * All `stroke*` properties are forwarded directly to PixiJS `Graphics.stroke()`.
 * @see https://pixijs.download/dev/docs/scene.StrokeStyle.html
 */
export interface DrawStyle {
  fill?: string | number | FillGradient | Texture;
  fillAlpha?: number;
  /** Stroke colour. */
  stroke?: string | number;
  /** Stroke width in world pixels. Defaults to `1`. */
  strokeWidth?: number;
  /** Stroke opacity (0–1). Defaults to `1`. */
  strokeAlpha?: number;
  /**
   * How open-path ends are rendered.
   * - `'butt'` — flat (default)
   * - `'round'` — rounded end cap
   * - `'square'` — squared end cap
   */
  strokeCap?: LineCap;
  /**
   * How corners between path segments are rendered.
   * - `'miter'` — sharp point (default)
   * - `'round'` — rounded corner
   * - `'bevel'` — flat chamfer
   */
  strokeJoin?: LineJoin;
  /**
   * Where the stroke sits relative to the path.
   * - `0` — outside
   * - `0.5` — centred on the path (default)
   * - `1` — inside
   */
  strokeAlignment?: number;
  /**
   * Maximum allowed miter ratio before a sharp corner gets flattened to a bevel.
   * Only takes effect when `strokeJoin` is `'miter'`. Defaults to `10`.
   */
  strokeMiterLimit?: number;
  /** Dash pattern as [dashLength, gapLength]. Used by dashed-border animations. */
  dashArray?: [number, number];
}

/**
 * Minimal style for path-only drawing functions.
 *
 * All `stroke*` properties are forwarded directly to PixiJS `Graphics.stroke()`.
 * @see https://pixijs.download/dev/docs/scene.StrokeStyle.html
 */
export interface PathStyle {
  /** Stroke colour. */
  stroke?: string | number;
  /** Stroke width in world pixels. Defaults to `1`. */
  strokeWidth?: number;
  /** Stroke opacity (0–1). Defaults to `1`. */
  strokeAlpha?: number;
  /**
   * How open-path ends are rendered.
   * - `'butt'` — flat (default)
   * - `'round'` — rounded end cap
   * - `'square'` — squared end cap
   */
  strokeCap?: LineCap;
  /**
   * How corners between path segments are rendered.
   * - `'miter'` — sharp point (default)
   * - `'round'` — rounded corner
   * - `'bevel'` — flat chamfer
   */
  strokeJoin?: LineJoin;
  /**
   * Where the stroke sits relative to the path.
   * - `0` — outside
   * - `0.5` — centred on the path (default)
   * - `1` — inside
   */
  strokeAlignment?: number;
  /**
   * Maximum allowed miter ratio before a sharp corner gets flattened to a bevel.
   * Only takes effect when `strokeJoin` is `'miter'`. Defaults to `10`.
   */
  strokeMiterLimit?: number;
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
