/**
 * **Hide / show driven by a live UI panel.** The flagship demo of first-class
 * per-element + whole-layer visibility feeding a React component:
 *
 *   - **`<LayersPanel>`** docked left — a Photoshop-style layers browser over the
 *     live `GraphCanvas`. Each layer row has a visibility eye (`layer.setVisible`);
 *     the Graph layer expands into its nodes/edges by type; right-click any
 *     element → Focus · Select · **Hide/Show** (`store.setNodeHidden` /
 *     `setEdgeHidden` — hiding a node auto-hides its incident edges via the
 *     store's derived cascade). The panel refreshes off the `node:visibility` /
 *     `edge:visibility` / `scene:layer:visibilitychange` events.
 *   - **Header "Hide selected"** — `useSelection()` → one `store.batch(...)` that
 *     hides the selected nodes + edges in a single flush → single paint.
 *   - **Footer hidden count + "Show all"** — a `useGraphEvent('node:visibility')`
 *     / `('edge:visibility')` consumer that recomputes on change, not per render.
 *
 * Everything past `data` is composition — no bespoke app props.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  GraphCanvasApp,
  Panel,
  useGraphCanvas,
  useGraphEvent,
  useSelection,
} from '@invana/canvas-react';
import { LayersPanel } from '@invana/canvas-ui';
import type { GraphLayer, GraphNode } from '@invana/graph';
import { lesMiserables } from '@invana/graph-datasets';
import { ThemeProvider } from '@invana/themes';
import { useState } from 'react';

const meta: Meta = { title: 'canvas-react/visibility/HideShowLayersPanel' };
export default meta;
type Story = StoryObj;

/** Docks the ported `LayersPanel` on the left, wired to the live engine. */
function LayersPanelDock() {
  const canvas = useGraphCanvas();
  return (
    <Panel position="left">
      <LayersPanel canvas={canvas} />
    </Panel>
  );
}

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

/** Footer — live hidden count (recomputed only on visibility change) + Show all. */
function HiddenStatus() {
  const canvas = useGraphCanvas();
  const [, bump] = useState(0);
  const read = () => {
    const s = canvas.layers.get<GraphLayer>('graph')?.store;
    return { nodes: s?.hiddenNodeCount() ?? 0, edges: s?.hiddenEdgeCount() ?? 0 };
  };
  // Recompute on change, not every render — the useGraphEvent hook subscribes to
  // the store's visibility stream and re-renders this component when it fires.
  useGraphEvent('node:visibility', () => bump((n) => n + 1));
  useGraphEvent('edge:visibility', () => bump((n) => n + 1));
  const { nodes, edges } = read();
  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      <span>
        Hidden: {nodes} node(s) · {edges} edge(s)
      </span>
      <button
        type="button"
        disabled={nodes + edges === 0}
        onClick={() => canvas.layers.get<GraphLayer>('graph')?.showAllHidden()}
        className="rounded border border-border px-2 py-0.5 disabled:opacity-40"
      >
        Show all
      </button>
    </div>
  );
}

const groupOf = (n: GraphNode): number => (n.data as { group?: number } | undefined)?.group ?? 0;

export const HideShowLayersPanel: Story = {
  render: () => {
    // Give every node/edge a `type` so the LayersPanel groups them meaningfully.
    const data = {
      nodes: lesMiserables.nodes.map((n) => ({ ...n, type: `Group ${groupOf(n)}` })),
      edges: lesMiserables.edges.map((e) => ({ ...e, type: 'APPEARS_WITH' })),
    };
    return (
      <ThemeProvider>
        <GraphCanvasApp
          data={data}
          onReady={(c) => c?.showMessage('Right-click an element to Hide/Show · toggle a layer eye')}
          header={{ title: 'Visibility', right: <HideSelectedButton /> }}
          footer={{ left: <HiddenStatus /> }}
        >
          <LayersPanelDock />
        </GraphCanvasApp>
      </ThemeProvider>
    );
  },
};
