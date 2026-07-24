/**
 * Types for the ColorByLabelBehaviour editor.
 *
 * Engine-agnostic by design: `@invana/graph` (where `ColorByLabelBehaviour` and
 * its options live) is **not** imported for values — canvas-ui mirrors the
 * editable option shape here as {@link ColorByLabelOptions}, a plain serialisable
 * patch the consumer applies via `setOptions`. The mirror is structural, not
 * derived; keep it in sync with `ColorByLabelBehaviourOptions` by hand.
 */

/**
 * The serialisable subset of `ColorByLabelBehaviourOptions` this editor
 * produces. The `nodeLabel` / `edgeLabel` **accessor callbacks** and the base
 * `targetLayerId` / `enabled` / `shortcuts` are out of scope. The `palette`
 * (`number[]`) is also omitted — `FieldType` has no array kind (a swatch-array
 * editor is future work). `fallbackColor` is an engine `0xRRGGBB` **number**
 * (default `0x9ca3af`).
 */
export interface ColorByLabelOptions {
  colorNodes?: boolean;
  colorEdges?: boolean;
  /** Colour for items whose label is missing/empty, as an engine `0xRRGGBB` number. */
  fallbackColor?: number;
}

/**
 * Flat form-field shape the `@invana/forms` generator renders. `fallbackColor`
 * is the `0xRRGGBB` number re-encoded as a `#rrggbb` hex string (the swatch's
 * format); the boolean toggles pass straight through.
 */
export interface ColorByLabelFields {
  colorNodes?: boolean;
  colorEdges?: boolean;
  /** Fallback colour as a `#rrggbb` hex string. */
  fallbackColor?: string;
}

/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
export interface ColorByLabelFormState {
  options: ColorByLabelFields;
}
