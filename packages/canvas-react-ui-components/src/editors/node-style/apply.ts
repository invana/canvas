import type { GraphLayer, NodeStyle } from '@invana/graph';

import type { NodeStyleFormValue } from './types';

/**
 * Seed a form value from one representative node's currently resolved style.
 *
 * The layer's template (`nodeOption.style`) is private on `GraphLayer` and
 * has no public read accessor, so we seed by calling
 * `layer.resolveNodeStyle(node)` on the first node in the store and
 * capturing the literal-typed fields the form edits.
 *
 * Returns an empty value when the store has no nodes — the form renders
 * empty and the user fills in fresh values.
 */
export function seedFormFromLayer(layer: GraphLayer): NodeStyleFormValue {
  const firstNode = layer.store.nodes().next().value;
  if (!firstNode) return {};
  const resolved = layer.resolveNodeStyle(firstNode);
  return readLiteralFields(resolved);
}

/**
 * Commit a form value by patching every node in the store with
 * `updateNode(id, { style: { ...resolved, ...formValues } })`.
 *
 * The spread-before-patch is required: per
 * `feedback_updatenode_replaces_style`, `updateNode`'s `style` patch
 * replaces the prior style wholesale rather than merging field-by-field.
 * Without the spread, every field the form *didn't* touch would be wiped.
 *
 * Limitation acknowledged for v1: this writes concrete styles onto each
 * node, which take precedence over the layer-level template resolvers
 * (e.g. `bgFill: (n) => groupColors[...]`). After Apply, those resolvers
 * no longer drive the patched fields — the node carries baked-in literals.
 * Tracked as a follow-up — a public `GraphLayer.setNodeOption()` API would
 * let the editor edit the template instead of the per-node overrides.
 *
 * Nodes inserted *after* Apply still pick up the layer template (because
 * they were never patched), which produces a mixed look until they're
 * patched explicitly.
 */
export function commitFormToLayer(layer: GraphLayer, value: NodeStyleFormValue): void {
  // Drop undefined fields — the form uses `undefined` to mean "don't touch".
  const patch: Record<string, unknown> = {};
  for (const [key, fieldValue] of Object.entries(value)) {
    if (fieldValue !== undefined) patch[key] = fieldValue;
  }
  if (Object.keys(patch).length === 0) return;

  for (const node of layer.store.nodes()) {
    const resolved = layer.resolveNodeStyle(node);
    layer.store.updateNode(node.id, {
      style: { ...resolved, ...patch } as NodeStyle,
    });
  }
}

/**
 * Diff two form values to find dirty field keys. Used to render the dirty
 * indicator and to gate the Apply / Reset buttons.
 */
export function dirtyKeys(
  current: NodeStyleFormValue,
  baseline: NodeStyleFormValue,
): readonly (keyof NodeStyleFormValue)[] {
  const keys = new Set<keyof NodeStyleFormValue>([
    ...(Object.keys(current) as (keyof NodeStyleFormValue)[]),
    ...(Object.keys(baseline) as (keyof NodeStyleFormValue)[]),
  ]);
  const dirty: (keyof NodeStyleFormValue)[] = [];
  for (const k of keys) {
    if (!shallowEqual(current[k] as unknown, baseline[k] as unknown)) dirty.push(k);
  }
  return dirty;
}

function readLiteralFields(style: Partial<NodeStyle>): NodeStyleFormValue {
  return {
    shape: style.shape,
    size: style.size,
    bgFill: typeof style.bgFill === 'number' ? style.bgFill : undefined,
    bgAlpha: style.bgAlpha,
    bgStrokeColor: style.bgStrokeColor,
    bgStrokeAlpha: style.bgStrokeAlpha,
    bgStrokeWidth: style.bgStrokeWidth,
    bgStrokeAlignment: style.bgStrokeAlignment,
    bgStrokeDashArray: style.bgStrokeDashArray,
    bgStrokeCap: style.bgStrokeCap,
    bgStrokeJoin: style.bgStrokeJoin,
    labelText: style.labelText,
    labelColor: style.labelColor,
    labelFontSize: style.labelFontSize,
    labelFontWeight:
      typeof style.labelFontWeight === 'number' ? style.labelFontWeight : undefined,
    labelPlacement: style.labelPlacement,
    labelOffsetX: style.labelOffsetX,
    labelOffsetY: style.labelOffsetY,
  };
}

function shallowEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const ao = a as Record<string, unknown>;
    const bo = b as Record<string, unknown>;
    const ak = Object.keys(ao);
    if (ak.length !== Object.keys(bo).length) return false;
    return ak.every((k) => Object.is(ao[k], bo[k]));
  }
  return false;
}
