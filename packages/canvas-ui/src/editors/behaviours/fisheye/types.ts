/**
 * Types for the FisheyeBehaviour editor.
 *
 * Engine-agnostic by design: `@invana/graph` (where `FisheyeBehaviour` and its
 * options live) is **not** imported for its runtime — canvas-ui mirrors the
 * editable option shape here as {@link FisheyeOptions}, a plain serialisable
 * patch the consumer applies via `setOptions`. The mirror is structural, not
 * derived, so keep it in sync with `FisheyeBehaviourOptions` by hand.
 */

/** How the lens moves. */
export type FisheyeTrigger = 'pointermove' | 'click' | 'drag';

/** Keyboard modifier that turns the wheel into a lens adjustment. */
export type FisheyeWheelModifier = 'alt' | 'shift' | 'ctrl' | 'meta';

/**
 * The subset of `FisheyeBehaviourOptions` this editor produces — a serialisable
 * patch. The base `id` / `targetLayerId` / `enabled` / `shortcuts` fields are
 * out of scope.
 */
export interface FisheyeOptions {
  trigger?: FisheyeTrigger;
  /** Lens radius in screen pixels. Default `120`. */
  radius?: number;
  minRadius?: number;
  /** `null` = half the canvas's shorter side. */
  maxRadius?: number | null;
  /** Distortion factor; `0` = none. Default `1.5`. */
  distortion?: number;
  minDistortion?: number;
  maxDistortion?: number;
  /** Size multiplier at the lens centre. Default `1.5`. */
  nodeScale?: number;
  /** Force labels visible inside the lens. Default `true`. */
  showLabels?: boolean;
  /** `null` disables wheel-adjusting the radius. Default `'alt'`. */
  radiusWheelModifier?: FisheyeWheelModifier | null;
  /** `null` disables wheel-adjusting the distortion. Default `'shift'`. */
  distortionWheelModifier?: FisheyeWheelModifier | null;
  lensStrokeColor?: number;
  lensStrokeWidth?: number;
  lensFillColor?: number;
  lensFillAlpha?: number;
}

/** A wheel modifier as the form shows it — `'none'` stands for `null`. */
export type FisheyeWheelModifierField = FisheyeWheelModifier | 'none';

/**
 * Flat form-field shape the `@invana/forms` generator renders. Differs from
 * {@link FisheyeOptions} where a form can't hold the value directly: modifiers
 * use `'none'` for `null`, `maxRadius` uses `0` for `null` (auto), and colours
 * are hex strings.
 */
export interface FisheyeFields {
  trigger?: FisheyeTrigger;
  radius?: number;
  minRadius?: number;
  maxRadius?: number;
  distortion?: number;
  minDistortion?: number;
  maxDistortion?: number;
  nodeScale?: number;
  showLabels?: boolean;
  radiusWheelModifier?: FisheyeWheelModifierField;
  distortionWheelModifier?: FisheyeWheelModifierField;
  lensStrokeColor?: string;
  lensStrokeWidth?: number;
  lensFillColor?: string;
  lensFillAlpha?: number;
}

/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
export interface FisheyeFormState {
  options: FisheyeFields;
}
