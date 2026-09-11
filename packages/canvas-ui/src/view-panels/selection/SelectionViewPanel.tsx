// SelectionViewPanel — a live list of **what is currently selected** on a
// `GraphCanvas`, split into a **Nodes** section and an **Edges** section. The
// natural companion to `GraphStatusBar`, which only ever showed a count: select
// forty nodes with a lasso and this is where you see *which* forty, drop one you
// didn't mean to catch, or park the lot out of the way.
//
// **Read from the kernel store, write through the behaviour.** The set comes from
// `canvas.store.view` → `interaction.selection` (D11: the semantic selection is
// owned by the view state, not by a behaviour), read reactively with `useStore`.
// That set is deliberately **domain-free** — a flat `Set<string>` with no kind and
// no labels — so node-vs-edge is resolved here by `GraphStore.getNode` /
// `getEdge` (two O(1) map lookups per selected id, never a scan of the graph).
// Writes go the other way, through `ClickSelectBehaviour.deselect` /
// `clearSelection`, because that behaviour also owns the selection *visuals* and
// the raise set: clearing `store.actions.selection` directly would empty the set
// and leave the highlight painted. Read from the kernel, write through the
// behaviour — until selection writes themselves move into the kernel.
//
// Like `FindInCanvasViewPanel` / `CanvasFiltersViewPanel` it takes a *live*
// `GraphCanvas` and stays within the package's import rules — `@invana/graph` is
// imported for **types only** (label resolution lives in `../element-display`,
// shared with `ElementInspectorViewPanel` so a row and its detail card can never
// disagree about an element's name) and all chrome is `@invana/ui`.
// Row content tracks the data stream (`node:update` / `node:remove` / … coalesced
// per animation frame) so a renamed or deleted selected element never shows a
// stale name.

