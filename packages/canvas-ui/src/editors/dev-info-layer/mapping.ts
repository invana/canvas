import type { DevInfoLayerFields, DevInfoLayerOptions } from './types';

/**
 * Map a `DevInfoLayerOptions`-shaped patch to the flat {@link DevInfoLayerFields}
 * the `@invana/forms` generator renders. The engine's `margin: number | { x, y }`
 * union is split into `marginX` / `marginY`. Colours are CSS strings on the
 * engine (`textColor` / `accentColor` are `#rrggbb`, `backgroundColor` may be
 * `rgba(...)`), so they pass through unchanged — no number conversion.
 */
export function optionsToForm(o: DevInfoLayerOptions = {}): DevInfoLayerFields {
  const marginX =
    typeof o.margin === 'number' ? o.margin : o.margin?.x;
  const marginY =
    typeof o.margin === 'number' ? o.margin : o.margin?.y;
  return {
    corner: o.corner,
    marginX,
    marginY,
    fontSize: o.fontSize,
    opacity: o.opacity,
    backgroundColor: o.backgroundColor,
    textColor: o.textColor,
    accentColor: o.accentColor,
  };
}

/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link DevInfoLayerOptions} patch. Only fields the form actually set are
 * included (no `undefined` keys). `margin` is re-fused from `marginX` / `marginY`
 * — a plain number when both are equal, otherwise a `{ x, y }` object; omitted
 * entirely when neither is set.
 */
export function formToOptions(f: DevInfoLayerFields): DevInfoLayerOptions {
  const out: DevInfoLayerOptions = {};
  if (f.corner !== undefined) out.corner = f.corner;
  if (f.marginX !== undefined || f.marginY !== undefined) {
    out.margin =
      f.marginX === f.marginY && f.marginX !== undefined
        ? f.marginX
        : { x: f.marginX, y: f.marginY };
  }
  if (f.fontSize !== undefined) out.fontSize = f.fontSize;
  if (f.opacity !== undefined) out.opacity = f.opacity;
  if (f.backgroundColor !== undefined) out.backgroundColor = f.backgroundColor;
  if (f.textColor !== undefined) out.textColor = f.textColor;
  if (f.accentColor !== undefined) out.accentColor = f.accentColor;
  return out;
}
