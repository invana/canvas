import type { NodeTypeBinding } from '@invana/graph';

import type { NodeStructureFormState } from './types';

/** Seed the form from a `NodeTypeBinding` (use as `defaults`). */
export function bindingToForm(binding?: NodeTypeBinding): NodeStructureFormState {
  return {
    binding: {
      structure: binding?.structure ?? '',
      styling: binding?.styling ?? '',
    },
    bindings: Object.entries(binding?.bindings ?? {}).map(([slot, path]) => ({ slot, path })),
  };
}

/** Read the form back into a `NodeTypeBinding` (drops empty rows). */
export function formToBinding(values: NodeStructureFormState): NodeTypeBinding {
  const bindings: Record<string, string> = {};
  for (const row of values.bindings ?? []) {
    const slot = (row.slot ?? '').trim();
    const path = (row.path ?? '').trim();
    if (slot && path) bindings[slot] = path;
  }
  return {
    structure: values.binding?.structure ?? '',
    styling: values.binding?.styling ?? '',
    bindings,
  };
}
