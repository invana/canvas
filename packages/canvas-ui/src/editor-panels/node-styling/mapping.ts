import type { LabelStyling, NodeStylingTemplate, SlotStyling } from '@invana/graph';

import { asRole, NO_ROLE } from '../../editors/field-helpers';
import type { NodeStylingFormState } from './types';

/** Seed the form from a `NodeStylingTemplate` (use as `defaults`). */
export function stylingToForm(styling: NodeStylingTemplate = { name: '' }): NodeStylingFormState {
  return {
    styling: {
      name: styling.name ?? '',
      fillRole: styling.fillRole ?? NO_ROLE,
      strokeRole: styling.strokeRole ?? NO_ROLE,
      strokeWidth: styling.strokeWidth ?? 1.5,
      fillAlpha: styling.fillAlpha ?? 1,
      strokeAlpha: styling.strokeAlpha ?? 1,
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

/**
 * Read the form back into a pruned `NodeStylingTemplate` (drops empty roles).
 *
 * `base` is the template the form was seeded from, and passing it matters:
 * this function **rebuilds** the template from the fields the form models, so
 * anything it doesn't model would otherwise be dropped on every save. The form
 * is a role-and-typography editor, so what it doesn't model is the literal
 * colour pairs (`fill` / `stroke` / `bg` / `accent`), the rest of `label`'s
 * typography, and — since this is structural rather than cosmetic —
 * {@link NodeStylingTemplate.group}.
 *
 * Losing `group` is the sharp edge: a styling template carries whether nodes of
 * its type render as a **container**, so a silent drop would un-frame every
 * group in the graph on an unrelated colour edit. Carrying `base` through is
 * what stops an editor from deleting what it can't show.
 *
 * Per-slot extras (`color`, `fontFamily`, `fontStyle`) are still dropped — the
 * slot rows are rebuilt by name and reconciling them is a separate job.
 */
export function formToStyling(
  values: NodeStylingFormState,
  base?: NodeStylingTemplate,
): NodeStylingTemplate {
  const styling = values.styling ?? ({} as NodeStylingFormState['styling']);
  const slots = values.slots ?? [];
  const out: NodeStylingTemplate = {
    // Fields the form cannot show, carried verbatim so a save never deletes them.
    ...(base?.fill !== undefined ? { fill: base.fill } : {}),
    ...(base?.stroke !== undefined ? { stroke: base.stroke } : {}),
    ...(base?.bg !== undefined ? { bg: base.bg } : {}),
    ...(base?.accent !== undefined ? { accent: base.accent } : {}),
    ...(base?.group ? { group: base.group } : {}),
    name: (styling.name ?? '').trim(),
  };

  if (styling.fillAlpha !== undefined && styling.fillAlpha < 1) out.fillAlpha = styling.fillAlpha;
  if (styling.strokeAlpha !== undefined && styling.strokeAlpha < 1) {
    out.strokeAlpha = styling.strokeAlpha;
  }

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
      // Same carry-through as above, for the label typography the form omits.
      ...(base?.label ?? {}),
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
