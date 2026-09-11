import { numberToHex } from '../../../shared/color';
import type { BackgroundColorSource, BackgroundLayerFields, BackgroundLayerOptions } from './types';

/** The engine's inherit sentinel, mirrored here (canvas-ui imports no engine). */
const INHERIT = 'inherit';

/**
 * Resolve a `BackgroundColor` seed value to the hex/CSS string the swatch
 * shows. `0xRRGGBB` numbers become `#rrggbb`; CSS strings pass through; a
 * `{ light, dark }` pair is out of scope for the scalar field and round-trips
 * as `undefined` so the editor leaves it untouched.
 *
 * `'inherit'` also yields `undefined` — it is not a colour, and it is carried
 * by the companion `*Source` field instead (see {@link colorToSource}).
 */
function colorToField(v: unknown): string | undefined {
  if (v === INHERIT) return undefined;
  if (typeof v === 'number') return numberToHex(v);
  if (typeof v === 'string') return v;
  return undefined;
}

/**
 * Which `Source` the form shows for a colour seed. `'inherit'` — and an absent
 * value, since `'inherit'` is the layer's default — is `'theme'`; a concrete
 * colour is `'custom'`.
 */
function colorToSource(v: unknown): BackgroundColorSource {
  return v === undefined || v === INHERIT ? 'theme' : 'custom';
}

/**
 * Fold a `Source` + swatch pair back into one engine value. `'theme'` emits the
 * `'inherit'` sentinel (which the layer resolves against its palette role on
 * every paint); `'custom'` emits the picked colour. An unset `'custom'` swatch
 * emits nothing, so a half-filled form can't blank the layer's colour.
 */
function sourceToColor(
  source: BackgroundColorSource | undefined,
  color: string | undefined,
): string | undefined {
  if (source === 'theme') return INHERIT;
  if (source === 'custom') return color || undefined;
  return color || undefined;
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
    colorSource: colorToSource(o.color),
    backgroundColor: colorToField(o.backgroundColor),
    backgroundColorSource: colorToSource(o.backgroundColor),
    size: o.size,
    spacing: o.spacing,
    alpha: o.alpha,
    followCamera: o.followCamera,
    hidePatternBelowZoom: o.hidePatternBelowZoom,
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
 * through — `BackgroundColor` accepts hex/CSS strings verbatim — and each
 * `*Source` select collapses back into its colour as `'inherit'` or a pin.
 */
export function formToOptions(f: BackgroundLayerFields): BackgroundLayerOptions {
  const out: BackgroundLayerOptions = {};
  if (f.type !== undefined) out.type = f.type;
  if (f.patternType !== undefined) out.patternType = f.patternType;
  const color = sourceToColor(f.colorSource, f.color);
  if (color) out.color = color;
  const backgroundColor = sourceToColor(f.backgroundColorSource, f.backgroundColor);
  if (backgroundColor) out.backgroundColor = backgroundColor;
  if (f.size !== undefined) out.size = f.size;
  if (f.spacing !== undefined) out.spacing = f.spacing;
  if (f.alpha !== undefined) out.alpha = f.alpha;
  if (f.followCamera !== undefined) out.followCamera = f.followCamera;
  if (f.hidePatternBelowZoom !== undefined) out.hidePatternBelowZoom = f.hidePatternBelowZoom;
  if (f.mode !== undefined) out.mode = f.mode;
  if (f.surfaceRole) out.surfaceRole = f.surfaceRole;
  if (f.patternRole) out.patternRole = f.patternRole;
  return out;
}
