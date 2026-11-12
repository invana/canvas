// TreeFilterPanel — a hierarchical checkbox filter over a canvas. The host hands
// it groups of rows — a tree (Product → Feature → Story) and flat lists
// (Journeys) — whose leaves name canvas node ids; unticking a row hides its
// nodes on the canvas, ticking shows them again.
//
// | Piece | Does |
// |---|---|
// | Tri-state rows | A parent is ticked when every leaf under it is, clear when none is, and mixed between; a click ticks all of it, or clears it when it was full |
// | Counts | A parent reads `shown / leaves`; a leaf standing for several nodes reads how many |
// | Search | Narrows to the rows whose label or id holds the text, with their path open |
// | Show all · Hide all | Tick or clear every row the search leaves |
// | Select | A click on a row's label selects it (`onSelect`) — the host highlights what it stands for |
// | Bridges (`bridgeHidden`, on by default) | Where hidden nodes sit on a path, a dashed edge of the same type joins each shown node before them to each shown node after, so `A → [hidden] → C` reads `A ⇢ C` |
//
// Which nodes a set of unticked rows hides is `hiddenNodeIds` (`model.ts`): a
// node goes when, in some group that names it, none of the rows naming it is
// ticked. Visibility and bridges are written unrecorded (`store.internal.run`):
// a filter is a view of the graph, never a change to undo. Unmounting shows
// every node it hid and removes its bridges.
//
// Connected: it reads the canvas from context, or from its `canvas` prop when
// it sits outside the canvas tree (a left section beside the app).

import { GraphCanvasContext } from '@invana/canvas-react';
import { recordsOnly } from '@invana/graph';
import type { GraphCanvas, GraphEdge, GraphLayer } from '@invana/graph';
import { Checkbox } from '@invana/forms';
import { Button, cn, ExpandToggle, SearchInput, SectionHeader } from '@invana/ui';
import { Eye, EyeOff } from 'lucide-react';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';

import {
  bridgeEdges,
  hiddenNodeIds,
  isBridgeEdge,
  leavesOf,
  matchingIds,
  tickOf,
  type TreeFilterGroup,
  type TreeFilterItem,
} from './model';

export interface TreeFilterPanelProps {
  /** The live canvas. Default the one in context. */
  canvas?: GraphCanvas | null;
  /** GraphLayer whose nodes it hides. Default `'graph'`. */
  layerId?: string;
  /** The groups of rows, top to bottom. */
  groups: readonly TreeFilterGroup[];
  /** Controlled: the unticked leaf ids. Pair with `onHiddenChange`. */
  hidden?: ReadonlySet<string>;
  /** Uncontrolled: the leaves unticked at first. Default none. */
  defaultHidden?: Iterable<string>;
  /** Every change of the unticked leaves. */
  onHiddenChange?: (hidden: Set<string>) => void;
  /** Draw dashed bridges across hidden nodes. Default `true`. */
  bridgeHidden?: boolean;
  /** A bridge's style from its first hop's edge. Default that edge's, dashed. */
  bridgeStyle?: (firstHop: GraphEdge) => unknown;
  /** The selected row's id, controlled. */
  selectedId?: string | null;
  /** A click on a row's label: the row, or `null` when it was already selected. */
  onSelect?: (item: TreeFilterItem | null, groupId: string) => void;
  /** Rows open at first, by id. Default the top level closed. */
  defaultExpanded?: Iterable<string>;
  /** Heading. Default `Filter`. */
  title?: string;
  className?: string;
}

