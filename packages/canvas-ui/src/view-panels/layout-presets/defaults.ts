// The four presets as the picker shows them, and the options each accepts.
// Display only: the engine half (which layout, which edge shape, which label
// placement each value means) lives with the preset registry in
// `@invana/graph`; the ids here are the same ids.

import type { LayoutPresetCard, LayoutPresetOption } from './types';

/** Network · Tree ↓ · Flow → · Radial. */
export const DEFAULT_LAYOUT_PRESET_CARDS: readonly LayoutPresetCard[] = [
  { id: 'network', label: 'Network', description: 'Who is near whom', picture: 'network' },
  { id: 'tree', label: 'Tree ↓', description: 'What sits under what', picture: 'tree' },
  { id: 'flow', label: 'Flow →', description: 'What leads to what', picture: 'flow' },
  { id: 'radial', label: 'Radial', description: 'One node and its rings', picture: 'radial' },
];

const DIRECTION: LayoutPresetOption = {
  key: 'direction',
  label: 'Direction',
  choices: [
    { value: 'down', label: '↓' },
    { value: 'right', label: '→' },
    { value: 'left', label: '←' },
    { value: 'up', label: '↑' },
  ],
};
const EDGES: LayoutPresetOption = {
  key: 'edges',
  label: 'Edges',
  choices: [
    { value: 'straight', label: 'Straight' },
    { value: 'curved', label: 'Curved' },
    { value: 'orthogonal', label: 'Orthogonal' },
  ],
};
const SPACING: LayoutPresetOption = {
  key: 'spacing',
  label: 'Spacing',
  choices: [
    { value: 'compact', label: 'Compact' },
    { value: 'comfortable', label: 'Comfortable' },
    { value: 'roomy', label: 'Roomy' },
  ],
};
const ROOT: LayoutPresetOption = {
  key: 'root',
  label: 'Root',
  choices: [
    { value: 'auto', label: 'Automatic' },
    { value: 'selection', label: 'Selection' },
  ],
};
const CENTRE: LayoutPresetOption = { ...ROOT, key: 'centre', label: 'Centre' };

/** The options each preset accepts, in row order. */
export const DEFAULT_LAYOUT_PRESET_OPTIONS: Readonly<Record<string, readonly LayoutPresetOption[]>> = {
  network: [EDGES, SPACING],
  tree: [DIRECTION, EDGES, SPACING, ROOT],
  flow: [DIRECTION, EDGES, SPACING, ROOT],
  radial: [EDGES, SPACING, CENTRE],
};

/** Each preset's defaults, by option key. */
export const DEFAULT_LAYOUT_PRESET_DEFAULTS: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  network: { edges: 'straight', spacing: 'comfortable' },
  tree: { direction: 'down', edges: 'orthogonal', spacing: 'comfortable', root: 'auto' },
  flow: { direction: 'right', edges: 'curved', spacing: 'comfortable', root: 'auto' },
  radial: { edges: 'curved', spacing: 'comfortable', centre: 'auto' },
};
