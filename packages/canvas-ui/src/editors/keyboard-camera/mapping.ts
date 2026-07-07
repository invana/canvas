import type { KeyboardCameraFields, KeyboardCameraOptions } from './types';

/**
 * Map a `KeyboardCameraInputBehaviourOptions`-shaped patch to the flat
 * {@link KeyboardCameraFields} the `@invana/forms` generator renders. A 1:1 copy
 * — `keymap` is intentionally dropped (not editable here).
 */
export function optionsToForm(o: KeyboardCameraOptions = {}): KeyboardCameraFields {
  return {
    panStep: o.panStep,
    zoomFactor: o.zoomFactor,
  };
}

/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link KeyboardCameraOptions} patch. Only fields the form actually set are
 * included (no `undefined` keys), so the result is safe to spread over the
 * behaviour's current options on `setOptions`.
 */
export function formToOptions(f: KeyboardCameraFields): KeyboardCameraOptions {
  const out: KeyboardCameraOptions = {};
  if (f.panStep !== undefined) out.panStep = f.panStep;
  if (f.zoomFactor !== undefined) out.zoomFactor = f.zoomFactor;
  return out;
}