/** A tree of tickable rows that hides and shows canvas nodes, bridging the gaps it leaves. */
export function TreeFilterPanel({
  canvas: explicit,
  layerId = 'graph',
  groups,
  hidden: controlled,
  defaultHidden,
  onHiddenChange,
  bridgeHidden = true,
  bridgeStyle,
  selectedId = null,
  onSelect,
  defaultExpanded,
  title = 'Filter',
  className,
}: TreeFilterPanelProps) {
  const fromContext = useContext(GraphCanvasContext);
  const canvas = explicit ?? fromContext;
  const [own, setOwn] = useState<Set<string>>(() => new Set(defaultHidden));
  const unticked = controlled ?? own;
  const setUnticked = (next: Set<string>) => {
    if (controlled === undefined) setOwn(next);
    onHiddenChange?.(next);
  };
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<Set<string>>(() => new Set(defaultExpanded));
  const matches = useMemo(() => matchingIds(groups, query), [groups, query]);
  const nodesToHide = useMemo(() => hiddenNodeIds(groups, unticked), [groups, unticked]);

  useCanvasFilter(canvas, layerId, nodesToHide, bridgeHidden, bridgeStyle);

  const toggleRow = (item: TreeFilterItem) => {
    const leaves = leavesOf(item).map((l) => l.id);
    const next = new Set(unticked);
    if (tickOf(item, unticked) === true) for (const id of leaves) next.add(id);
    else for (const id of leaves) next.delete(id);
    setUnticked(next);
  };
  const visibleLeaves = groups
    .flatMap((g) => g.items.flatMap(leavesOf))
    .filter((l) => !matches || matches.has(l.id))
    .map((l) => l.id);
  const setAll = (show: boolean) => {
    const next = new Set(unticked);
    for (const id of visibleLeaves) {
      if (show) next.delete(id);
      else next.add(id);
    }
    setUnticked(next);
  };
  const toggleOpen = (id: string) => {
    const next = new Set(open);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setOpen(next);
  };

  const row = (item: TreeFilterItem, groupId: string, depth: number) => {
    if (matches && !matches.has(item.id)) return null;
    const isParent = !!item.children?.length;
    const expanded = matches !== null || open.has(item.id);
    const tick = tickOf(item, unticked);
    const leaves = isParent ? leavesOf(item) : [];
    const count = isParent
      ? `${leaves.filter((l) => !unticked.has(l.id)).length}/${leaves.length}`
      : (item.nodeIds?.length ?? 0) > 1
        ? String(item.nodeIds?.length)
        : null;
    const selected = selectedId === item.id;
    return (
      <li key={item.id} role="treeitem" aria-expanded={isParent ? expanded : undefined} aria-selected={selected}>
        {/* The indent is the row's depth — a runtime value, so it is the one inline style here. */}
        <div className={cn('flex items-center gap-1 rounded-sm pr-1', selected && 'bg-primary/15')} style={{ paddingLeft: depth * 12 }}>
          {isParent ? (
            <ExpandToggle open={expanded} label={item.label} onClick={() => toggleOpen(item.id)} />
          ) : (
            <ExpandToggle.Spacer />
          )}
          <Checkbox checked={tick} onCheckedChange={() => toggleRow(item)} aria-label={`Show ${item.label}`} />
          <Button
            variant="ghost"
            size="sm"
            className="min-w-0 flex-1 justify-start truncate px-1 font-normal"
            aria-pressed={selected}
            title={item.label}
            onClick={() => onSelect?.(selected ? null : item, groupId)}
          >
            <span className={cn('truncate', tick === false && 'text-muted-foreground line-through')}>{item.label}</span>
          </Button>
          {count !== null ? <span className="text-muted-foreground text-xs tabular-nums">{count}</span> : null}
        </div>
        {isParent && expanded ? <ul role="group">{item.children?.map((c) => row(c, groupId, depth + 1))}</ul> : null}
      </li>
    );
  };

  const shownLeaves = visibleLeaves.filter((id) => !unticked.has(id)).length;
  return (
    <div className={cn('flex h-full min-h-0 flex-col', className)}>
      <SectionHeader
        title={title}
        count={`${shownLeaves} of ${visibleLeaves.length}`}
        actions={
          <>
            <Button size="sm" variant="ghost" onClick={() => setAll(true)}>
              <Eye />
              Show all
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAll(false)}>
              <EyeOff />
              Hide all
            </Button>
          </>
        }
      />
      <div className="px-2 pb-2">
        <SearchInput value={query} onChange={setQuery} placeholder="Search" aria-label="Search the filter" />
      </div>
      {/* A plain scroller, as every view panel has: a ScrollArea's viewport grows to its widest row, so labels never truncate. */}
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
        {groups.map((g) => (
          <section key={g.id} aria-label={g.title} className="pb-2">
            <SectionHeader title={g.title} />
            <ul role="tree" aria-label={g.title} className="px-1">
              {g.items.map((i) => row(i, g.id, 0))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

/**
 * Hide `nodes` on the layer — and only those, showing again what it hid before —
 * then redraw the bridges across them. Re-applied when the layer's graph is
 * replaced (a new node or edge count, its own bridges aside).
 */
function useCanvasFilter(
  canvas: GraphCanvas | null,
  layerId: string,
  nodes: ReadonlySet<string>,
  bridge: boolean,
  bridgeStyle: ((firstHop: GraphEdge) => unknown) | undefined,
) {
  const styleRef = useRef(bridgeStyle);
  styleRef.current = bridgeStyle;
  useEffect(() => {
    const layer = canvas?.layers.get<GraphLayer>(layerId);
    if (!layer) return;
    const store = layer.store;
    let hid = new Set<string>();
    let bridges: string[] = [];
    let key = '';
    const graphKey = () => `${store.nodeCount()}:${store.edgeCount() - bridges.filter((id) => store.hasEdge(id)).length}`;
    const apply = () => {
      store.internal.run(() =>
        store.batch(() => {
          const live = [...nodes].filter((id) => store.hasNode(id));
          store.setNodesHidden(
            [...hid].filter((id) => !nodes.has(id) && store.hasNode(id)),
            false,
          );
          store.setNodesHidden(live, true);
          hid = new Set(live);
          for (const id of bridges) store.removeEdge(id);
          bridges = [];
          if (bridge && hid.size > 0) {
            const edges = recordsOnly(store.edges()).filter((e) => !isBridgeEdge(e));
            const made = bridgeEdges(edges, hid, (id) => !store.isNodeHidden(id), styleRef.current);
            store.addData({ edges: made });
            bridges = made.map((e) => e.id);
          }
        }),
      );
      key = graphKey();
    };
    apply();
    const off = layer.events.on('data:changed', () => {
      if (graphKey() !== key) apply();
    });
    return () => {
      off();
      store.internal.run(() =>
        store.batch(() => {
          store.setNodesHidden(
            [...hid].filter((id) => store.hasNode(id)),
            false,
          );
          for (const id of bridges) store.removeEdge(id);
        }),
      );
    };
  }, [canvas, layerId, nodes, bridge]);
}
