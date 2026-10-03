import { hexToNumber, numberToHex } from '../../../shared/color';
import type { FisheyeFields, FisheyeOptions, FisheyeWheelModifier, FisheyeWheelModifierField } from './types';

/** `null` ⇄ `'none'` for the wheel-modifier selects. */
function modifierToField(m: FisheyeWheelModifier | null | undefined): FisheyeWheelModifierField | undefined {
  if (m === undefined) return undefined;
  return m ?? 'none';
}

function modifierToOption(m: FisheyeWheelModifierField): FisheyeWheelModifier | null {
  return m === 'none' ? null : m;
}

/**
 * Map a `FisheyeBehaviourOptions`-shaped patch to the flat {@link FisheyeFields}
 * the `@invana/forms` generator renders: modifiers `null` → `'none'`,
 * `maxRadius: null` (auto) → `0`, colours → hex strings.
 */
export function optionsToForm(o: FisheyeOptions = {}): FisheyeFields {
  return {
    trigger: o.trigger,
    radius: o.radius,
    minRadius: o.minRadius,
    maxRadius: o.maxRadius === undefined ? undefined : (o.maxRadius ?? 0),
    distortion: o.distortion,
    minDistortion: o.minDistortion,
    maxDistortion: o.maxDistortion,
    nodeScale: o.nodeScale,
    showLabels: o.showLabels,
    radiusWheelModifier: modifierToField(o.radiusWheelModifier),
    distortionWheelModifier: modifierToField(o.distortionWheelModifier),
    lensStrokeColor: o.lensStrokeColor === undefined ? undefined : numberToHex(o.lensStrokeColor),
    lensStrokeWidth: o.lensStrokeWidth,
    lensFillColor: o.lensFillColor === undefined ? undefined : numberToHex(o.lensFillColor),
    lensFillAlpha: o.lensFillAlpha,
  };
}

/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link FisheyeOptions} patch. Only fields the form set are included (no
 * `undefined` keys), so the result is safe to spread over the behaviour's
 * current options on `setOptions`.
 */
export function formToOptions(f: FisheyeFields): FisheyeOptions {
  const out: FisheyeOptions = {};
  if (f.trigger !== undefined) out.trigger = f.trigger;
  if (f.radius !== undefined) out.radius = f.radius;
  if (f.minRadius !== undefined) out.minRadius = f.minRadius;
  if (f.maxRadius !== undefined) out.maxRadius = f.maxRadius > 0 ? f.maxRadius : null;
  if (f.distortion !== undefined) out.distortion = f.distortion;
  if (f.minDistortion !== undefined) out.minDistortion = f.minDistortion;
  if (f.maxDistortion !== undefined) out.maxDistortion = f.maxDistortion;
  if (f.nodeScale !== undefined) out.nodeScale = f.nodeScale;
  if (f.showLabels !== undefined) out.showLabels = f.showLabels;
  if (f.radiusWheelModifier !== undefined) out.radiusWheelModifier = modifierToOption(f.radiusWheelModifier);
  if (f.distortionWheelModifier !== undefined) {
    out.distortionWheelModifier = modifierToOption(f.distortionWheelModifier);
  }
  if (f.lensStrokeColor) out.lensStrokeColor = hexToNumber(f.lensStrokeColor);
  if (f.lensStrokeWidth !== undefined) out.lensStrokeWidth = f.lensStrokeWidth;
  if (f.lensFillColor) out.lensFillColor = hexToNumber(f.lensFillColor);
  if (f.lensFillAlpha !== undefined) out.lensFillAlpha = f.lensFillAlpha;
  return out;
}
