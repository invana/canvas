import type { FieldConfig } from '@invana/forms';

/**
 * `@invana/forms` field schema for the KeyboardShortcutsBehaviour editor. Field
 * `name`s match `KeyboardShortcutsFields` 1:1.
 */
export const keyboardShortcutsFields: FieldConfig[] = [
  {
    name: 'scope',
    type: 'select',
    label: 'Scope',
    options: [
      { label: 'This canvas', value: 'canvas' },
      { label: 'Whole page', value: 'document' },
    ],
    description: 'This canvas: keys count after a click inside its app. Whole page: every key on the page.',
  },
  {
    name: 'bindingsText',
    type: 'textarea',
    label: 'Bindings',
    rows: 8,
    placeholder: 'mod+z → history.undo\nescape → tool.active {"value":"select"}',
    description:
      'One per line: keys → command, then optional JSON args. mod = ⌘ on macOS, Ctrl elsewhere; "," separates alternative keys. Lines starting with # are ignored.',
  },
];
