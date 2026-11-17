import type { FieldConfig } from '@invana/forms';

/** `@invana/forms` field schema for the MeasureBehaviour editor. */
export const measureFields: FieldConfig[] = [
  {
    name: 'tool',
    type: 'select',
    label: 'Tool',
    description: 'Distance reads total length and the last bearing; area reads km². Setting one holds the map still; "none" gives it back.',
    options: [
      { value: 'none', label: 'None' },
      { value: 'distance', label: 'Distance' },
      { value: 'area', label: 'Area' },
    ],
  },
];
