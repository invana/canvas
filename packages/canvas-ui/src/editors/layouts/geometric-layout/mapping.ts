import type { GeometricLayoutFields, GeometricLayoutOptions } from './types';

/**
 * Map a `GeometricLayoutOptions`-shaped patch to the flat
 * {@link GeometricLayoutFields}. The `center: { x, y }` object is split into
 * `centerX` / `centerY`; everything else passes through.
 */
export function optionsToForm(o: GeometricLayoutOptions = {}): GeometricLayoutFields {
  return {
    mode: o.mode,
    columns: o.columns,
    columnGap: o.columnGap,
    rowGap: o.rowGap,
    radius: o.radius,
    nodeSpacing: o.nodeSpacing,
    startAngle: o.startAngle,
    clockwise: o.clockwise,
    centerX: o.center?.x,
    centerY: o.center?.y,
    includeGroups: o.includeGroups,
    transition: o.transition,
    transitionEase: o.transitionEase,
  };
}

/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link GeometricLayoutOptions} patch. Only fields the form set are included
 * (no `undefined` keys), so the result is safe to spread over the layout's
 * current options. `centerX` / `centerY` are re-fused into a `center` object
 * only if at least one was set.
 */
export function formToOptions(f: GeometricLayoutFields): GeometricLayoutOptions {
  const out: GeometricLayoutOptions = {};
  if (f.mode !== undefined) out.mode = f.mode;
  if (f.columns !== undefined) out.columns = f.columns;
  if (f.columnGap !== undefined) out.columnGap = f.columnGap;
  if (f.rowGap !== undefined) out.rowGap = f.rowGap;
  if (f.radius !== undefined) out.radius = f.radius;
  if (f.nodeSpacing !== undefined) out.nodeSpacing = f.nodeSpacing;
  if (f.startAngle !== undefined) out.startAngle = f.startAngle;
  if (f.clockwise !== undefined) out.clockwise = f.clockwise;
  if (f.includeGroups !== undefined) out.includeGroups = f.includeGroups;
  if (f.transition !== undefined) out.transition = f.transition;
  if (f.transitionEase) out.transitionEase = f.transitionEase;
  if (f.centerX !== undefined || f.centerY !== undefined) {
    out.center = {
      ...(f.centerX !== undefined ? { x: f.centerX } : {}),
      ...(f.centerY !== undefined ? { y: f.centerY } : {}),
    };
  }
  return out;
}
