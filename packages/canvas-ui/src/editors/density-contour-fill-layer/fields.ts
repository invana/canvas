import type { FieldConfig } from '@invana/forms';

/**
 * `@invana/forms` field schema for the DensityContourFillLayer editor, grouped
 * into accordion sections. Field `name`s match
 * `DensityContourFillLayerFields` 1:1 so the generator's `options.<name>`
 * paths line up with `mapping.ts`.
 *
 * Static — none of the fields depend on live values, so this is a plain const
 * (the editor passes it straight through).
 */

const PALETTE_OPTIONS = [
  { value: 'blues', label: 'Blues' },
  { value: 'greens', label: 'Greens' },
  { value: 'oranges', label: 'Oranges' },
  { value: 'purples', label: 'Purples' },
  { value: 'reds', label: 'Reds' },
  { value: 'viridis', label: 'Viridis' },
  { value: 'plasma', label: 'Plasma' },
  { value: 'magma', label: 'Magma' },
  { value: 'inferno', label: 'Inferno' },
  { value: 'warm', label: 'Warm' },
  { value: 'cool', label: 'Cool' },
];

const withGroup =
  (group: string) =>
  (f: FieldConfig): FieldConfig => ({ ...f, group });

const DENSITY_FIELDS: FieldConfig[] = [
  { name: 'bandwidth', type: 'number', label: 'Bandwidth', min: 1, max: 200, step: 1, description: 'Kernel bandwidth in world units. Larger = smoother, broader blobs.' },
  { name: 'thresholds', type: 'number', label: 'Bands', min: 1, max: 60, step: 1, description: 'Number of iso-bands d3-contour computes.' },
  { name: 'cellSize', type: 'number', label: 'Cell size', min: 1, max: 16, step: 1, description: 'Grid cell size in world units. Must be a power of two (1, 2, 4, 8, 16).' },
  { name: 'padding', type: 'number', label: 'Padding', min: 0, max: 200, step: 1, description: 'Padding around the node bounding box before building the grid.' },
];

const COLOR_FIELDS: FieldConfig[] = [
  { name: 'palette', type: 'select', label: 'Palette', options: PALETTE_OPTIONS, description: 'Named colour ramp for the bands, low-density to high-density.' },
  { name: 'paletteRangeStart', type: 'number', label: 'Palette start', min: 0, max: 1, step: 0.01, description: 'Ramp start fraction 0..1. Applied only when both start + end are set.' },
  { name: 'paletteRangeEnd', type: 'number', label: 'Palette end', min: 0, max: 1, step: 0.01, description: 'Ramp end fraction 0..1. Applied only when both start + end are set.' },
  { name: 'fillOpacity', type: 'number', label: 'Fill opacity', min: 0, max: 1, step: 0.01, description: 'Band fill alpha 0..1. Default 0.4.' },
];

const LIFECYCLE_FIELDS: FieldConfig[] = [
  {
    name: 'recompute',
    type: 'select',
    label: 'Recompute',
    options: [
      { value: 'auto', label: 'Auto (debounced)' },
      { value: 'manual', label: 'Manual' },
    ],
    description: 'How the overlay recomputes: on source changes (auto) or only on demand (manual).',
  },
  { name: 'recomputeDebounceMs', type: 'number', label: 'Debounce (ms)', min: 0, max: 2000, step: 10, description: 'Debounce window for auto recomputes.' },
];

/** The full DensityContourFillLayer field set as one grouped `FieldConfig[]`. */
export const densityContourFillLayerFields: FieldConfig[] = [
  ...DENSITY_FIELDS.map(withGroup('Density')),
  ...COLOR_FIELDS.map(withGroup('Colour')),
  ...LIFECYCLE_FIELDS.map(withGroup('Lifecycle')),
];
