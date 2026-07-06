import { numberToHex } from '../../shared/color';
import type { BackgroundLayerFields, BackgroundLayerOptions } from './types';

/**
 * Resolve a `BackgroundColor` seed value to the hex/CSS string the swatch
 * shows. `0xRRGGBB` numbers become `#rrggbb`; CSS strings pass through; a
 * `{ light, dark }` pair is out of scope for the scalar field and round-trips
 * as `undefined` so the editor leaves it untouched.
 */
function colorToField(v: unknown): string | undefined {
  if (typeof v === 'number') return numberToHex(v);
  if (typeof v === 'string') return v;
  return undefined;
}

/**
 * Map a `BackgroundLayerOptions`-shaped patch to the flat
 * {@link BackgroundLayerFields}. Colours are normalised to strings; everything
 * else passes through.
 */
export function optionsToForm(o: BackgroundLayerOptions = {}): BackgroundLayerFields {
  return {
    type: o.type,
    patternType: o.patternType,
    color: colorToField(o.color),
    backgroundColor: colorToField(o.backgroundColor),
    size: o.size,
    spacing: o.spacing,
    alpha: o.alpha,
    followCamera: o.followCamera,
    mode: o.mode,
    surfaceRole: o.surfaceRole,
    patternRole: o.patternRole,
  };
}

/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link BackgroundLayerOptions} patch. Only fields the form set are included
 * (no `undefined` / empty-string keys), so the result is safe to spread over
 * the layer's current options on `setOptions`. Colour strings pass straight
 * through — `BackgroundColor` accepts hex/CSS strings verbatim.
 */
export function formToOptions(f: BackgroundLayerFields): BackgroundLayerOptions {
  const out: BackgroundLayerOptions = {};
  if (f.type !== undefined) out.type = f.type;
  if (f.patternType !== undefined) out.patternType = f.patternType;
  if (f.color) out.color = f.color;
  if (f.backgroundColor) out.backgroundColor = f.backgroundColor;
  if (f.size !== undefined) out.size = f.size;
  if (f.spacing !== undefined) out.spacing = f.spacing;
  if (f.alpha !== undefined) out.alpha = f.alpha;
  if (f.followCamera !== undefined) out.followCamera = f.followCamera;
  if (f.mode !== undefined) out.mode = f.mode;
  if (f.surfaceRole) out.surfaceRole = f.surfaceRole;
  if (f.patternRole) out.patternRole = f.patternRole;
  return out;
}
