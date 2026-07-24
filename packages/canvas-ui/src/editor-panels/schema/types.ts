/**
 * State shapes for {@link SchemaEditorPanel} — a small, engine-agnostic editor for a
 * node **schema** (a titled list of typed fields, the ER / table-card shape).
 * The editor edits a {@link NodeSchema} and hands the patch back via `onSubmit`;
 * how it's applied (mutating a graph node's `data`, a redraw, etc.) is the
 * consumer's concern.
 */

/**
 * One field of a schema: a display name + a data-type token. Extra keys are
 * allowed and preserved verbatim, so consumers who add their own row controls
 * (via {@link SchemaEditorPanelProps.fieldRowFields} — e.g. `nullable`, `description`)
 * get those values back on the emitted schema.
 */
export interface SchemaFieldDef {
  name: string;
  /** Data-type token — one of {@link SCHEMA_TYPES} (`string` / `integer` / …). */
  type: string;
  /** Extra per-field attributes from custom row controls, preserved as-is. */
  [key: string]: unknown;
}

/** A node's schema: a title, an optional header colour, and the field list. */
export interface NodeSchema {
  label: string;
  /** Header band colour (engine `0xRRGGBB`). */
  headerColor?: number;
  fields: SchemaFieldDef[];
}

// ─── Form state (hex colours; the `@invana/forms` `color` control) ──────────

/** Scalar controls: the table title + header colour. */
export interface SchemaMetaFields {
  label: string;
  headerColor?: string;
}

/** The editor's full react-hook-form state. */
export interface SchemaEditorFormState {
  meta: SchemaMetaFields;
  fields: SchemaFieldDef[];
}
