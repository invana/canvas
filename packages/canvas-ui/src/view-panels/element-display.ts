// Shared **display** helpers for the element-facing view panels — how a
// `GraphNode` / `GraphEdge` is named, labelled, and coloured in a list or a
// detail card. Internal to `view-panels/`: not exported from the package barrel,
// so it stays a refactor of presentation, not a public API.
//
// These were duplicated in `SelectionViewPanel` and then again in
// `ElementInspectorViewPanel` — the third copy is what unblocked the extraction
// (`rfc:feat-2026-09-11-nothing-lists-what-is-selected` F10 / D-7). Keeping one
// copy matters beyond line count: the name a row shows and the name its detail
// card shows must be the *same* name, or the master/detail pair reads as two
// different elements.
//
// `@invana/graph` is imported for **types only** — the label precedence below
// mirrors graph's own `defaultNodeTypeOf` / `defaultEdgeTypeOf` rather than
// calling them, because canvas-ui takes no value dependency on the engine.

import type { GraphEdge, GraphNode, NodeStyle } from '@invana/graph';

/** A non-empty string, or `undefined` — the guard behind every precedence chain below. */
export const asName = (v: unknown): string | undefined =>
  typeof v === 'string' && v.length > 0 ? v : undefined;

/** A plain object we can index. `data` is `unknown` user payload, so this is always needed first. */
export const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/**
 * A node's **type label** — what kind of thing it is (`person`, `commit`, …),
 * not what it is called. Same precedence as graph's `defaultNodeTypeOf`.
 */
export const labelOfNode = (n: GraphNode): string => {
  const d = n.data;
  return (
    asName(n.type) ??
    (isRecord(d)
      ? asName(d.type) ?? asName(d.label) ?? asName(d.kind) ?? asName(d.group) ?? asName(d.category)
      : undefined) ??
    'node'
  );
};

/** An edge's **type label** (the predicate). Same precedence as graph's `defaultEdgeTypeOf`. */
export const labelOfEdge = (e: GraphEdge): string => {
  const d = e.data;
  return asName(e.type) ?? (isRecord(d) ? asName(d.type) ?? asName(d.label) ?? asName(d.kind) : undefined) ?? 'edge';
};

/**
 * The human-readable **title** for an element — a `name` / `title` / `label`
 * property, else the id. Falling back to the id rather than to a placeholder is
 * deliberate: an id is always true, and an element with no name is common.
 */
export const displayNameOf = (el: GraphNode | GraphEdge): string => {
  const d = el.data;
  return (isRecord(d) ? asName(d.name) ?? asName(d.title) ?? asName(d.label) : undefined) ?? el.id;
};

/** `0xRRGGBB` → `#rrggbb`. */
export const hexColor = (c: number): string => `#${(c & 0xffffff).toString(16).padStart(6, '0')}`;

/**
 * A representable solid colour (`0xRRGGBB`) out of a `NodeStyle` fill — a bare
 * number, a `{ kind: 'solid', color }` layer, or the first such layer of a stack.
 * Image / glyph / svg fills have no single colour → `undefined`.
 */
export function solidColorOf(fill: unknown): number | undefined {
  if (typeof fill === 'number') return fill;
  const layers = Array.isArray(fill) ? fill : fill != null ? [fill] : [];
  for (const l of layers) if (isRecord(l) && l.kind === 'solid' && typeof l.color === 'number') return l.color;
  return undefined;
}

/**
 * The swatch colour for a node's **resolved** style — the same fill the renderer
 * paints: its body `bgFill`, else a composite card's `shape.fill`, else its
 * background stroke. `undefined` when the node has no representable solid colour,
 * which callers render as a hollow ring rather than inventing one.
 */
export function nodeSwatchColor(style: Partial<NodeStyle>): string | undefined {
  const shape = style.shape as { fill?: unknown } | undefined;
  const c =
    solidColorOf(style.bgFill) ??
    (typeof shape?.fill === 'number' ? shape.fill : undefined) ??
    (typeof style.bgStrokeColor === 'number' ? style.bgStrokeColor : undefined);
  return c === undefined ? undefined : hexColor(c);
}
