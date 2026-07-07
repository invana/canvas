/**
 * Types for the ThemeBehaviour editor.
 *
 * Engine-agnostic by design: `@invana/graph` (where `ThemeBehaviour` and its
 * options live) is **not** imported for values — canvas-ui mirrors the editable
 * option shape here as {@link ThemeOptions}, a plain serialisable patch the
 * consumer applies via `setOptions`. The mirror is structural, not derived; keep
 * it in sync with `ThemeBehaviourOptions` by hand.
 */

/** How the concrete light/dark kind is chosen. Mirrors the engine's `ThemeMode`. */
export type ThemeMode = 'system' | 'light' | 'dark';

/**
 * The serialisable subset of `ThemeBehaviourOptions` this editor produces.
 *
 * Out of scope: the `themes` **registry** (`ThemeRegistry` — a record of palette
 * objects), the `light` / `dark` single-layer **shorthand patch records**
 * (`Record<string, unknown>`), and the `accent` union (`'css-var' | number` —
 * whose source is really a mode, not a scalar); plus the base
 * `targetLayerId` / `enabled` / `shortcuts`. Only the scalar knobs round-trip:
 * `mode`, `active`, `fallback`, and the `accentVar` CSS-custom-property name.
 */
export interface ThemeOptions {
  mode?: ThemeMode;
  /** Active theme name. Matched to the host theme family. */
  active?: string;
  /** Theme used when `active` isn't found. */
  fallback?: string;
  /** CSS custom property read when the accent is sourced from a variable. */
  accentVar?: string;
}

/**
 * Flat form-field shape the `@invana/forms` generator renders — 1:1 with
 * {@link ThemeOptions} (all scalars, nothing to flatten). `mode` renders as a
 * select; the rest as text inputs.
 */
export interface ThemeFields {
  mode?: ThemeMode;
  active?: string;
  fallback?: string;
  accentVar?: string;
}

/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
export interface ThemeFormState {
  options: ThemeFields;
}
