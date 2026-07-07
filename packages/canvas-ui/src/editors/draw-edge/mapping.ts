import { hexToNumber, numberToHex } from '../../shared/color';

import type { DrawEdgeFields, DrawEdgeOptions } from './types';

/**
 * Map a `DrawEdgeBehaviourOptions`-shaped patch to the flat {@link DrawEdgeFields}
 * the `@invana/forms` generator renders. The nested `draftStyle` group is
 * flattened to `draft`-prefixed scalars; the `0xRRGGBB` number colour becomes a
 * `#rrggbb` hex string, and the `[dash, gap]` tuple splits into two numbers.
 */
export function optionsToForm(o: DrawEdgeOptions = {}): DrawEdgeFields {
  const d = o.draftStyle;
  return {
    allowSelfLoop: o.allowSelfLoop,
    draftColor: d?.color !== undefined ? numberToHex(d.color) : undefined,
    draftWidth: d?.width,
    draftAlpha: d?.alpha,
    draftDashLength: d?.dash?.[0],
    draftDashGap: d?.dash?.[1],
  };
}

/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link DrawEdgeOptions} patch. Only fields the form actually set are included,
 * so the result is safe to spread on `setOptions`. The `draftStyle` group is
 * reassembled only when at least one of its members was set; the hex colour is
 * re-encoded to a `0xRRGGBB` number and the dash pair re-fused into a tuple
 * (falling back to the engine defaults `[6, 4]` for a missing half).
 */
export function formToOptions(f: DrawEdgeFields): DrawEdgeOptions {
  const out: DrawEdgeOptions = {};
  if (f.allowSelfLoop !== undefined) out.allowSelfLoop = f.allowSelfLoop;

  const draftStyle: NonNullable<DrawEdgeOptions['draftStyle']> = {};
  if (f.draftColor !== undefined) draftStyle.color = hexToNumber(f.draftColor);
  if (f.draftWidth !== undefined) draftStyle.width = f.draftWidth;
  if (f.draftAlpha !== undefined) draftStyle.alpha = f.draftAlpha;
  if (f.draftDashLength !== undefined || f.draftDashGap !== undefined) {
    draftStyle.dash = [f.draftDashLength ?? 6, f.draftDashGap ?? 4];
  }
  if (Object.keys(draftStyle).length > 0) out.draftStyle = draftStyle;

  return out;
}
