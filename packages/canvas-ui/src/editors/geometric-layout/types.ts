/**
 * Types for the GeometricLayout editor.
 *
 * Engine-agnostic: `@invana/graph-layout-geometric` (home of `GeometricLayout`
 * and its options) is **not** imported — canvas-ui may only use `@invana/graph`
 * types (package CLAUDE.md). The editable option shape is mirrored here as
 * {@link GeometricLayoutOptions}, a serialisable patch the consumer applies (a
 * layout re-run / `setOptions`). Keep the enum / fields in sync by hand.
 */

/**
 * Layout mode.
 * - `'grid'` — regular grid, row-major.
 * - `'snake'` — grid with alternating row direction (serpentine).
 * - `'circular'` — evenly spaced around one circle.
 */
export type GeometricLayoutMode = 'grid' | 'snake' | 'circular';

/**
 * The subset of `GeometricLayoutOptions` this editor produces — a serialisable
 * patch. `id` / `targetLayerId` (registry wiring) and function options are out
 * of scope; the tunable scalars round-trip. `transition` / `transitionEase`
 * come from the shared one-shot layout base.
 */
export interface GeometricLayoutOptions {
  mode?: GeometricLayoutMode;
  // grid / snake
  columns?: number;
  columnGap?: number;
  rowGap?: number;
  // circular
  radius?: number;
  nodeSpacing?: number;
  startAngle?: number;
  clockwise?: boolean;
  // common
  center?: { x?: number; y?: number };
  transition?: boolean;
  transitionEase?: string;
}

/**
 * Flat form-field shape. The `center: { x, y }` object is split into `centerX`
 * / `centerY` number fields (see `mapping.ts`); everything else matches
 * {@link GeometricLayoutOptions} 1:1.
 */
export interface GeometricLayoutFields {
  mode?: GeometricLayoutMode;
  columns?: number;
  columnGap?: number;
  rowGap?: number;
  radius?: number;
  nodeSpacing?: number;
  startAngle?: number;
  clockwise?: boolean;
  centerX?: number;
  centerY?: number;
  transition?: boolean;
  transitionEase?: string;
}

/** react-hook-form state — leaves register under `options.<field>`. */
export interface GeometricLayoutFormState {
  options: GeometricLayoutFields;
}
