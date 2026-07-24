/**
 * Types for the WheelZoomBehaviour editor.
 *
 * Engine-agnostic by design: `@invana/canvas` (where `WheelZoomBehaviour` and
 * its options live) is **not** imported — canvas-ui may only use `@invana/graph`
 * types (see package CLAUDE.md). So the editable option shape is mirrored here
 * as {@link WheelZoomOptions}, a plain serialisable patch the consumer applies
 * via `setOptions`. The mirror is structural, not derived, so it can't `Pick`
 * from the engine — keep it in sync with `WheelZoomBehaviourOptions` by hand.
 */

/**
 * The subset of `WheelZoomBehaviourOptions` this editor produces — a
 * serialisable patch. Function/`shortcuts` options are out of scope; only the
 * user-tunable scalars round-trip. `smooth` keeps the engine's `false | number`
 * encoding (`false` = instant snap, a number = ease-out frame count).
 */
export interface WheelZoomOptions {
  requireCtrl?: boolean;
  percent?: number;
  smooth?: false | number;
}

/**
 * Flat form-field shape the `@invana/forms` generator renders. The engine's
 * `smooth: false | number` union is split into a `smooth` boolean toggle plus a
 * `smoothFrames` number (see `mapping.ts`), because a single field can't be both.
 */
export interface WheelZoomFields {
  requireCtrl?: boolean;
  percent?: number;
  /** Whether smooth-scroll easing is on. Maps to `smooth !== false`. */
  smooth?: boolean;
  /** Ease-out frame count, used only when {@link smooth} is `true`. */
  smoothFrames?: number;
}

/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
export interface WheelZoomFormState {
  options: WheelZoomFields;
}
