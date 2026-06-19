import type { OneShotLayoutOptions } from '@invana/graph';

/**
 * Geometric layout mode.
 *
 * - `'grid'` — nodes on a regular grid, filled row-major (left→right, top→bottom).
 * - `'snake'` — like `grid`, but every other row reverses direction (a serpentine
 *   / boustrophedon fill) so consecutive nodes stay adjacent across row breaks.
 * - `'circular'` — nodes spaced evenly around a single circle.
 */
export type GeometricLayoutMode = 'grid' | 'snake' | 'circular';

/**
 * `GeometricLayout` options.
 *
 * Extends {@link OneShotLayoutOptions}, so it also accepts `id` / `targetLayerId`
 * (registry + `config.activeLayout` wiring) and `transition` / `transitionEase`
 * (glide vs snap — owned by the shared `OneShotPositionLayout` base). All three
 * modes are pure position moves, so they glide by default.
 *
 * Every field is optional with a sensible default; nodes are placed in store
 * iteration order.
 */
export interface GeometricLayoutOptions extends OneShotLayoutOptions {
  /** Layout mode. Default `'grid'`. */
  mode?: GeometricLayoutMode;

  // ─── grid / snake ──────────────────────────────────────────────────────
  /** Column count for `grid` / `snake`. Default `ceil(sqrt(n))` (a square-ish block). */
  columns?: number;
  /** Horizontal spacing between columns, in world units. Default `60`. */
  columnGap?: number;
  /** Vertical spacing between rows, in world units. Default `60`. */
  rowGap?: number;

  // ─── circular ──────────────────────────────────────────────────────────
  /**
   * Circle radius in world units. Default: auto — derived from the node count
   * and {@link nodeSpacing} so neighbours sit ~`nodeSpacing` apart along the arc.
   */
  radius?: number;
  /** Arc spacing used to auto-derive {@link radius} when it's omitted. Default `50`. */
  nodeSpacing?: number;
  /** Angle of the first node, in radians. Default `-π/2` (12 o'clock). */
  startAngle?: number;
  /** Whether nodes advance clockwise. Default `true`. */
  clockwise?: boolean;

  // ─── common ────────────────────────────────────────────────────────────
  /** Translate the whole layout by `(x, y)`. Default `{ x: 0, y: 0 }` (centred on origin). */
  center?: { x?: number; y?: number };
}
