// CanvasFiltersView — a managed "parking" list of elements you've set aside on a
// `GraphCanvas`. The natural companion to `LayersPanelView`: that panel hides
// elements (right-click → Hide); this view collects them and lets you manage each.
//
// Three per-row actions, deliberately distinct:
//   • **focus** (⊹) frames the element in view and selects it (the app-wide
//     ClickSelectBehaviour selection — same as the context-menu "Select");
//   • the **eye** toggles the element's visibility on the canvas (show ⇄ hide) but
//     **keeps it in the list** — so you can flip it on to peek, then off again;
//   • **remove** (✕) restores the element completely (makes it visible) **and drops
//     it from the list** — you're done managing it.
// "Show all" makes every parked element visible in one paint but keeps them in the
// list (the bulk eye; remove ✕ is what drops an item).
//
// Because a toggled-visible element leaves the store's hidden set, the list can't
// be derived from `store.hiddenNodes()` alone — the view keeps its own *parked*
// set: it absorbs anything newly hidden (via the visibility stream), keeps items
// that were toggled back to visible, and drops items removed from the graph.
//
// Like `LayersPanelView` it takes a *live* `GraphCanvas` and drives visibility on
// it, staying within the package's import rules — `@invana/graph` is imported for
// **types only** and all chrome is `@invana/ui`. Visibility runs through the
// first-class API (`layer.showNode` / `layer.hideNode` / `layer.showEdge` /
// `layer.hideEdge` / `layer.showAllHidden`); the parked set reconciles on the
// store's `node:visibility` / `edge:visibility` stream (and topology removes).

