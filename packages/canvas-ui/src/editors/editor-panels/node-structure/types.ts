/**
 * react-hook-form state for {@link NodeStructureEditorPanel} — a per-type binding:
 * which structure + styling template, and the slot → data-field map.
 */

/** Scalar controls: the chosen structure + styling template names. */
export interface NodeStructureScalarFields {
  structure: string;
  styling: string;
}

/** One slot → data-field row (the shared `SlotBindingField`). */
export interface BindingRow {
  slot: string;
  path: string;
}

/** The editor's full form state. */
export interface NodeStructureFormState {
  binding: NodeStructureScalarFields;
  bindings: BindingRow[];
}
