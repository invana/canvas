import type { ClickSelectFields, ClickSelectOptions } from './types';

/**
 * Parse a comma-separated type list to trimmed, de-duplicated, non-empty
 * strings. `undefined` for an empty field, so an untouched input contributes
 * no key to the patch (see {@link formToOptions}).
 */
function parseTypeList(text: string | undefined): string[] | undefined {
  if (text === undefined) return undefined;
  const parsed = text
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return [...new Set(parsed)];
}

/**
 * Map a `ClickSelectBehaviourOptions`-shaped patch to the flat
 * {@link ClickSelectFields} the `@invana/forms` generator renders. The engine's
 * `trigger: SelectModifierKey[]` array collapses to a single select — the first
 * modifier, or `'none'` for an empty gate. The two exclusion lists encode
 * `string[]` as comma-separated text, the form generator having no list field.
 */
export function optionsToForm(o: ClickSelectOptions = {}): ClickSelectFields {
  return {
    excludeNodeTypes: o.excludeNodeTypes?.join(', '),
    excludeEdgeTypes: o.excludeEdgeTypes?.join(', '),
    multiple: o.multiple,
    trigger: o.trigger === undefined ? undefined : (o.trigger[0] ?? 'none'),
    degree: o.degree,
    direction: o.direction,
    state: o.state,
    unselectedState: o.unselectedState,
    raiseActive: o.raiseActive,
    clearOnBackground: o.clearOnBackground,
  };
}

/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link ClickSelectOptions} patch. Only fields the form set are included (no
 * `undefined` keys), so the result is safe to spread over the behaviour's
 * current options on `setOptions`. `trigger` re-expands to an array (`'none'` →
 * `[]`).
 */
export function formToOptions(f: ClickSelectFields): ClickSelectOptions {
  const out: ClickSelectOptions = {};
  const excludeNodeTypes = parseTypeList(f.excludeNodeTypes);
  if (excludeNodeTypes !== undefined) out.excludeNodeTypes = excludeNodeTypes;
  const excludeEdgeTypes = parseTypeList(f.excludeEdgeTypes);
  if (excludeEdgeTypes !== undefined) out.excludeEdgeTypes = excludeEdgeTypes;
  if (f.multiple !== undefined) out.multiple = f.multiple;
  if (f.trigger !== undefined) out.trigger = f.trigger === 'none' ? [] : [f.trigger];
  if (f.degree !== undefined) out.degree = f.degree;
  if (f.direction !== undefined) out.direction = f.direction;
  if (f.state !== undefined) out.state = f.state;
  if (f.unselectedState !== undefined) out.unselectedState = f.unselectedState;
  if (f.raiseActive !== undefined) out.raiseActive = f.raiseActive;
  if (f.clearOnBackground !== undefined) out.clearOnBackground = f.clearOnBackground;
  return out;
}
