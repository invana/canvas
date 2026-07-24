import { hexToNumber, numberToHex } from '../../../shared/color';
import type { MiniMapLayerFields, MiniMapLayerOptions } from './types';

/**
 * Resolve a `MiniMapColor` seed value to the hex string the swatch shows.
 * `0xRRGGBB` numbers become `#rrggbb`; a `{ light, dark }` pair is out of scope
 * for the scalar field and round-trips as `undefined` so the editor leaves it
 * untouched.
 */
function colorToField(v: unknown): string | undefined {
  if (typeof v === 'number') return numberToHex(v);
  return undefined;
}

/**
 * Resolve a `margin` seed to the scalar the number field shows. A `{ x, y }`
 * pair is out of scope for the scalar field and round-trips as `undefined`.
 */
function marginToField(v: unknown): number | undefined {
  return typeof v === 'number' ? v : undefined;
}

/**
 * Map a `MiniMapLayerOptions`-shaped patch to the flat {@link MiniMapLayerFields}
 * the `@invana/forms` generator renders. Colours are normalised to hex strings;
 * `margin` to a scalar number; everything else passes through.
 */
export function optionsToForm(o: MiniMapLayerOptions = {}): MiniMapLayerFields {
  return {
    width: o.width,
    height: o.height,
    backgroundColor: colorToField(o.backgroundColor),
    borderColor: colorToField(o.borderColor),
    borderWidth: o.borderWidth,
    viewportFill: colorToField(o.viewportFill),
    viewportStroke: colorToField(o.viewportStroke),
    viewportFillAlpha: o.viewportFillAlpha,
    viewportStrokeWidth: o.viewportStrokeWidth,
    // Mask is on by default (matches the engine's `MiniMapLayer` default), so an
    // unseeded editor shows it enabled rather than unchecked.
    maskEnabled: o.maskEnabled ?? true,
    maskColor: colorToField(o.maskColor),
    maskAlpha: o.maskAlpha,
    padding: o.padding,
    enableDrag: o.enableDrag,
    position: o.position,
    mode: o.mode,
    margin: marginToField(o.margin),
  };
}

/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link MiniMapLayerOptions} patch. Only fields the form actually set are
 * included (no `undefined` / empty-string keys), so the result is safe to spread
 * over the layer's current options on `setOptions`. Colour hex strings are
 * converted back to the engine's `0xRRGGBB` numbers.
 */
export function formToOptions(f: MiniMapLayerFields): MiniMapLayerOptions {
  const out: MiniMapLayerOptions = {};
  if (f.width !== undefined) out.width = f.width;
  if (f.height !== undefined) out.height = f.height;
  if (f.backgroundColor) out.backgroundColor = hexToNumber(f.backgroundColor);
  if (f.borderColor) out.borderColor = hexToNumber(f.borderColor);
  if (f.borderWidth !== undefined) out.borderWidth = f.borderWidth;
  if (f.viewportFill) out.viewportFill = hexToNumber(f.viewportFill);
  if (f.viewportStroke) out.viewportStroke = hexToNumber(f.viewportStroke);
  if (f.viewportFillAlpha !== undefined) out.viewportFillAlpha = f.viewportFillAlpha;
  if (f.viewportStrokeWidth !== undefined) out.viewportStrokeWidth = f.viewportStrokeWidth;
  if (f.maskEnabled !== undefined) out.maskEnabled = f.maskEnabled;
  if (f.maskColor) out.maskColor = hexToNumber(f.maskColor);
  if (f.maskAlpha !== undefined) out.maskAlpha = f.maskAlpha;
  if (f.padding !== undefined) out.padding = f.padding;
  if (f.enableDrag !== undefined) out.enableDrag = f.enableDrag;
  if (f.position !== undefined) out.position = f.position;
  if (f.mode !== undefined) out.mode = f.mode;
  if (f.margin !== undefined) out.margin = f.margin;
  return out;
}
