/**
 * **`<LayersPanel>`** (`@invana/canvas-ui`) — a Photoshop-style canvas Layers
 * browser, docked in a `<GraphCanvasApp>`. It introspects the live engine and
 * renders:
 *
 *   - every **layer** (background · graph · minimap …), top layer first, each with
 *     a visibility **eye** (`layer.setVisible`),
 *   - the **Graph** layer expanded into its painted contents grouped by
 *     node/edge **type** with live counts (`User · N`, `POSTED · N`, …), each type
 *     expanding into individual elements with a "Show 15 more" pager,
 *   - a right-click **context menu** on any row — Focus · Select · **Hide/Show**
 *     (`store.setNodeHidden` / `setEdgeHidden`; hiding a node auto-hides its
 *     incident edges via the store's derived cascade).
 *
 * An engine-bound `views/` component from `@invana/canvas-ui` — drop it in a
 * `<Panel>` and hand it the live engine from `useGraphCanvas()`.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { GraphCanvasApp, Panel, useGraphCanvas } from '@invana/canvas-react';
import { LayersPanel } from '@invana/canvas-ui';
import { twitterActivity } from '@invana/graph-datasets';
import { ThemeProvider } from '@invana/themes';

const meta: Meta = { title: 'canvas-ui/views/LayersPanel' };
export default meta;
type Story = StoryObj;

/** Reads the live engine from context and docks the panel on the left rail. */
function LayersPanelDock() {
  const canvas = useGraphCanvas();
  return (
    <Panel position="left">
      <LayersPanel canvas={canvas} />
    </Panel>
  );
}

export const LayersPanelStory: Story = {
  name: 'LayersPanel',
  render: () => {
    // The property-graph dataset maps to `GraphNode` / `GraphEdge` at load time
    // (label → type, properties → data) — the LayersPanel then groups by `type`.
    const data = {
      nodes: twitterActivity.nodes.map((n) => ({ id: n.id, type: n.label, data: n.properties })),
      edges: twitterActivity.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: e.label,
      })),
    };
    return (
      <ThemeProvider>
        <GraphCanvasApp
          data={data}
          onReady={(c) => c?.showMessage('Toggle a layer eye · right-click a row to Hide/Show')}
          config={{ layouts: { 'graph-force': { charge: { strength: -180 }, link: { distance: 50 }, animate: false } } }}
          header={{ title: 'LayersPanel' }}
        >
          <LayersPanelDock />
        </GraphCanvasApp>
      </ThemeProvider>
    );
  },
};
