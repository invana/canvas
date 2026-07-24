/**
 * react-hook-form state for {@link NodeStylingEditorPanel}. Roles are carried as
 * plain strings (`''` = none) so the `select` chrome round-trips cleanly;
 * `mapping.ts` narrows them back to `ColorRole | undefined`.
 */

/** Scalar (non-array) styling controls, rendered under the `styling` ObjectField. */
export interface NodeStylingScalarFields {
  name: string;
  // simple
  fillRole: string;
  strokeRole: string;
  strokeWidth: number;
  // card
  bgRole: string;
  accentRole: string;
  // label
  labelColorRole: string;
  labelFontSize: number;
  labelPlacement: string;
}

/** One per-slot styling row (a `useFieldArray` entry). */
export interface SlotStylingRow {
  slot: string;
  colorRole: string;
  fontSize: number;
  fontWeight: number;
  uppercase: boolean;
}

/** The editor's full form state. */
export interface NodeStylingFormState {
  styling: NodeStylingScalarFields;
  slots: SlotStylingRow[];
}
