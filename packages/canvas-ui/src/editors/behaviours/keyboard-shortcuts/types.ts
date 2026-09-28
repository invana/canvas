/**
 * Types for the KeyboardShortcutsBehaviour editor.
 *
 * `KeyboardShortcutsBehaviourOptions` lives in `@invana/canvas`, which canvas-ui
 * imports for types only; the editable shape is mirrored here as
 * {@link KeyboardShortcutsOptions} — keep it in sync by hand.
 */

/** One binding — mirrors `KeyboardShortcutBinding`. */
export interface KeyboardShortcutBindingOption {
  keys: string;
  command: string;
  args?: unknown;
}

/** The subset of `KeyboardShortcutsBehaviourOptions` this editor produces. */
export interface KeyboardShortcutsOptions {
  bindings?: KeyboardShortcutBindingOption[];
  scope?: 'canvas' | 'document';
}

/**
 * Flat form fields. The bindings are one text field, a binding per line —
 * `keys → command` with optional JSON args after the command (see `mapping.ts`).
 */
export interface KeyboardShortcutsFields {
  scope?: 'canvas' | 'document';
  bindingsText?: string;
}

/** react-hook-form state: leaves register under `options.<field>`. */
export interface KeyboardShortcutsFormState {
  options: KeyboardShortcutsFields;
}
