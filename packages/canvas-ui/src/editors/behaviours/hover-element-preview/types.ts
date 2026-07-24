/**
 * Types for the HoverElementPreviewBehaviour editor.
 *
 * Engine-agnostic: the editable option shape is mirrored **structurally** here
 * as {@link HoverElementPreviewOptions}, a plain serialisable patch the consumer
 * applies via `setOptions`. Only the scalar timing / placement / interactivity
 * knobs round-trip — the `card` / `cards` field-maps and the `onShow` / `onHide`
 * render callbacks are deliberately out of scope (they're authored elsewhere).
 */

/** Anchor-placement hint passed through to the consumer (mirrors the engine enum). */
export type PreviewPlacement =
  | 'auto'
  | 'top'
  | 'right'
  | 'bottom'
  | 'left'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

/**
 * The serialisable subset of `HoverElementPreviewBehaviourOptions` this editor
 * produces — the scalar dwell/grace timing, the placement hint, and the
 * interactive toggle. `targets`, `enable`, `card`, `cards`, `onShow`, `onHide`
 * and the base fields are out of scope.
 */
export interface HoverElementPreviewOptions {
  openDelay?: number;
  closeDelay?: number;
  placement?: PreviewPlacement;
  interactive?: boolean;
}

/**
 * Flat form-field shape the `@invana/forms` generator renders. Maps 1:1 to
 * {@link HoverElementPreviewOptions} — no nested groups or unions.
 */
export interface HoverElementPreviewFields {
  openDelay?: number;
  closeDelay?: number;
  placement?: PreviewPlacement;
  interactive?: boolean;
}

/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
export interface HoverElementPreviewFormState {
  options: HoverElementPreviewFields;
}
