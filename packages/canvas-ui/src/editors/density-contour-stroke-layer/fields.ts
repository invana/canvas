import type { FieldConfig } from '@invana/forms';

import { COLOR_PRESETS } from '../../shared/colors';
import type { DensityContourStrokeLayerFields } from './types';

/**
 * `@invana/forms` field schema for the DensityContourStrokeLayer editor,
 * grouped into accordion sections. Field `name`s match
 * {@link DensityContourStrokeLayerFields} 1:1.
 *
 * A function of the live values: the constant `strokeColor` swatch is elided
 * while `strokePalette` is on (the iso-lines are palette-coloured), the
 * form-generator's way of handling the engine's `strokeColor: number |
 * 'palette'` union.
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

const strokeFields = (values: DensityContourStrokeLayerFields): FieldConfig[] => [
  {
    name: 'strokePalette',
    type: 'boolean',
    label: 'Palette stroke',
    description: 'Colour each iso-line from the palette instead of a constant swatch.',
  },
  ...(values.strokePalette
    ? [
        { name: 'palette', type: 'select', label: 'Palette', options: PALETTE_OPTIONS, description: 'Named colour ramp for the iso-lines, low-density to high-density.' } as FieldConfig,
        { name: 'paletteRangeStart', type: 'number', label: 'Palette start', min: 0, max: 1, step: 0.01, description: 'Ramp start fraction 0..1. Applied only when both start + end are set.' } as FieldConfig,
        { name: 'paletteRangeEnd', type: 'number', label: 'Palette end', min: 0, max: 1, step: 0.01, description: 'Ramp end fraction 0..1. Applied only when both start + end are set.' } as FieldConfig,
      ]
    : [
        { name: 'strokeColor', type: 'color', label: 'Stroke color', presetColors: [...COLOR_PRESETS], description: 'Constant iso-line colour.' } as FieldConfig,
      ]),
  { name: 'strokeWidth', type: 'number', label: 'Stroke width', min: 0, max: 10, step: 0.25, description: 'Constant iso-line width in world units.' },
];

const INDEX_FIELDS: FieldConfig[] = [
  { name: 'indexEvery', type: 'number', label: 'Index every', min: 1, max: 20, step: 1, description: 'Every Nth band is stroked as a heavy "index" contour.' },
  { name: 'indexMajorWidth', type: 'number', label: 'Major width', min: 0, max: 10, step: 0.25, description: 'Width of the index (major) contours.' },
  { name: 'indexMinorWidth', type: 'number', label: 'Minor width', min: 0, max: 10, step: 0.25, description: 'Width of the in-between (minor) contours.' },
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

/**
 * The full DensityContourStrokeLayer field set as one grouped `FieldConfig[]` —
 * the default `fields` for `<DensityContourStrokeLayerEditor>`. The palette /
 * swatch inputs swap on the `strokePalette` toggle.
 */
export function densityContourStrokeLayerFields(
  values: DensityContourStrokeLayerFields = {},
): FieldConfig[] {
  return [
    ...DENSITY_FIELDS.map(withGroup('Density')),
    ...strokeFields(values).map(withGroup('Stroke')),
    ...INDEX_FIELDS.map(withGroup('Index contours')),
    ...LIFECYCLE_FIELDS.map(withGroup('Lifecycle')),
  ];
}
