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
 * Build a PixiJS `StrokeStyle`-compatible options object from a `DrawStyle`/`PathStyle`.
 *
 * @remarks
 * PixiJS spreads the caller-supplied object onto its `defaultStrokeStyle`, so explicit
 * `undefined` values overwrite the engine's defaults (which corrupts `alignment`,
 * `miterLimit`, `cap`, `join`). This helper omits any optional key that is `undefined`
 * so PixiJS keeps its own defaults.
 */
export function resolveStrokeOpts(
  style: Pick<DrawStyle, 'stroke' | 'strokeWidth' | 'strokeAlpha' | 'strokeCap' | 'strokeJoin' | 'strokeAlignment' | 'strokeMiterLimit'>,
  defaults: { color?: string | number; width?: number; alpha?: number; cap?: LineCap; join?: LineJoin; alignment?: number; miterLimit?: number } = {},
): Record<string, unknown> {
  const color      = style.stroke           ?? defaults.color      ?? 0xffffff;
  const width      = style.strokeWidth      ?? defaults.width      ?? 1;
  const alpha      = style.strokeAlpha      ?? defaults.alpha      ?? 1;
  const cap        = style.strokeCap        ?? defaults.cap;
  const join       = style.strokeJoin       ?? defaults.join;
  const alignment  = style.strokeAlignment  ?? defaults.alignment;
  const miterLimit = style.strokeMiterLimit ?? defaults.miterLimit;
  const opts: Record<string, unknown> = { color, width, alpha };
  if (cap        !== undefined) opts.cap        = cap;
  if (join       !== undefined) opts.join       = join;
  if (alignment  !== undefined) opts.alignment  = alignment;
  if (miterLimit !== undefined) opts.miterLimit = miterLimit;
  return opts;
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
