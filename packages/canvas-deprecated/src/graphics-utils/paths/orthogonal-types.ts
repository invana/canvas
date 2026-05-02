/** Direction hint for orthogonal routing */
export type Direction = 'top' | 'bottom' | 'left' | 'right' | 'auto';

/**
 * Style options for orthogonal path drawing.
 *
 * All `stroke*` properties are forwarded directly to PixiJS `Graphics.stroke()`.
 * @see https://pixijs.download/dev/docs/scene.StrokeStyle.html
 */
export interface OrthogonalStyle {
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
  strokeCap?: 'butt' | 'round' | 'square';
  /**
   * How corners between path segments are rendered.
   * - `'miter'` — sharp point (default)
   * - `'round'` — rounded corner
   * - `'bevel'` — flat chamfer
   */
  strokeJoin?: 'miter' | 'round' | 'bevel';
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

/** A point with x/y coordinates used in orthogonal routing. */
export interface OrthogonalPoint { x: number; y: number; }
