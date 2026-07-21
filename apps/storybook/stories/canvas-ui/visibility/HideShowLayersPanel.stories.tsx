/**
 * **Hide / show driven by a live UI panel.** The flagship demo of first-class
 * per-element + whole-layer visibility feeding React UI:
 *
 *   - a right-docked **`<TabbedPanel>`** whose **Layers** tab hosts the
 *     `@invana/canvas-ui` **`<LayersPanelView>`** (layer eyes + nodes/edges by
 *     type + right-click Hide/Show), and whose **Hidden** tab lists the currently
 *     hidden elements with per-item + "Show all" restore,
 *   - a header **"Hide selected"** button — `useSelection()` → one
 *     `store.batch(...)` that hides the selected nodes + edges in a single paint.
 *
 * The Hidden tab recomputes on the store's `node:visibility` / `edge:visibility`
 * stream via `useGraphEvent` — on change, not per render.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useGraphCanvas, useGraphEvent, useSelection } from '@invana/canvas-react';
import { GraphCanvasApp, Panel } from '@invana/canvas-ui';
import { LayersPanelView } from '@invana/canvas-ui';
import type { GraphLayer, GraphNode } from '@invana/graph';
import { lesMiserables } from '@invana/graph-datasets';
import { ThemeProvider } from '@invana/themes';
import { TabbedPanel, type TabConfig } from '@invana/ui';
import { EyeOff, Layers } from 'lucide-react';
import { useState } from 'react';

const meta: Meta = { title: 'canvas-ui/visibility/HideShowLayersPanel' };
export default meta;
type Story = StoryObj;

/** Header button — hide the current selection (nodes + edges) in one paint. */
function HideSelectedButton() {
  const canvas = useGraphCanvas();
  const { selectedNodeIds, selectedEdgeIds, clear } = useSelection();
  const total = selectedNodeIds.length + selectedEdgeIds.length;
  return (
    <button
      type="button"
      disabled={total === 0}
      onClick={() => {
        const layer = canvas.layers.get<GraphLayer>('graph');
        if (!layer) return;
        // One batch → one flush → one paint for the whole mixed selection.
        layer.store.batch(() => {
          layer.hideNodes(selectedNodeIds);
          layer.hideEdges(selectedEdgeIds);
        });
        clear();
      }}
      className="rounded border border-border px-2 py-1 text-sm disabled:opacity-40"
    >
      Hide selected ({total})
    </button>
  );
}

/** The "Hidden" tab — lists explicitly-hidden elements, restore per-item or all.
 *  Recomputes on the store's visibility stream (on change, not per render). */
function HiddenTab() {
  const canvas = useGraphCanvas();
  const [, bump] = useState(0);
  useGraphEvent('node:visibility', () => bump((n) => n + 1));
  useGraphEvent('edge:visibility', () => bump((n) => n + 1));

  const store = canvas.layers.get<GraphLayer>('graph')?.store;
  const nodes = store ? [...store.hiddenNodes()] : [];
  const edges = store ? [...store.hiddenEdges()] : [];
  const empty = nodes.length === 0 && edges.length === 0;

  return (
    <div className="flex h-full flex-col gap-2 overflow-y-auto p-2 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground">
          {nodes.length} node(s) · {edges.length} edge(s)
        </span>
        <button
          type="button"
          disabled={empty}
          onClick={() => store?.showAllHidden()}
          className="rounded border border-border px-2 py-0.5 disabled:opacity-40"
        >
          Show all
        </button>
      </div>
      {empty ? (
        <p className="text-muted-foreground">Nothing hidden — right-click an element in Layers → Hide.</p>
      ) : (
        <ul className="flex flex-col gap-0.5">
          {nodes.map((id) => (
            <li key={`n:${id}`}>
              <button
                type="button"
                onClick={() => store?.showNode(id)}
                className="w-full truncate rounded px-2 py-1 text-left hover:bg-accent"
                title={`Show node ${id}`}
              >
                node · {id}
              </button>
            </li>
          ))}
          {edges.map((id) => (
            <li key={`e:${id}`}>
              <button
                type="button"
                onClick={() => store?.showEdge(id)}
                className="w-full truncate rounded px-2 py-1 text-left hover:bg-accent"
                title={`Show edge ${id}`}
              >
                edge · {id}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Right-docked TabbedPanel — the LayersPanelView is one tab; Hidden is another. */
function VisibilityTabbedPanel() {
  const canvas = useGraphCanvas();
  const tabs: TabConfig[] = [
    { value: 'layers', label: 'Layers', icon: Layers, content: <LayersPanelView canvas={canvas} /> },
    { value: 'hidden', label: 'Hidden', icon: EyeOff, content: <HiddenTab /> },
  ];
  return (
    <Panel position="right">
      <div className="h-full w-80 border-l border-border bg-popover">
        <TabbedPanel
          tabs={tabs}
          defaultTab="layers"
          className="flex h-full flex-col overflow-hidden"
          bodyClassName="min-h-0 flex-1 overflow-hidden"
        />
      </div>
    </Panel>
  );
}

const groupOf = (n: GraphNode): number => (n.data as { group?: number } | undefined)?.group ?? 0;

export const HideShowLayersPanel: Story = {
  render: () => {
    // Give every node/edge a `type` so the LayersPanelView groups them meaningfully.
    const data = {
      nodes: lesMiserables.nodes.map((n) => ({ ...n, type: `Group ${groupOf(n)}` })),
      edges: lesMiserables.edges.map((e) => ({ ...e, type: 'APPEARS_WITH' })),
    };
    return (
      <ThemeProvider>
        <GraphCanvasApp
          data={data}
          onReady={(c) => c?.showMessage('Right-click an element to Hide/Show · Layers / Hidden tabs on the right')}
          header={{ title: 'Visibility', right: <HideSelectedButton /> }}
        >
          <VisibilityTabbedPanel />
        </GraphCanvasApp>
      </ThemeProvider>
    );
  },
};
