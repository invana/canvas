import type { FieldConfig } from '@invana/forms';

import { COLOR_PRESETS } from '../../../shared/colors';

/**
 * `@invana/forms` field schema for the GraphLegendLayer editor, grouped into accordion
 * sections. Field `name`s match `GraphLegendLayerFields` 1:1 so the generator's
 * `options.<name>` paths line up with `mapping.ts`. The engine's `margin` union
 * is surfaced as the `marginX` / `marginY` pair.
 */

const CONTENT_FIELDS: FieldConfig[] = [
  { name: 'title', type: 'text', label: 'Title', description: "Panel heading. Leave empty for none. Default 'Legend'." },
  { name: 'showNodes', type: 'boolean', label: 'Show node types', description: 'Include the node-type section.' },
  { name: 'showEdges', type: 'boolean', label: 'Show edge types', description: 'Include the edge-type section.' },
  { name: 'nodesTitle', type: 'text', label: 'Node section title', description: "Heading above the node rows. Empty hides it. Default 'Nodes'." },
  { name: 'edgesTitle', type: 'text', label: 'Edge section title', description: "Heading above the edge rows. Empty hides it. Default 'Edges'." },
  {
    name: 'sort',
    type: 'select',
    label: 'Sort rows by',
    description: 'Row ordering within each section.',
    options: [
      { value: 'count-desc', label: 'Count (most first)' },
      { value: 'name-asc', label: 'Name (A–Z)' },
      { value: 'insertion', label: 'First appearance' },
    ],
  },
  { name: 'maxRows', type: 'number', label: 'Max rows per section', min: 0, step: 1, description: 'Extra rows collapse into "+N more". 0 = no cap. Default 12.' },
  { name: 'hideEmpty', type: 'boolean', label: 'Hide empty types', description: 'Drop rows whose visible count is 0 (fully filtered out). Default off.' },
];

const COUNT_FIELDS: FieldConfig[] = [
  { name: 'showCounts', type: 'boolean', label: 'Show counts', description: 'Show how many of each type are in the canvas.' },
  {
    name: 'countMode',
    type: 'select',
    label: 'Count mode',
    description: 'Which number(s) each row shows.',
    options: [
      { value: 'both', label: 'Visible / total' },
      { value: 'visible', label: 'Visible only' },
      { value: 'total', label: 'Total only' },
    ],
  },
];

const INTERACTION_FIELDS: FieldConfig[] = [
  { name: 'toggleOnClick', type: 'boolean', label: 'Toggle type on click', description: 'Clicking a row hides/shows every element of that type; a toggled-off row renders struck through and muted. Default off.' },
  { name: 'hiddenTypeOpacity', type: 'number', label: 'Toggled-off opacity', min: 0.1, max: 1, step: 0.05, description: 'Row opacity when its type is toggled off. Default 0.45.' },
];

const LAYOUT_FIELDS: FieldConfig[] = [
  {
    name: 'position',
    type: 'select',
    label: 'Position',
    description: 'Anchor corner inside the viewport.',
    options: [
      { value: 'top-left', label: 'Top-left' },
      { value: 'top-right', label: 'Top-right' },
      { value: 'bottom-left', label: 'Bottom-left' },
      { value: 'bottom-right', label: 'Bottom-right' },
    ],
  },
  { name: 'marginX', type: 'number', label: 'Margin X', min: 0, step: 1, description: 'Horizontal inset from the corner, in px. Default 10.' },
  { name: 'marginY', type: 'number', label: 'Margin Y', min: 0, step: 1, description: 'Vertical inset from the corner, in px. Default 10.' },
];

const CHROME_FIELDS: FieldConfig[] = [
  { name: 'fontSize', type: 'number', label: 'Font size', min: 6, max: 32, step: 1, description: 'Row text size in px. Default 11.' },
  { name: 'swatchSize', type: 'number', label: 'Swatch size', min: 4, max: 32, step: 1, description: 'Node swatch diameter in px; the edge line derives its length from it. Default 10.' },
  { name: 'opacity', type: 'number', label: 'Opacity', min: 0, max: 1, step: 0.01, description: 'Panel opacity 0–1. Default 0.95.' },
  { name: 'borderRadius', type: 'number', label: 'Corner radius', min: 0, step: 1, description: 'Panel corner radius in px. Default 6.' },
  { name: 'backgroundColor', type: 'text', label: 'Background colour', description: 'Panel background CSS colour. Accepts rgba().' },
  { name: 'textColor', type: 'color', label: 'Text colour', presetColors: [...COLOR_PRESETS], description: 'Row text colour.' },
  { name: 'mutedColor', type: 'color', label: 'Muted colour', presetColors: [...COLOR_PRESETS], description: 'Section headings and counts.' },
  { name: 'borderColor', type: 'text', label: 'Border colour', description: 'Panel border CSS colour. Accepts rgba().' },
  { name: 'fallbackColor', type: 'color', label: 'Fallback swatch', presetColors: [...COLOR_PRESETS], description: 'Swatch colour for a type whose style resolves no colour. Default #9ca3af.' },
  {
    name: 'mode',
    type: 'select',
    label: 'Theme mode',
    description: 'How light/dark colour variants resolve.',
    options: [
      { value: 'auto', label: 'Auto (follow theme)' },
      { value: 'light', label: 'Light' },
      { value: 'dark', label: 'Dark' },
    ],
  },
];

const withGroup =
  (group: string) =>
  (f: FieldConfig): FieldConfig => ({ ...f, group });

/**
 * The full GraphLegendLayer field set as one grouped `FieldConfig[]` — the default
 * `fields` for `<GraphLegendLayerEditorPanel>`. Static — no field depends on
 * another's value.
 */
export const graphLegendLayerFields: FieldConfig[] = [
  ...CONTENT_FIELDS.map(withGroup('Content')),
  ...COUNT_FIELDS.map(withGroup('Counts')),
  ...INTERACTION_FIELDS.map(withGroup('Interaction')),
  ...LAYOUT_FIELDS.map(withGroup('Layout')),
  ...CHROME_FIELDS.map(withGroup('Chrome')),
];
