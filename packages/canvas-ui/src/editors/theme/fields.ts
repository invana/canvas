import type { FieldConfig } from '@invana/forms';

/**
 * `@invana/forms` field schema for the ThemeBehaviour editor. The `mode` enum
 * (`'system' | 'light' | 'dark'`) renders as a select; `active`, `fallback`, and
 * `accentVar` as text inputs. Field `name`s match
 * {@link import('./types').ThemeFields} 1:1 so `options.<name>` lines up with
 * `mapping.ts`. The `themes` registry and `light` / `dark` shorthand records have
 * no fields here — they aren't flat scalars.
 */
export const themeFields: FieldConfig[] = [
  {
    name: 'mode',
    type: 'select',
    label: 'Colour mode',
    description: 'How the light/dark kind is chosen. "System" follows the OS setting.',
    options: [
      { label: 'System', value: 'system' },
      { label: 'Light', value: 'light' },
      { label: 'Dark', value: 'dark' },
    ],
  },
  {
    name: 'active',
    type: 'text',
    label: 'Active theme',
    description: 'Name of the theme to apply (e.g. "default", "forest", "ocean").',
  },
  {
    name: 'fallback',
    type: 'text',
    label: 'Fallback theme',
    description: 'Theme used when the active name is not found. Default "default".',
  },
  {
    name: 'accentVar',
    type: 'text',
    label: 'Accent CSS variable',
    description: 'CSS custom property read for the accent role. Default "--color-primary".',
  },
];
