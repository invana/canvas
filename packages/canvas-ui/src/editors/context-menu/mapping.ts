import type { ContextMenuFields, ContextMenuOptions, ContextMenuTargetType } from './types';

/**
 * Map a `ContextMenuBehaviourOptions`-shaped patch to the flat
 * {@link ContextMenuFields} the `@invana/forms` generator renders. The `targets`
 * array is exploded into one boolean per kind; `state` (`string | null`) becomes
 * a text field (`null` → empty string).
 */
export function optionsToForm(o: ContextMenuOptions = {}): ContextMenuFields {
  const t = o.targets;
  return {
    targetNode: t ? t.includes('node') : undefined,
    targetEdge: t ? t.includes('edge') : undefined,
    targetCanvas: t ? t.includes('canvas') : undefined,
    state: o.state ?? undefined,
  };
}

/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link ContextMenuOptions} patch. Only fields the form actually set are
 * included, so the result is safe to spread on `setOptions`. The `targets` array
 * is reassembled only when at least one target toggle was set; a blank `state`
 * maps back to `null` (disabled).
 */
export function formToOptions(f: ContextMenuFields): ContextMenuOptions {
  const out: ContextMenuOptions = {};

  if (
    f.targetNode !== undefined ||
    f.targetEdge !== undefined ||
    f.targetCanvas !== undefined
  ) {
    const targets: ContextMenuTargetType[] = [];
    if (f.targetNode) targets.push('node');
    if (f.targetEdge) targets.push('edge');
    if (f.targetCanvas) targets.push('canvas');
    out.targets = targets;
  }

  if (f.state !== undefined) out.state = f.state === '' ? null : f.state;

  return out;
}
