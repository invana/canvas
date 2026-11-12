// The pure half of `TreeFilterPanel`: which canvas nodes a set of unticked
// leaves hides, the tri-state of a parent, search, and the bridge edges drawn
// across hidden nodes. No React, no store — values in, values out.

import type { GraphEdge } from '@invana/graph';

/** One row of the tree. A leaf names the canvas nodes it stands for; a parent holds children. */
export interface TreeFilterItem {
  id: string;
  label: string;
  /** Canvas node ids this leaf shows and hides. Ignored on a parent. */
  nodeIds?: readonly string[];
  children?: readonly TreeFilterItem[];
}

/** A top-level group of the panel — a tree (Product → Feature → Story) or a flat list (Journeys). */
export interface TreeFilterGroup {
  id: string;
  title: string;
  items: readonly TreeFilterItem[];
}

/** What marks a bridge edge in its `data`. */
export const BRIDGE_KEY = 'bridge';

/** The data a bridge edge carries beside the first hop's own. */
export interface BridgeData {
  [BRIDGE_KEY]: true;
  /** The hidden node ids it crosses, in the order first met. */
  over: string[];
}

/** Whether an edge is a bridge the panel drew. */
export function isBridgeEdge(edge: { data?: unknown }): boolean {
  return typeof edge.data === 'object' && edge.data !== null && (edge.data as Record<string, unknown>)[BRIDGE_KEY] === true;
}

/** Every leaf under `item`, or the item itself when it is one. */
export function leavesOf(item: TreeFilterItem): TreeFilterItem[] {
  if (!item.children?.length) return [item];
  return item.children.flatMap(leavesOf);
}

/** Every leaf id of every group. */
export function allLeafIds(groups: readonly TreeFilterGroup[]): string[] {
  return groups.flatMap((g) => g.items.flatMap(leavesOf)).map((l) => l.id);
}

/** A row's tick: every leaf under it shown, none, or some. */
export function tickOf(item: TreeFilterItem, unticked: ReadonlySet<string>): boolean | 'indeterminate' {
  const leaves = leavesOf(item);
  const off = leaves.filter((l) => unticked.has(l.id)).length;
  if (off === 0) return true;
  return off === leaves.length ? false : 'indeterminate';
}

/**
 * The canvas nodes the unticked leaves hide.
 *
 * A node is hidden when some group names it and, in that group, none of the
 * leaves naming it is ticked. So with a product tree and a journey list, a story
 * goes when its own leaf is unticked, or when every journey it is on is; a node
 * no group names is never touched.
 */
export function hiddenNodeIds(groups: readonly TreeFilterGroup[], unticked: ReadonlySet<string>): Set<string> {
  const hidden = new Set<string>();
  for (const group of groups) {
    const shown = new Map<string, boolean>();
    for (const leaf of group.items.flatMap(leavesOf)) {
      const on = !unticked.has(leaf.id);
      for (const id of leaf.nodeIds ?? []) shown.set(id, (shown.get(id) ?? false) || on);
    }
    for (const [id, on] of shown) if (!on) hidden.add(id);
  }
  return hidden;
}

/**
 * The rows `query` leaves: those whose label or id holds it, with their
 * ancestors (so the path shows) and their children (so a matched parent opens
 * whole). `null` for an empty query — every row.
 */
export function matchingIds(groups: readonly TreeFilterGroup[], query: string): Set<string> | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const out = new Set<string>();
  const visit = (item: TreeFilterItem, ancestors: string[]): void => {
    if (item.label.toLowerCase().includes(q) || item.id.toLowerCase().includes(q)) {
      for (const a of ancestors) out.add(a);
      const addAll = (i: TreeFilterItem) => {
        out.add(i.id);
        i.children?.forEach(addAll);
      };
      addAll(item);
      return;
    }
    item.children?.forEach((c) => visit(c, [...ancestors, item.id]));
  };
  for (const g of groups) g.items.forEach((i) => visit(i, []));
  return out;
}

/**
 * Bridge edges across `hidden`: for each edge type, from every shown node
 * whose path of that type runs into hidden nodes, one edge to each shown node
 * the path comes out at — so `A → [hidden] → C` reads `A ⇢ C`. No bridge where
 * a shown edge of the type already joins the two, and none from a node to
 * itself. Each takes the type, data and style of its first hop, marked with
 * {@link BRIDGE_KEY}; `style` restyles it (dashed by default).
 *
 * `shown(id)` is whether a node outside `hidden` is drawn — a node another
 * filter hid is neither crossed nor joined. Bridges in `edges` are ignored.
 */
export function bridgeEdges(
  edges: readonly GraphEdge[],
  hidden: ReadonlySet<string>,
  shown: (id: string) => boolean,
  style: (firstHop: GraphEdge) => unknown = dashed,
): GraphEdge[] {
  if (hidden.size === 0) return [];
  const out = new Map<string, Map<string, GraphEdge[]>>();
  const direct = new Set<string>();
  for (const e of edges) {
    if (isBridgeEdge(e)) continue;
    let byType = out.get(e.type);
    if (!byType) out.set(e.type, (byType = new Map()));
    const list = byType.get(e.source);
    if (list) list.push(e);
    else byType.set(e.source, [e]);
    if (!hidden.has(e.source) && !hidden.has(e.target)) direct.add(`${e.type}|${e.source}|${e.target}`);
  }
  const bridges = new Map<string, GraphEdge>();
  for (const [type, bySource] of out) {
    for (const [source, firsts] of bySource) {
      if (hidden.has(source) || !shown(source)) continue;
      for (const first of firsts) {
        if (!hidden.has(first.target)) continue;
        // Walk the hidden run from this hop; every shown node it reaches is a bridge end.
        const seen = new Set<string>([first.target]);
        const over: string[] = [first.target];
        const stack = [first.target];
        while (stack.length) {
          const at = stack.pop()!;
          for (const next of bySource.get(at) ?? []) {
            const t = next.target;
            if (seen.has(t)) continue;
            seen.add(t);
            if (hidden.has(t)) {
              over.push(t);
              stack.push(t);
            } else if (t !== source && shown(t) && !direct.has(`${type}|${source}|${t}`)) {
              const id = `${BRIDGE_KEY}|${type}|${source}|${t}`;
              if (!bridges.has(id)) {
                const data: BridgeData = { [BRIDGE_KEY]: true, over: [...over] };
                bridges.set(id, {
                  id,
                  source,
                  target: t,
                  type,
                  data: { ...(typeof first.data === 'object' && first.data !== null ? first.data : {}), ...data },
                  style: style(first),
                });
              }
            }
          }
        }
      }
    }
  }
  return [...bridges.values()];
}

/** The default bridge style: the first hop's, dashed and a little faint. */
function dashed(firstHop: GraphEdge): unknown {
  const base = typeof firstHop.style === 'object' && firstHop.style !== null ? firstHop.style : {};
  return { ...base, strokeDashArray: [5, 4], strokeAlpha: 0.7 };
}
