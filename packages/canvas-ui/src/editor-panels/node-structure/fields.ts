import type { FieldConfig } from '@invana/forms';

/**
 * Field schema for {@link NodeStructureEditorPanel}. The structure / styling selects
 * depend on which templates the host has registered, so they're built from the
 * editor's `structures` / `stylings` props via {@link bindingScalarFields}.
 */

/** Build the scalar (structure + styling select) fields from available names. */
export function bindingScalarFields(structures: string[], stylings: string[]): FieldConfig[] {
  return [
    {
      name: 'structure',
      type: 'select',
      label: 'Structure',
      options: structures.map((s) => ({ value: s, label: s })),
    },
    {
      name: 'styling',
      type: 'select',
      label: 'Styling',
      options: stylings.map((s) => ({ value: s, label: s })),
    },
  ];
}
