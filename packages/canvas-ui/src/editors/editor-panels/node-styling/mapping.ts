import type { LabelStyling, NodeStylingTemplate, SlotStyling } from '@invana/graph';

import { asRole, NO_ROLE } from '../../field-helpers';
import type { NodeStylingFormState } from './types';

/** Seed the form from a `NodeStylingTemplate` (use as `defaults`). */
export function stylingToForm(styling: NodeStylingTemplate = { name: '' }): NodeStylingFormState {
  return {
    styling: {
      name: styling.name ?? '',
      fillRole: styling.fillRole ?? NO_ROLE,
      strokeRole: styling.strokeRole ?? NO_ROLE,
      strokeWidth: styling.strokeWidth ?? 1.5,
      bgRole: styling.bgRole ?? NO_ROLE,
      accentRole: styling.accentRole ?? NO_ROLE,
      labelColorRole: styling.label?.colorRole ?? NO_ROLE,
      labelFontSize: styling.label?.fontSize ?? 12,
      labelPlacement: styling.label?.placement ?? 'bottom',
    },
    slots: Object.entries(styling.slots ?? {}).map(([slot, s]) => ({
      slot,
      colorRole: s.colorRole ?? NO_ROLE,
      fontSize: s.fontSize ?? 13,
      fontWeight: typeof s.fontWeight === 'number' ? s.fontWeight : 400,
      uppercase: s.uppercase ?? false,
    })),
  };
}

/** Read the form back into a pruned `NodeStylingTemplate` (drops empty roles). */
export function formToStyling(values: NodeStylingFormState): NodeStylingTemplate {
  const styling = values.styling ?? ({} as NodeStylingFormState['styling']);
  const slots = values.slots ?? [];
  const out: NodeStylingTemplate = { name: (styling.name ?? '').trim() };

  if (asRole(styling.fillRole)) out.fillRole = asRole(styling.fillRole);
  if (asRole(styling.strokeRole)) {
    out.strokeRole = asRole(styling.strokeRole);
    out.strokeWidth = styling.strokeWidth;
  }
  if (asRole(styling.bgRole)) out.bgRole = asRole(styling.bgRole);
  if (asRole(styling.accentRole)) out.accentRole = asRole(styling.accentRole);

  const labelColorRole = asRole(styling.labelColorRole);
  if (labelColorRole || styling.labelFontSize) {
    out.label = {
      ...(labelColorRole ? { colorRole: labelColorRole } : {}),
      fontSize: styling.labelFontSize,
      placement: styling.labelPlacement as LabelStyling['placement'],
    };
  }

  const slotEntries = slots
    .filter((s) => s.slot.trim())
    .map((s): [string, SlotStyling] => {
      const entry: SlotStyling = { fontSize: s.fontSize, fontWeight: s.fontWeight };
      const role = asRole(s.colorRole);
      if (role) entry.colorRole = role;
      if (s.uppercase) entry.uppercase = true;
      return [s.slot.trim(), entry];
    });
  if (slotEntries.length > 0) out.slots = Object.fromEntries(slotEntries);

  return out;
}
