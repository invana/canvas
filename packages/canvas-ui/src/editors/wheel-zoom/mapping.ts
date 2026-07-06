import type { WheelZoomFields, WheelZoomOptions } from './types';

/**
 * Map a `WheelZoomBehaviourOptions`-shaped patch to the flat
 * {@link WheelZoomFields} the `@invana/forms` generator renders. The engine's
 * `smooth: false | number` is split: `smooth` becomes a boolean toggle and the
 * frame count (when present) becomes `smoothFrames`.
 */
export function optionsToForm(o: WheelZoomOptions = {}): WheelZoomFields {
  return {
    requireCtrl: o.requireCtrl,
    percent: o.percent,
    smooth: o.smooth !== undefined ? o.smooth !== false : undefined,
    smoothFrames: typeof o.smooth === 'number' ? o.smooth : undefined,
  };
}

/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link WheelZoomOptions} patch. Only fields the form actually set are
 * included (no `undefined` keys), so the result is safe to spread over the
 * behaviour's current options on `setOptions`. `smooth` is re-fused from the
 * toggle + frame count (`false` when off, the frame count — default 8 — when on).
 */
export function formToOptions(f: WheelZoomFields): WheelZoomOptions {
  const out: WheelZoomOptions = {};
  if (f.requireCtrl !== undefined) out.requireCtrl = f.requireCtrl;
  if (f.percent !== undefined) out.percent = f.percent;
  if (f.smooth !== undefined) out.smooth = f.smooth ? (f.smoothFrames ?? 8) : false;
  return out;
}
