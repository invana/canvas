import type { FieldConfig } from '@invana/forms';

import { COLOR_PRESETS } from '../../../shared/colors';
import type { BubbleSetsLayerFields } from './types';

/**
 * `@invana/forms` field schema for the BubbleSetsLayer editor, grouped into
 * accordion sections. Field `name`s match {@link BubbleSetsLayerFields} 1:1.
 *
 * A function of the live values: the `chaikinIterations` input only appears
 * while `smoothness === 'chaikin'` (it's ignored for the other algorithms).
 */

const withGroup =
  (group: string) =>
  (f: FieldConfig): FieldConfig => ({ ...f, group });

const INFLUENCE_FIELDS: FieldConfig[] = [
  { name: 'nodeR0', type: 'number', label: 'Node radius (full)', min: 0, max: 200, step: 1, description: 'Node-influence inner radius — full influence, world units.' },
  { name: 'nodeR1', type: 'number', label: 'Node radius (falloff)', min: 0, max: 400, step: 1, description: 'Node-influence outer radius — zero influence, world units.' },
  { name: 'edgeR0', type: 'number', label: 'Edge radius (full)', min: 0, max: 200, step: 1, description: 'Edge-influence inner radius, world units.' },
  { name: 'edgeR1', type: 'number', label: 'Edge radius (falloff)', min: 0, max: 400, step: 1, description: 'Edge-influence outer radius, world units.' },
  { name: 'morphBuffer', type: 'number', label: 'Padding', min: 0, max: 100, step: 1, description: 'Padding around the energy grid before sampling, world units.' },
];

const styleFields = (values: BubbleSetsLayerFields): FieldConfig[] => [
  {
    name: 'smoothness',
    type: 'select',
    label: 'Smoothness',
    options: [
      { value: 'chaikin', label: 'Chaikin (organic)' },
      { value: 'bspline', label: 'B-spline (tight)' },
      { value: 'none', label: 'None (jagged)' },
    ],
    description: 'Contour smoothing algorithm.',
  },
  ...(values.smoothness === 'chaikin'
    ? [
        { name: 'chaikinIterations', type: 'number', label: 'Chaikin iterations', min: 1, max: 8, step: 1, description: 'Corner-cutting passes; each doubles the point count.' } as FieldConfig,
      ]
    : []),
  { name: 'styleFill', type: 'color', label: 'Fill color', presetColors: [...COLOR_PRESETS], description: 'Default set fill colour.' },
  { name: 'styleFillOpacity', type: 'number', label: 'Fill opacity', min: 0, max: 1, step: 0.01, description: 'Default set fill alpha 0..1.' },
  { name: 'styleStroke', type: 'color', label: 'Stroke color', presetColors: [...COLOR_PRESETS], description: 'Default set stroke colour.' },
  { name: 'styleStrokeOpacity', type: 'number', label: 'Stroke opacity', min: 0, max: 1, step: 0.01, description: 'Default set stroke alpha 0..1.' },
  { name: 'styleStrokeWidth', type: 'number', label: 'Stroke width', min: 0, max: 20, step: 0.5, description: 'Default set stroke width in world units.' },
];

const COMPUTE_FIELDS: FieldConfig[] = [
  { name: 'pixelGroup', type: 'number', label: 'Grid resolution', min: 1, max: 32, step: 1, description: 'Grid cell size in square world units. Smaller = sharper, costlier.' },
  { name: 'maxRoutingIterations', type: 'number', label: 'Routing iterations', min: 1, max: 1000, step: 1, description: 'Max routing iterations to wrap obstacles.' },
  { name: 'maxMarchingIterations', type: 'number', label: 'Marching iterations', min: 1, max: 200, step: 1, description: 'Max marching-squares refinement iterations.' },
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
 * The full BubbleSetsLayer field set as one grouped `FieldConfig[]` — the
 * default `fields` for `<BubbleSetsLayerEditorPanel>`. The `chaikinIterations` input
 * appears only for the Chaikin smoothing algorithm.
 */
export function bubbleSetsLayerFields(values: BubbleSetsLayerFields = {}): FieldConfig[] {
  return [
    ...INFLUENCE_FIELDS.map(withGroup('Influence')),
    ...styleFields(values).map(withGroup('Style')),
    ...COMPUTE_FIELDS.map(withGroup('Compute')),
    ...LIFECYCLE_FIELDS.map(withGroup('Lifecycle')),
  ];
}
