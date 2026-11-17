import type { FieldConfig } from '@invana/forms';

/** `@invana/forms` field schema for the DrawGeoFeatureBehaviour editor. */
export const drawGeoFeatureFields: FieldConfig[] = [
  {
    name: 'tool',
    type: 'select',
    label: 'Tool',
    description: 'What a click draws. Setting one holds the map still (no pan, no double-click zoom); "none" gives it back.',
    options: [
      { value: 'none', label: 'None' },
      { value: 'polygon', label: 'Polygon' },
      { value: 'line', label: 'Line' },
      { value: 'circle', label: 'Circle' },
    ],
  },
  { name: 'author', type: 'text', label: 'Author', description: 'Recorded on each drawn feature as its author. Empty records none.' },
  { name: 'idPrefix', type: 'text', label: 'Id prefix', description: 'Generated feature ids start with this. Default "feature-".' },
];