import type { ClickSelectBehaviour, GraphCanvas, GraphLayer } from '@invana/graph';
import { Button } from '@invana/ui';
import { ArrowRight, Circle, Crosshair, Eye, EyeOff, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export interface CanvasFiltersViewProps {
  /** The live canvas engine (null until `<Canvas>` publishes it). */
  canvas: GraphCanvas | null;
  /** GraphLayer id whose hidden elements this view lists. Default `'graph'`. */
  layerId?: string;
  /** Minimum zoom the node **Focus** action zooms in to. Default `2`. */
  focusZoom?: number;
  /**
   * `ClickSelectBehaviour` id that **Focus** also selects the element on — same
   * mechanism as the context-menu "Select". Default `'click-select'`; focus still
   * frames the element (a no-op selection) if no such behaviour is registered.
   */
  selectBehaviourId?: string;
}

/** The parked ids the panel is managing — node ids + edge ids, kept locally. */
interface Parked {
  nodes: Set<string>;
  edges: Set<string>;
}

/**
 * Lists the nodes and edges you've parked on a `GraphLayer` and lets you manage
 * each: **focus** (⊹) frames it in view and selects it, the **eye** toggles its
 * visibility (keeping it listed), and **remove** (✕)
 * restores it and drops it from the list; "Show all" makes every parked item
 * visible but keeps the list. An element hidden elsewhere (right-click → Hide) joins the
 * list automatically. Renders a compact empty state when nothing is parked. Drop
 * it into a panel / tab and hand it the live `canvas`.
 */
export function CanvasFiltersView({
  canvas,
  layerId = 'graph',
  focusZoom = 2,
  selectBehaviourId = 'click-select',
}: CanvasFiltersViewProps) {
  const layer = canvas?.layers.get<GraphLayer>(layerId) ?? undefined;
  const store = layer?.store;
  const select =
    selectBehaviourId != null ? canvas?.behaviours.get<ClickSelectBehaviour>(selectBehaviourId) : undefined;

  // The parked set is local React state (the store's hidden set can't hold
  // toggled-visible items). It's reconciled from the store on every change.
  const [parked, setParked] = useState<Parked>(() => ({ nodes: new Set(), edges: new Set() }));

  useEffect(() => {
    if (!store) {
      setParked({ nodes: new Set(), edges: new Set() });
      return;
    }
    // Reconcile the parked set against the store, on change — not per render:
    // keep previously-parked items that still exist (so a toggled-visible one
    // lingers), absorb anything newly hidden, and drop elements removed from the
    // graph. Payload-free — recompute from the store each time.
    const reconcile = () =>
      setParked((prev) => {
        const nodes = new Set<string>();
        for (const id of prev.nodes) if (store.hasNode(id)) nodes.add(id);
        for (const id of store.hiddenNodes()) nodes.add(id);
        const edges = new Set<string>();
        for (const id of prev.edges) if (store.hasEdge(id)) edges.add(id);
        for (const id of store.hiddenEdges()) edges.add(id);
        return { nodes, edges };
      });
    reconcile();
    const unsubs = [
      store.events.on('node:visibility', reconcile),
      store.events.on('edge:visibility', reconcile),
      store.events.on('node:remove', reconcile),
      store.events.on('edge:remove', reconcile),
    ];
    return () => {
      for (const off of unsubs) off();
    };
  }, [store]);

  // Focus: pan/zoom the camera to the element and select it (the app-wide
  // ClickSelectBehaviour selection — same as the context-menu "Select").
  // `includeHidden` so framing works even while the item is hidden.
  const focusNode = (id: string) => {
    layer?.focusNode(id, { zoom: focusZoom, includeHidden: true });
    select?.select(id, 'shape');
  };
  const focusEdge = (id: string) => {
    layer?.focusEdges([id], { includeHidden: true });
    select?.select(id, 'connector');
  };
  // Eye: flip visibility, stay parked. Remove: restore + drop from the list.
  const toggleNode = (id: string) => (store?.isNodeHidden(id) ? layer?.showNode(id) : layer?.hideNode(id));
  const toggleEdge = (id: string) => (store?.isEdgeHidden(id) ? layer?.showEdge(id) : layer?.hideEdge(id));
  const removeNodeFromHidden = (id: string) => {
    layer?.showNode(id);
    setParked((prev) => {
      if (!prev.nodes.has(id)) return prev;
      const nodes = new Set(prev.nodes);
      nodes.delete(id);
      return { nodes, edges: prev.edges };
    });
  };
  const removeEdgeFromHidden = (id: string) => {
    layer?.showEdge(id);
    setParked((prev) => {
      if (!prev.edges.has(id)) return prev;
      const edges = new Set(prev.edges);
      edges.delete(id);
      return { nodes: prev.nodes, edges };
    });
  };
  // Bulk show — like the eye, it makes everything visible but keeps the items
  // parked in the list (remove ✕ is what drops them).
  const showAll = () => layer?.showAllHidden();

  const nodes = [...parked.nodes];
  const edges = [...parked.edges];
  const empty = nodes.length === 0 && edges.length === 0;
  const anyHidden =
    nodes.some((id) => store?.isNodeHidden(id)) || edges.some((id) => store?.isEdgeHidden(id));

  return (
    <div className="flex h-full flex-col gap-2 overflow-y-auto p-2 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground text-xs">
          {nodes.length} node(s) · {edges.length} edge(s)
        </span>
        <Button variant="outline" size="sm" disabled={!anyHidden} onClick={showAll}>
          Show all
        </Button>
      </div>

      {empty ? (
        <p className="text-muted-foreground px-1 text-xs">
          Nothing hidden — right-click an element to Hide it.
        </p>
      ) : (
        <ul className="flex flex-col gap-0.5">
          {nodes.map((id) => {
            const hidden = !!store?.isNodeHidden(id);
            return (
              // Row is inert — only the ⊹ (focus) / eye (toggle) / ✕ (remove) buttons act.
              <li key={`n:${id}`} className="flex items-center gap-2 px-2 py-1">
                <Circle className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                <span className="min-w-0 flex-1 truncate">node · {id}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => focusNode(id)}
                  title={`Focus & select node ${id}`}
                  className="h-6 w-6 shrink-0"
                >
                  <Crosshair className="h-3.5 w-3.5 text-muted-foreground/70" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleNode(id)}
                  title={hidden ? `Show node ${id}` : `Hide node ${id}`}
                  className="h-6 w-6 shrink-0"
                >
                  {hidden ? (
                    <Eye className="h-3.5 w-3.5 text-muted-foreground/70" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5 text-muted-foreground/70" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeNodeFromHidden(id)}
                  title={`Remove node ${id} from the list`}
                  className="h-6 w-6 shrink-0"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground/70" />
                </Button>
              </li>
            );
          })}
          {edges.map((id) => {
            const hidden = !!store?.isEdgeHidden(id);
            return (
              <li key={`e:${id}`} className="flex items-center gap-2 px-2 py-1">
                <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                <span className="min-w-0 flex-1 truncate">edge · {id}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => focusEdge(id)}
                  title={`Focus & select edge ${id}`}
                  className="h-6 w-6 shrink-0"
                >
                  <Crosshair className="h-3.5 w-3.5 text-muted-foreground/70" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleEdge(id)}
                  title={hidden ? `Show edge ${id}` : `Hide edge ${id}`}
                  className="h-6 w-6 shrink-0"
                >
                  {hidden ? (
                    <Eye className="h-3.5 w-3.5 text-muted-foreground/70" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5 text-muted-foreground/70" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeEdgeFromHidden(id)}
                  title={`Remove edge ${id} from the list`}
                  className="h-6 w-6 shrink-0"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground/70" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
