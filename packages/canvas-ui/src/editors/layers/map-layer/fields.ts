import type { FieldConfig } from '@invana/forms';

/**
 * `@invana/forms` field schema for the MapLayer editor, grouped into accordion
 * sections. Field `name`s match {@link MapLayerFields} 1:1.
 *
 * Static — none of the fields depend on live values, so this is a plain const
 * (the editor passes it straight through).
 */

const withGroup =
  (group: string) =>
  (f: FieldConfig): FieldConfig => ({ ...f, group });

const BASEMAP_FIELDS: FieldConfig[] = [
  {
    name: 'basemap',
    type: 'select',
    label: 'Basemap',
    description:
      'Built-in OpenFreeMap basemap, used when no style URL below applies. Auto follows light / dark; Themed also tints the map with the active theme family\'s colours.',
    options: [
      { value: 'light', label: 'Light' },
      { value: 'dark', label: 'Dark' },
      { value: 'auto', label: 'Auto (follow theme)' },
      { value: 'themed', label: 'Themed (tint from theme)' },
    ],
  },
  { name: 'styleUrl', type: 'text', label: 'Style URL', description: 'MapLibre style URL. Overrides the Basemap above. With neither set the map is blank (no outside request).' },
  { name: 'styleUrlDark', type: 'text', label: 'Dark style URL', description: 'Basemap style while the canvas theme is dark, e.g. https://tiles.openfreemap.org/styles/dark. Empty = use the Style URL in both themes.' },
];

const VIEW_FIELDS: FieldConfig[] = [
  { name: 'centerLng', type: 'number', label: 'Center longitude', min: -180, max: 180, step: 0.0001, description: 'Initial centre longitude in degrees.' },
  { name: 'centerLat', type: 'number', label: 'Center latitude', min: -90, max: 90, step: 0.0001, description: 'Initial centre latitude in degrees.' },
  { name: 'zoom', type: 'number', label: 'Zoom', min: 0, max: 22, step: 0.1, description: 'Initial MapLibre zoom level (0..22).' },
  { name: 'minZoom', type: 'number', label: 'Min zoom', min: 0, max: 22, step: 0.1, description: 'Minimum allowed MapLibre zoom.' },
  { name: 'maxZoom', type: 'number', label: 'Max zoom', min: 0, max: 22, step: 0.1, description: 'Maximum allowed MapLibre zoom.' },
];

const INPUT_FIELDS: FieldConfig[] = [
  {
    name: 'passInputToMap',
    type: 'boolean',
    label: 'Pass input to map',
    description: 'Pixi canvas is pointer-transparent so MapLibre receives pan / zoom / click. Default on.',
  },
];

/** The full MapLayer field set as one grouped `FieldConfig[]`. */
export const mapLayerFields: FieldConfig[] = [
  ...BASEMAP_FIELDS.map(withGroup('Basemap')),
  ...VIEW_FIELDS.map(withGroup('View')),
  ...INPUT_FIELDS.map(withGroup('Input')),
];
