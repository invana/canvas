import { hexToNumber, numberToHex } from '../../shared/color';
import type {
  DensityContourStrokeLayerFields,
  DensityContourStrokeLayerOptions,
} from './types';

/**
 * Map a `DensityContourStrokeLayerOptions`-shaped patch to the flat
 * {@link DensityContourStrokeLayerFields}. The engine's `strokeColor: number |
 * 'palette'` is split: `strokePalette` becomes a boolean toggle and the
 * constant colour (when present) is normalised from `0xRRGGBB` to `#rrggbb`.
 * `thresholds` / `strokeWidth` keep only their scalar forms.
 */
export function optionsToForm(
  o: DensityContourStrokeLayerOptions = {},
): DensityContourStrokeLayerFields {
  return {
    bandwidth: o.bandwidth,
    thresholds: typeof o.thresholds === 'number' ? o.thresholds : undefined,
    cellSize: o.cellSize,
    padding: o.padding,
    palette: o.palette,
    paletteRangeStart: o.paletteRangeStart,
    paletteRangeEnd: o.paletteRangeEnd,
    strokePalette: o.strokeColor !== undefined ? o.strokeColor === 'palette' : undefined,
    strokeColor: typeof o.strokeColor === 'number' ? numberToHex(o.strokeColor) : undefined,
    strokeWidth: typeof o.strokeWidth === 'number' ? o.strokeWidth : undefined,
    indexEvery: o.indexEvery,
    indexMajorWidth: o.indexMajorWidth,
    indexMinorWidth: o.indexMinorWidth,
    recompute: o.recompute,
    recomputeDebounceMs: o.recomputeDebounceMs,
  };
}

/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link DensityContourStrokeLayerOptions} patch. Only fields the form set are
 * included (no `undefined` keys), so the result is safe to spread over the
 * layer's current options on `setOptions`. `strokeColor` is re-fused from the
 * `strokePalette` toggle (`'palette'` when on, the `#rrggbb → 0xRRGGBB` colour
 * when off).
 */
export function formToOptions(
  f: DensityContourStrokeLayerFields,
): DensityContourStrokeLayerOptions {
  const out: DensityContourStrokeLayerOptions = {};
  if (f.bandwidth !== undefined) out.bandwidth = f.bandwidth;
  if (f.thresholds !== undefined) out.thresholds = f.thresholds;
  if (f.cellSize !== undefined) out.cellSize = f.cellSize;
  if (f.padding !== undefined) out.padding = f.padding;
  if (f.palette !== undefined) out.palette = f.palette;
  if (f.paletteRangeStart !== undefined) out.paletteRangeStart = f.paletteRangeStart;
  if (f.paletteRangeEnd !== undefined) out.paletteRangeEnd = f.paletteRangeEnd;
  if (f.strokePalette !== undefined) {
    if (f.strokePalette) out.strokeColor = 'palette';
    else if (f.strokeColor) out.strokeColor = hexToNumber(f.strokeColor);
  } else if (f.strokeColor) {
    out.strokeColor = hexToNumber(f.strokeColor);
  }
  if (f.strokeWidth !== undefined) out.strokeWidth = f.strokeWidth;
  if (f.indexEvery !== undefined) out.indexEvery = f.indexEvery;
  if (f.indexMajorWidth !== undefined) out.indexMajorWidth = f.indexMajorWidth;
  if (f.indexMinorWidth !== undefined) out.indexMinorWidth = f.indexMinorWidth;
  if (f.recompute !== undefined) out.recompute = f.recompute;
  if (f.recomputeDebounceMs !== undefined) out.recomputeDebounceMs = f.recomputeDebounceMs;
  return out;
}
