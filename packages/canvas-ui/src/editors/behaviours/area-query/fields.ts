import type { FieldConfig } from '@invana/forms';

/** `@invana/forms` field schema for the AreaQueryBehaviour editor. */
export const areaQueryFields: FieldConfig[] = [
  { name: 'autoQuery', type: 'boolean', label: 'Select on draw', description: 'Selecting what is inside a feature as soon as it is added or changed. Default off.' },
  { name: 'withinKm', type: 'number', label: 'Within (km)', min: 0, step: 1, description: '0 selects what is inside; more also selects what is within this distance of the feature. Default 0.' },
];
