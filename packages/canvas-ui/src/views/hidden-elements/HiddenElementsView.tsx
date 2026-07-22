// HiddenElementsView — a live list of the elements explicitly hidden on a
// `GraphCanvas`, with per-item + "Show all" restore. The natural companion to
// `LayersPanelView`: that panel hides elements (right-click → Hide); this view
// surfaces what's currently hidden and brings it back.
//
// Like `LayersPanelView` it takes a *live* `GraphCanvas` and drives visibility on
// it, staying within the package's import rules — `@invana/graph` is imported for
// **types only** and all chrome is `@invana/ui`. Restore runs through the
// first-class visibility API (`layer.showNode` / `layer.showEdge` /
// `layer.showAllHidden`); the list recomputes on the store's `node:visibility` /
// `edge:visibility` stream (and topology removes), on change — not per render.

import type { GraphCanvas, GraphLayer } from '@invana/graph';
import { Button } from '@invana/ui';
import { ArrowRight, Circle, EyeOff } from 'lucide-react';
import { useEffect, useReducer } from 'react';

export interface HiddenElementsViewProps {
  /** The live canvas engine (null until `<Canvas>` publishes it). */
  canvas: GraphCanvas | null;
  /** GraphLayer id whose hidden elements this view lists. Default `'graph'`. */
  layerId?: string;
}

/**
 * Lists the currently-hidden nodes and edges of a `GraphLayer` and lets the user
 * restore them — click an item to show that one, "Show all" to reveal every
 * hidden element in a single paint. Renders a compact empty state when nothing is
 * hidden. Drop it into a panel / tab and hand it the live `canvas`.
 */
export function HiddenElementsView({ canvas, layerId = 'graph' }: HiddenElementsViewProps) {
  // The store is live mutable canvas state, not React state — bump a counter to
  // re-read it when its visibility / topology stream fires.
  const [, rebuild] = useReducer((n: number) => n + 1, 0);

  const layer = canvas?.layers.get<GraphLayer>(layerId) ?? undefined;
  const store = layer?.store;

  useEffect(() => {
    if (!store) return;
    // Recompute on change, not per render: explicit hide/show flips the
    // visibility events; a removed element drops out of the hidden sets too.
    const unsubs = [
      store.events.on('node:visibility', rebuild),
      store.events.on('edge:visibility', rebuild),
      store.events.on('node:remove', rebuild),
      store.events.on('edge:remove', rebuild),
    ];
    return () => {
      for (const off of unsubs) off();
    };
  }, [store]);

  const nodes = store ? [...store.hiddenNodes()] : [];
  const edges = store ? [...store.hiddenEdges()] : [];
  const empty = nodes.length === 0 && edges.length === 0;

  return (
    <div className="flex h-full flex-col gap-2 overflow-y-auto p-2 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground text-xs">
          {nodes.length} node(s) · {edges.length} edge(s)
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={empty}
          onClick={() => layer?.showAllHidden()}
        >
          Show all
        </Button>
      </div>

      {empty ? (
        <p className="text-muted-foreground px-1 text-xs">
          Nothing hidden — right-click an element to Hide it.
        </p>
      ) : (
        <ul className="flex flex-col gap-0.5">
          {nodes.map((id) => (
            <li key={`n:${id}`}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => layer?.showNode(id)}
                title={`Show node ${id}`}
                className="w-full justify-start gap-2 font-normal"
              >
                <Circle className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                <span className="min-w-0 flex-1 truncate text-left">node · {id}</span>
                <EyeOff className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
              </Button>
            </li>
          ))}
          {edges.map((id) => (
            <li key={`e:${id}`}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => layer?.showEdge(id)}
                title={`Show edge ${id}`}
                className="w-full justify-start gap-2 font-normal"
              >
                <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                <span className="min-w-0 flex-1 truncate text-left">edge · {id}</span>
                <EyeOff className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
