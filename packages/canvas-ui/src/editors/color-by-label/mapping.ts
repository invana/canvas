import { hexToNumber, numberToHex } from '../../shared/color';

import type { ColorByLabelFields, ColorByLabelOptions } from './types';

/**
 * Map a `ColorByLabelBehaviourOptions`-shaped patch to the flat
 * {@link ColorByLabelFields} the `@invana/forms` generator renders. The
 * `0xRRGGBB` number `fallbackColor` becomes a `#rrggbb` hex string; the boolean
 * toggles pass straight through.
 */
export function optionsToForm(o: ColorByLabelOptions = {}): ColorByLabelFields {
  return {
    colorNodes: o.colorNodes,
    colorEdges: o.colorEdges,
    fallbackColor: o.fallbackColor !== undefined ? numberToHex(o.fallbackColor) : undefined,
  };
}

/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link ColorByLabelOptions} patch. Only fields the form actually set are
 * included, so the result is safe to spread on `setOptions`. The hex
 * `fallbackColor` is re-encoded to a `0xRRGGBB` number.
 */
export function formToOptions(f: ColorByLabelFields): ColorByLabelOptions {
  const out: ColorByLabelOptions = {};
  if (f.colorNodes !== undefined) out.colorNodes = f.colorNodes;
  if (f.colorEdges !== undefined) out.colorEdges = f.colorEdges;
  if (f.fallbackColor !== undefined) out.fallbackColor = hexToNumber(f.fallbackColor);
  return out;
}
