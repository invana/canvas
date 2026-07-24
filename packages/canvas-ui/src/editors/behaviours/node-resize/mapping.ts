import { hexToNumber, numberToHex } from '../../../shared/color';

import type { NodeResizeFields, NodeResizeOptions } from './types';

/**
 * Map a `NodeResizeBehaviourOptions`-shaped patch to the flat
 * {@link NodeResizeFields} the `@invana/forms` generator renders. Engine number
 * colours (`0xRRGGBB`) become `#rrggbb` swatch strings; the `dashArray` tuple is
 * split into `dashLength` / `dashGap` number fields.
 */
export function optionsToForm(o: NodeResizeOptions = {}): NodeResizeFields {
  return {
    handleRadius: o.handleRadius,
    handleFill: o.handleFill !== undefined ? numberToHex(o.handleFill) : undefined,
    frameColor: o.frameColor !== undefined ? numberToHex(o.frameColor) : undefined,
    dashLength: o.dashArray?.[0],
    dashGap: o.dashArray?.[1],
    framePadding: o.framePadding,
    minSize: o.minSize,
  };
}

/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link NodeResizeOptions} patch. Swatch strings become engine numbers; the two
 * dash fields are re-fused into the `dashArray` tuple (only when at least one is
 * set). Only fields the form actually set are included (no `undefined` keys), so
 * the result is safe to spread over the behaviour's current options on
 * `setOptions`.
 */
export function formToOptions(f: NodeResizeFields): NodeResizeOptions {
  const out: NodeResizeOptions = {};
  if (f.handleRadius !== undefined) out.handleRadius = f.handleRadius;
  if (f.handleFill !== undefined) out.handleFill = hexToNumber(f.handleFill);
  if (f.frameColor !== undefined) out.frameColor = hexToNumber(f.frameColor);
  if (f.dashLength !== undefined || f.dashGap !== undefined) {
    out.dashArray = [f.dashLength ?? 5, f.dashGap ?? 4];
  }
  if (f.framePadding !== undefined) out.framePadding = f.framePadding;
  if (f.minSize !== undefined) out.minSize = f.minSize;
  return out;
}
