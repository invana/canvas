import type { HoverElementPreviewFields, HoverElementPreviewOptions } from './types';

/**
 * Map a `HoverElementPreviewBehaviourOptions`-shaped patch to the flat
 * {@link HoverElementPreviewFields} the `@invana/forms` generator renders. No
 * colours, nested groups, or unions — a straight passthrough of the scalar
 * timing / placement / interactivity knobs.
 */
export function optionsToForm(o: HoverElementPreviewOptions = {}): HoverElementPreviewFields {
  return {
    openDelay: o.openDelay,
    closeDelay: o.closeDelay,
    placement: o.placement,
    interactive: o.interactive,
  };
}

/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link HoverElementPreviewOptions} patch. Only fields the form actually set are
 * included (no `undefined` keys), so the result is safe to spread over the
 * behaviour's current options on `setOptions`.
 */
export function formToOptions(f: HoverElementPreviewFields): HoverElementPreviewOptions {
  const out: HoverElementPreviewOptions = {};
  if (f.openDelay !== undefined) out.openDelay = f.openDelay;
  if (f.closeDelay !== undefined) out.closeDelay = f.closeDelay;
  if (f.placement !== undefined) out.placement = f.placement;
  if (f.interactive !== undefined) out.interactive = f.interactive;
  return out;
}
