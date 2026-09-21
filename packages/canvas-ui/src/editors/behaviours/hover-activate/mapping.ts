import type { HoverActivateFields, HoverActivateOptions } from './types';

/**
 * Parse a comma-separated type list to trimmed, de-duplicated, non-empty
 * strings. `undefined` for an empty field, so an untouched input contributes
 * no key to the patch (see {@link formToOptions}).
 */
function parseTypeList(text: string | undefined): string[] | undefined {
  if (text === undefined) return undefined;
  const parsed = text
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return [...new Set(parsed)];
}

/**
 * Map a `HoverActivateBehaviourOptions`-shaped patch to the flat
 * {@link HoverActivateFields} the `@invana/forms` generator renders.
 *
 * The two exclusion lists are the one encoding that happens here: `string[]`
 * in, comma-separated text out, because the form generator has no list field.
 * Everything else is a straight passthrough.
 */
export function optionsToForm(o: HoverActivateOptions = {}): HoverActivateFields {
  return {
    hoverEdges: o.hoverEdges,
    excludeNodeTypes: o.excludeNodeTypes?.join(', '),
    excludeEdgeTypes: o.excludeEdgeTypes?.join(', '),
    state: o.state,
    inactiveState: o.inactiveState,
    raiseActive: o.raiseActive,
    degree: o.degree,
    direction: o.direction,
    zoomThreshold: o.zoomThreshold,
    zoomedOutState: o.zoomedOutState,
    zoomedOutEdgeState: o.zoomedOutEdgeState,
    zoomedOutScale: o.zoomedOutScale,
  };
}

/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link HoverActivateOptions} patch. Only fields the form actually set are
 * included (no `undefined` keys), so the result is safe to spread over the
 * behaviour's current options on `setOptions`.
 */
export function formToOptions(f: HoverActivateFields): HoverActivateOptions {
  const out: HoverActivateOptions = {};
  if (f.hoverEdges !== undefined) out.hoverEdges = f.hoverEdges;
  const excludeNodeTypes = parseTypeList(f.excludeNodeTypes);
  if (excludeNodeTypes !== undefined) out.excludeNodeTypes = excludeNodeTypes;
  const excludeEdgeTypes = parseTypeList(f.excludeEdgeTypes);
  if (excludeEdgeTypes !== undefined) out.excludeEdgeTypes = excludeEdgeTypes;
  if (f.state !== undefined) out.state = f.state;
  if (f.inactiveState !== undefined) out.inactiveState = f.inactiveState;
  if (f.raiseActive !== undefined) out.raiseActive = f.raiseActive;
  if (f.degree !== undefined) out.degree = f.degree;
  if (f.direction !== undefined) out.direction = f.direction;
  if (f.zoomThreshold !== undefined) out.zoomThreshold = f.zoomThreshold;
  if (f.zoomedOutState !== undefined) out.zoomedOutState = f.zoomedOutState;
  if (f.zoomedOutEdgeState !== undefined) out.zoomedOutEdgeState = f.zoomedOutEdgeState;
  if (f.zoomedOutScale !== undefined) out.zoomedOutScale = f.zoomedOutScale;
  return out;
}
