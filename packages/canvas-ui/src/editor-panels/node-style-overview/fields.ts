import type { FieldConfig } from '@invana/forms';

import { COLOR_PRESETS } from '../../shared/colors';

/**
 * `@invana/forms` schema for {@link NodeStyleOverviewEditorPanel} — a single colour
 * control. The field `name` matches {@link NodeStyleOverviewFields} 1:1, so the
 * generator's `overview.color` path lines up with `mapping.ts`.
 */
export const nodeStyleOverviewFields: FieldConfig[] = [
  {
    name: 'color',
    type: 'color',
    label: 'Node color',
    presetColors: [...COLOR_PRESETS],
    description: 'Fill for simple shapes; body + accent parts for composite cards.',
  },
];
