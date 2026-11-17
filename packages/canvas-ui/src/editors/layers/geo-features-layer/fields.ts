import type { FieldConfig } from '@invana/forms';

import { COLOR_PRESETS } from '../../../shared/colors';

const colour = (name: string, label: string, description: string): FieldConfig => ({
  name,
  type: 'color',
  label,
  presetColors: [...COLOR_PRESETS],
  description,
});
const px = (name: string, label: string, description: string, max = 30): FieldConfig => ({ name, type: 'number', label, min: 0, max, step: 0.5, description });
const unit = (name: string, label: string, description: string): FieldConfig => ({ name, type: 'number', label, min: 0, max: 1, step: 0.05, description });

/**
 * `@invana/forms` field schema for the GeoFeaturesLayer editor. Field `name`s match
 * the keys of `GeoFeaturesLayerFields` 1:1.
 */
export const geoFeaturesLayerFields: FieldConfig[] = [
  colour('polygonStroke', 'Area border', 'Border colour of areas whose properties do not set one.'),
  px('polygonStrokeWidthPx', 'Area border width (px)', 'Screen pixels, at every zoom.'),
  unit('polygonStrokeOpacity', 'Area border opacity', '0–1.'),
  colour('polygonFill', 'Area fill', 'Fill colour of areas.'),
  unit('polygonFillOpacity', 'Area fill opacity', '0–1. 0 draws no fill.'),
  colour('lineStroke', 'Route colour', 'Colour of lines.'),
  px('lineStrokeWidthPx', 'Route width (px)', 'Screen pixels, at every zoom.'),
  unit('lineStrokeOpacity', 'Route opacity', '0–1.'),
  colour('pointStroke', 'Point outline', 'Outline colour of points and circles.'),
  px('pointStrokeWidthPx', 'Point outline width (px)', 'Screen pixels.'),
  colour('pointFill', 'Point fill', 'Fill colour of points and circles.'),
  unit('pointFillOpacity', 'Point fill opacity', '0–1.'),
  px('pointRadiusPx', 'Point radius (px)', 'Radius of a point that has no radiusKm.', 60),
  { name: 'labelKey', type: 'text', label: 'Label property', description: 'The feature property a label reads. Default "name".' },
  px('labelFontPx', 'Label size (px)', 'Screen pixels, at every zoom. Default 12.', 48),
  colour('labelColor', 'Label colour', 'Text colour.'),
  { name: 'labelBackground', type: 'boolean', label: 'Label background', description: 'A white pill behind the text. Default on.' },
  { name: 'labelMinZoom', type: 'number', label: 'Labels from scale', min: 0, step: 1, description: 'Camera scale (2 ** map zoom) below which labels hide. Empty = always.' },
  { name: 'labelMaxZoom', type: 'number', label: 'Labels up to scale', min: 0, step: 1, description: 'Camera scale above which labels hide. Empty = never.' },
  unit('unconfirmedBelow', 'Unconfirmed below confidence', 'A feature with confidence under this draws dashed and faded. Default 0.5.'),
  unit('unconfirmedAlpha', 'Unconfirmed opacity', 'Multiplier on opacity for an unconfirmed feature. Default 0.6.'),
  unit('uncertaintyFillOpacity', 'Uncertainty ring opacity', 'Fill of the uncertaintyKm ring. Default 0.12.'),
  px('hitTolerancePx', 'Click tolerance (px)', 'A click within this of a line or point hits it. Default 6.', 30),
  { name: 'republishDebounceMs', type: 'number', label: 'Redraw debounce (ms)', min: 0, step: 10, description: 'Wait after a zoom or an edit before redrawing. Default 100.' },
];
