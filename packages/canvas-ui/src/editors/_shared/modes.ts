import type { FieldConfig } from '@invana/forms';

/**
 * The modeller's interaction modes (`view.interaction.viewMode` values the
 * `tool.active` command offers), in toolbar order.
 */
export const MODELLER_MODES: readonly { value: string; label: string }[] = [
  { value: 'select', label: 'Select' },
  { value: 'add', label: 'Add node' },
  { value: 'connect', label: 'Connect' },
  { value: 'delete', label: 'Delete' },
];

/**
 * A multi-select checkbox group for `BehaviourOptions.modes` — the interaction
 * modes a behaviour is live in. No box ticked means every mode.
 */
export function modesField(): FieldConfig {
  return {
    name: 'modes',
    type: 'checkbox',
    label: 'Live in tools',
    description: 'Only run while the modeller tool is one of these. None ticked = always.',
    options: [...MODELLER_MODES],
    orientation: 'horizontal',
    colSpan: 2,
  };
}

/** `modes` option → checkbox values (`undefined` = none ticked). */
export function modesToForm(modes: readonly string[] | undefined): string[] {
  return modes ? [...modes] : [];
}

/**
 * Checkbox values → `modes` option. An empty group maps to `null`, which the
 * caller turns into `modes: undefined` (live in every mode); `undefined` means
 * the form never touched the field.
 */
export function formToModes(values: readonly string[] | undefined): string[] | null | undefined {
  if (values === undefined) return undefined;
  return values.length > 0 ? [...values] : null;
}
