import type { FieldConfig } from '@invana/forms';
import type { ColorRole } from '@invana/graph';

/**
 * Shared field-schema helpers for the node template editors — the colour-role
 * select and the `SlotBindingField` (slot name → dotted data path). Kept at
 * package level because both `NodeStructureEditor` and `NodeStylingEditor`
 * compose them.
 */

/** The theme colour-role vocabulary, in palette order. */
export const COLOR_ROLES: readonly ColorRole[] = [
  'surface',
  'cardBg',
  'foreground',
  'heading',
  'muted',
  'accent',
  'divider',
  'stroke',
  'selectionRing',
  'hoverRing',
];

/** `select` options for a colour role, with an explicit empty `(none)` entry. */
export const COLOR_ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: '(none)' },
  ...COLOR_ROLES.map((r) => ({ value: r, label: r })),
];

/** A `select` field bound to the colour-role vocabulary. */
export function roleField(name: string, label: string): FieldConfig {
  return { name, type: 'select', label, options: COLOR_ROLE_OPTIONS };
}

/** Narrow a form select value back to a `ColorRole` (empty → `undefined`). */
export function asRole(value: string | undefined): ColorRole | undefined {
  return value ? (value as ColorRole) : undefined;
}

/**
 * **SlotBindingField** — the shared primitive for one `slot → data field`
 * mapping row: a slot name and a dotted data path. Rendered under a
 * `rows.<i>` / `bindings.<i>` `ObjectField`, one row per slot.
 */
export const SLOT_BINDING_FIELDS: FieldConfig[] = [
  { name: 'slot', type: 'text', label: 'Slot' },
  { name: 'path', type: 'text', label: 'Data field', description: 'Dotted path, e.g. data.name' },
];
