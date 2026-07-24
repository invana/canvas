import type {
  DensityContourFillLayerFields,
  DensityContourFillLayerOptions,
} from './types';

/**
 * Map a `DensityContourFillLayerOptions`-shaped patch to the flat
 * {@link DensityContourFillLayerFields}. All fields are scalars (no colour
 * numbers, no nested groups), so this is a direct pass-through — `thresholds`
 * keeps only its scalar band-count form (an explicit iso-value array is out of
 * scope and round-trips as `undefined`).
 */
export function optionsToForm(
  o: DensityContourFillLayerOptions = {},
): DensityContourFillLayerFields {
  return {
    bandwidth: o.bandwidth,
    thresholds: typeof o.thresholds === 'number' ? o.thresholds : undefined,
    cellSize: o.cellSize,
    padding: o.padding,
    palette: o.palette,
    paletteRangeStart: o.paletteRangeStart,
    paletteRangeEnd: o.paletteRangeEnd,
    fillOpacity: o.fillOpacity,
    recompute: o.recompute,
    recomputeDebounceMs: o.recomputeDebounceMs,
  };
}

/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link DensityContourFillLayerOptions} patch. Only fields the form set are
 * included (no `undefined` keys), so the result is safe to spread over the
 * layer's current options on `setOptions`.
 */
export function formToOptions(
  f: DensityContourFillLayerFields,
): DensityContourFillLayerOptions {
  const out: DensityContourFillLayerOptions = {};
  if (f.bandwidth !== undefined) out.bandwidth = f.bandwidth;
  if (f.thresholds !== undefined) out.thresholds = f.thresholds;
  if (f.cellSize !== undefined) out.cellSize = f.cellSize;
  if (f.padding !== undefined) out.padding = f.padding;
  if (f.palette !== undefined) out.palette = f.palette;
  if (f.paletteRangeStart !== undefined) out.paletteRangeStart = f.paletteRangeStart;
  if (f.paletteRangeEnd !== undefined) out.paletteRangeEnd = f.paletteRangeEnd;
  if (f.fillOpacity !== undefined) out.fillOpacity = f.fillOpacity;
  if (f.recompute !== undefined) out.recompute = f.recompute;
  if (f.recomputeDebounceMs !== undefined) out.recomputeDebounceMs = f.recomputeDebounceMs;
  return out;
}
