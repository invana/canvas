/**
 * Where a rooted layout starts — the one rule every tree-shaped layout and the
 * layout presets share, so *Automatic* means the same thing everywhere.
 *
 * Two rules:
 *
 * - **`'tree'`** (a layered tree or flow): the drawn nodes with no incoming
 *   relationship are the roots, and a layered algorithm already starts there,
 *   so this answers `undefined` whenever such a node exists. Only a graph where
 *   every node has an incoming edge — a cycle with nothing feeding it — needs a
 *   named root: the selection, else the most-connected node.
 * - **`'centre'`** (a radial layout): the selection, else the most-connected
 *   node. A radial layout always needs one.
 *
 * "The selection" is the first node of `nodes`, in its iteration order, that
 * carries the `selected` state. "Most-connected" counts edges in `edges`
 * (self-loops excluded); a tie goes to the node that comes first in `nodes`,
 * so the answer is stable from run to run.
 *
 * A pure read over `layer.store`; it never mutates.
 */

import type { GraphLayer } from '../layer/GraphLayer';
import type { LayoutEdge } from './groups';

/** Which root a layout asks for — see the module docs. */
export type LayoutRootRule = 'tree' | 'centre';

/**
 * Resolve the root of a rooted layout over `nodes` and `edges` (the drawn
 * graph, as `collectPlaceableNodes` / `collectLayoutEdges` give it).
 * `undefined` when `nodes` is empty, or for `'tree'` when sources exist.
 */
export function resolveLayoutRoot(
  layer: GraphLayer,
  nodes: Iterable<string>,
  edges: readonly LayoutEdge[],
  rule: LayoutRootRule,
): string | undefined {
  const order = [...nodes];
  if (order.length === 0) return undefined;
  const inScope = new Set(order);

  if (rule === 'tree') {
    const hasIncoming = new Set<string>();
    for (const e of edges) {
      if (e.source !== e.target && inScope.has(e.source)) hasIncoming.add(e.target);
    }
    if (order.some((id) => !hasIncoming.has(id))) return undefined;
  }

  const selected = order.find((id) => layer.store.nodeStatesOf(id).includes('selected'));
  if (selected !== undefined) return selected;

  const degree = new Map<string, number>();
  for (const e of edges) {
    if (e.source === e.target) continue;
    if (inScope.has(e.source)) degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
    if (inScope.has(e.target)) degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
  }
  let best = order[0]!;
  let bestDegree = degree.get(best) ?? 0;
  for (const id of order) {
    const d = degree.get(id) ?? 0;
    if (d > bestDegree) {
      best = id;
      bestDegree = d;
    }
  }
  return best;
}