import type { ClickSelectBehaviour, GraphCanvas, GraphEdge, GraphLayer, GraphNode } from '@invana/graph';
import type { CanvasView } from '@invana/canvas';
import { useStore } from '@invana/canvas-react';
import { Button, Card, Separator, cn } from '@invana/ui';
import { ArrowRight, EyeOff, HelpCircle, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { displayNameOf, labelOfEdge, labelOfNode, nodeSwatchColor } from '../element-display';

export interface SelectionViewPanelProps {
  /** The live canvas engine (null until `<Canvas>` publishes it). */
  canvas: GraphCanvas | null;
  /** GraphLayer id the selected ids are resolved against. Default `'graph'`. */
  layerId?: string;
  /**
   * `ClickSelectBehaviour` id the **deselect** / **clear** actions write through —
   * the same behaviour that mirrors the selection into the store. Default
   * `'click-select'`. When no such behaviour is registered the panel is read-only:
   * the list still renders, the mutating controls are hidden.
   */
  selectBehaviourId?: string;
  /** Minimum zoom a **node** row click zooms in to. Default `2`. */
  focusZoom?: number;
  /** Extra classes for the panel root. */
  className?: string;
}

/**
 * The store selector — module scope, so its identity is stable across renders
 * (`useStore`'s R4 rule). `interaction.selection` is replaced with a fresh `Set`
 * on every selection write, so the default `Object.is` comparison re-renders
 * exactly on selection change and on nothing else.
 */
const selectSelection = (s: CanvasView): ReadonlySet<string> => s.interaction.selection;

/**
 * The selection resolved against the graph layer. `unresolved` holds ids that are
 * in the selection set but in neither index — a node removed while selected, or
 * an id belonging to a different layer. They are listed, not dropped: a silently
 * shorter list would misreport the selection.
 */
interface Resolved {
  nodes: GraphNode[];
  edges: GraphEdge[];
  unresolved: string[];
}

/**
 * Lists the current selection of a `GraphCanvas` — **Nodes** then **Edges** —
 * reading `view.interaction.selection` from the kernel store. Click a row to
 * **focus** it (frames the camera on it), ✕ to **deselect** just that element;
 * the header clears the whole selection or **hides** it (parking every selected
 * element into `CanvasFiltersViewPanel`'s list). Drop it into a panel / tab and
 * hand it the live `canvas`.
 *
 * A thin **validation guard**: the real work runs in
 * {@link SelectionViewPanelContent} with a guaranteed-live canvas, which lets the
 * body read the store with the plain reactive `useStore` and no null plumbing.
 */
export function SelectionViewPanel({ canvas, className, ...rest }: SelectionViewPanelProps) {
  if (!canvas) {
    return (
      <Card className={cn('flex h-full w-full items-center justify-center', className)}>
        <p className="text-muted-foreground p-4 text-sm">Failed to load — no canvas.</p>
      </Card>
    );
  }
  return <SelectionViewPanelContent canvas={canvas} className={className} {...rest} />;
}

/**
 * The panel body — runs only with a guaranteed-live `canvas`. Reads the selection
 * from `store.view.interaction.selection` (the source of truth, so it re-renders
 * on a selection made by *any* mode — click, brush, lasso, or a programmatic
 * `select*` call) and resolves each id against the graph layer for its kind,
 * name, and swatch.
 */
function SelectionViewPanelContent({
  canvas,
  layerId = 'graph',
  selectBehaviourId = 'click-select',
  focusZoom = 2,
  className,
}: SelectionViewPanelProps & { canvas: GraphCanvas }) {
  const layer = canvas.layers.get<GraphLayer>(layerId) ?? undefined;
  const store = layer?.store;
  const select = selectBehaviourId ? canvas.behaviours.get<ClickSelectBehaviour>(selectBehaviourId) : undefined;

  // The selection itself — reactive, straight off the kernel store.
  const selection = useStore(canvas.store.view, selectSelection);

  // A revision counter bumped (coalesced per frame) whenever the layer's data
  // changes, so rows re-resolve their names/colours after a rename or a removal.
  // Only `update` / `remove` matter: an id cannot be selected before it exists.
  const [dataRev, setDataRev] = useState(0);
  useEffect(() => {
    if (!store) return;
    let frame = 0;
    const schedule = (): void => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setDataRev((r) => r + 1);
      });
    };
    const unsubs = [
      store.events.on('node:update', schedule),
      store.events.on('node:remove', schedule),
      store.events.on('edge:update', schedule),
      store.events.on('edge:remove', schedule),
    ];
    return () => {
      if (frame) cancelAnimationFrame(frame);
      for (const off of unsubs) off();
    };
  }, [store]);

  // Classify the flat id set into nodes / edges / unresolved. O(selection), not
  // O(graph) — `getNode` / `getEdge` are map lookups.
  const { nodes, edges, unresolved } = useMemo<Resolved>(() => {
    const out: Resolved = { nodes: [], edges: [], unresolved: [] };
    if (!store) {
      out.unresolved = [...selection];
      return out;
    }
    for (const id of selection) {
      const node = store.getNode(id);
      if (node) {
        out.nodes.push(node);
        continue;
      }
      const edge = store.getEdge(id);
      if (edge) out.edges.push(edge);
      else out.unresolved.push(id);
    }
    return out;
    // `dataRev` is a deliberate dependency: the store is mutable, so a data change
    // must re-run the resolution even though `selection` is unchanged.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection, store, dataRev]);

  const total = selection.size;

  // Row click: frame the camera on the element. `includeHidden` so an element
  // hidden while still selected can be located.
  const focusNode = useCallback(
    (id: string): void => layer?.focusNode(id, { zoom: focusZoom, includeHidden: true }),
    [layer, focusZoom],
  );
  const focusEdge = useCallback((id: string): void => layer?.focusEdges([id], { includeHidden: true }), [layer]);

  // Writes go through the behaviour, never `store.actions.selection` — it owns the
  // selection visuals and the raise set alongside the semantic set.
  const deselect = useCallback((id: string): void => select?.deselect(id), [select]);
  const clearAll = useCallback((): void => select?.clearSelection(), [select]);

  /**
   * Hide every selected element, then clear the selection — a hidden element you
   * can no longer see is a confusing thing to keep selected, and each one is now
   * listed (and restorable) in `CanvasFiltersViewPanel`.
   */
  const hideSelected = useCallback((): void => {
    if (!layer) return;
    for (const n of nodes) layer.hideNode(n.id);
    for (const e of edges) layer.hideEdge(e.id);
    select?.clearSelection();
  }, [layer, nodes, edges, select]);

  return (
    <div className={cn('flex h-full flex-col gap-2 overflow-hidden p-2 text-sm', className)}>
      {/* Count + the bulk actions. Both mutate the selection, so both are absent
          when no ClickSelectBehaviour resolves (the panel is then read-only). */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground text-xs">
          {total} selected · {nodes.length} node(s) · {edges.length} edge(s)
        </span>
        {select && (
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={total === 0}
              onClick={hideSelected}
              title="Hide every selected element"
              className="gap-1.5 [&_svg]:size-3.5"
            >
              <EyeOff className="text-muted-foreground/70" />
              Hide
            </Button>
            <Button variant="outline" size="sm" disabled={total === 0} onClick={clearAll}>
              Clear
            </Button>
          </div>
        )}
      </div>

      <Separator />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {total === 0 ? (
          <p className="text-muted-foreground px-1 text-xs">
            {select
              ? 'Nothing selected — click, brush, or lasso elements on the canvas.'
              : 'Nothing selected. No ClickSelectBehaviour is registered, so this list is read-only.'}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {nodes.length > 0 && (
              <section className="flex flex-col gap-0.5">
                <h3 className="text-muted-foreground px-2 text-xs font-medium">Nodes ({nodes.length})</h3>
                {nodes.map((n) => {
                  // The node's body colour — the same style the renderer paints.
                  const color = layer ? nodeSwatchColor(layer.resolveNodeStyle(n)) : undefined;
                  return (
                    <div key={`n:${n.id}`} className="group flex items-center gap-2 px-1">
                      <Button
                        variant="ghost"
                        onClick={() => focusNode(n.id)}
                        title={`Focus node ${n.id}`}
                        className="h-auto min-w-0 flex-1 items-start justify-start gap-2 rounded-md px-2 py-1.5 text-left font-normal hover:ring-border [&_svg]:size-3"
                      >
                        {/* Hollow when the node has no representable solid colour. */}
                        <span
                          className="border-muted-foreground/40 mt-0.5 block h-3 w-3 shrink-0 rounded-full border"
                          style={color ? { backgroundColor: color } : undefined}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{displayNameOf(n)}</span>
                          <span className="text-muted-foreground block truncate">
                            <span className="opacity-70">id:</span> {n.id}
                            <span className="opacity-50"> · </span>
                            <span className="opacity-70">label:</span> {labelOfNode(n)}
                          </span>
                        </span>
                      </Button>
                      {select && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deselect(n.id)}
                          title={`Deselect node ${n.id}`}
                          className="h-6 w-6 shrink-0"
                        >
                          <X className="text-muted-foreground/70 h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </section>
            )}

            {edges.length > 0 && (
              <section className="flex flex-col gap-0.5">
                <h3 className="text-muted-foreground px-2 text-xs font-medium">Edges ({edges.length})</h3>
                {edges.map((e) => (
                  <div key={`e:${e.id}`} className="group flex items-center gap-2 px-1">
                    <Button
                      variant="ghost"
                      onClick={() => focusEdge(e.id)}
                      title={`Focus edge ${e.id}`}
                      className="h-auto min-w-0 flex-1 items-start justify-start gap-2 rounded-md px-2 py-1.5 text-left font-normal hover:ring-border [&_svg]:size-3"
                    >
                      <ArrowRight className="text-muted-foreground/70 mt-0.5 shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {displayNameOf(e)}
                          <span className="text-muted-foreground/60 ml-1 font-normal">
                            {e.source} → {e.target}
                          </span>
                        </span>
                        <span className="text-muted-foreground block truncate">
                          <span className="opacity-70">id:</span> {e.id}
                          <span className="opacity-50"> · </span>
                          <span className="opacity-70">label:</span> {labelOfEdge(e)}
                        </span>
                      </span>
                    </Button>
                    {select && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deselect(e.id)}
                        title={`Deselect edge ${e.id}`}
                        className="h-6 w-6 shrink-0"
                      >
                        <X className="text-muted-foreground/70 h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </section>
            )}

            {/* Selected ids that resolve to nothing in this layer — reported
                rather than dropped, so the list always accounts for the set. */}
            {unresolved.length > 0 && (
              <section className="flex flex-col gap-0.5">
                <h3 className="text-muted-foreground px-2 text-xs font-medium">Not in this layer ({unresolved.length})</h3>
                {unresolved.map((id) => (
                  <div key={`u:${id}`} className="flex items-center gap-2 px-3 py-1.5">
                    <HelpCircle className="text-muted-foreground/70 h-3 w-3 shrink-0" />
                    <span className="text-muted-foreground min-w-0 flex-1 truncate">{id}</span>
                    {select && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deselect(id)}
                        title={`Deselect ${id}`}
                        className="h-6 w-6 shrink-0"
                      >
                        <X className="text-muted-foreground/70 h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
