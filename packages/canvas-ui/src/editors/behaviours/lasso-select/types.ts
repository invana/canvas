/**
 * Types for the LassoSelectBehaviour editor.
 *
 * Engine-agnostic by design: `@invana/graph` (where `LassoSelectBehaviour` and
 * its options live) is **not** imported. {@link LassoSelectOptions} mirrors the
 * editable subset of `LassoSelectBehaviourOptions` structurally — keep it in
 * sync by hand. The polygon overlay's colours are stored as `0xRRGGBB` numbers
 * by the engine (see `mapping.ts`).
 */

/** Modifier-key names accepted by the behaviour's `trigger` gate. */
export type LassoSelectModifierKey = 'shift' | 'control' | 'alt' | 'meta';

/**
 * Structural mirror of the engine's `LassoSelectStyle` — the freeform polygon
 * overlay visual. Colours are `0xRRGGBB` numbers; `strokeDash` (a number tuple)
 * is out of scope for the flat form and left untouched.
 */
export interface LassoSelectStyleOptions {
  fill?: number;
  fillAlpha?: number;
  stroke?: number;
  strokeAlpha?: number;
  strokeWidth?: number;
  strokeDash?: number[];
}

/**
 * The subset of `LassoSelectBehaviourOptions` this editor produces — a
 * serialisable patch. Callback (`onSelect`), the `enable` predicate, the
 * `clickSelectId` cross-behaviour reference, `strokeDash`, and base fields
 * (`id` / `targetLayerId` / `enabled` / `shortcuts`) are out of scope; only the
 * user-tunable scalars/enums/colours round-trip. `enableElements` keeps the
 * engine's array encoding; `trigger` keeps its `LassoModifierKey[]` encoding.
 */
export interface LassoSelectOptions {
  enableElements?: ('shape' | 'connector')[];
  trigger?: LassoSelectModifierKey[];
  immediately?: boolean;
  state?: string;
  clearOnBackground?: boolean;
  style?: LassoSelectStyleOptions;
}

/**
 * Flat form-field shape the `@invana/forms` generator renders. The engine's
 * `enableElements: ('shape'|'connector')[]` array is split into two booleans;
 * `trigger: LassoModifierKey[]` collapses to a single select (`'none'` = no
 * gate); the nested `style` group is flattened to `style`-prefixed scalars
 * (see `mapping.ts`).
 */
export interface LassoSelectFields {
  /** Whether nodes are eligible for lasso selection. Maps to `enableElements` including `'shape'`. */
  enableShapes?: boolean;
  /** Whether edges are eligible for lasso selection. Maps to `enableElements` including `'connector'`. */
  enableConnectors?: boolean;
  /** Single modifier gate. `'none'` maps to the engine's empty `trigger` array. */
  trigger?: 'none' | LassoSelectModifierKey;
  immediately?: boolean;
  state?: string;
  clearOnBackground?: boolean;
  styleFill?: string;
  styleFillAlpha?: number;
  styleStroke?: string;
  styleStrokeAlpha?: number;
  styleStrokeWidth?: number;
}

/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
export interface LassoSelectFormState {
  options: LassoSelectFields;
}
