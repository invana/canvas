import type { LabelCollisionFields, LabelCollisionOptions } from './types';

/**
 * Map a `LabelCollisionBehaviourOptions`-shaped patch to the flat
 * {@link LabelCollisionFields} the `@invana/forms` generator renders. The
 * nested `groups: { nodes, edges }` object is flattened to `groupNodes` /
 * `groupEdges`; everything else passes through.
 */
export function optionsToForm(o: LabelCollisionOptions = {}): LabelCollisionFields {
  return {
    strategy: o.strategy,
    prioritise: o.prioritise,
    flickerGuardMs: o.flickerGuardMs,
    groupNodes: o.groups?.nodes,
    groupEdges: o.groups?.edges,
  };
}

/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link LabelCollisionOptions} patch. Only fields the form actually set are
 * included (no `undefined` / empty-string keys), so the result is safe to spread
 * over the behaviour's current options on `setOptions`. The nested `groups`
 * object is reassembled only when at least one side is set.
 */
export function formToOptions(f: LabelCollisionFields): LabelCollisionOptions {
  const out: LabelCollisionOptions = {};
  if (f.strategy !== undefined) out.strategy = f.strategy;
  if (f.prioritise !== undefined) out.prioritise = f.prioritise;
  if (f.flickerGuardMs !== undefined) out.flickerGuardMs = f.flickerGuardMs;
  if (f.groupNodes || f.groupEdges) {
    out.groups = {};
    if (f.groupNodes) out.groups.nodes = f.groupNodes;
    if (f.groupEdges) out.groups.edges = f.groupEdges;
  }
  return out;
}
