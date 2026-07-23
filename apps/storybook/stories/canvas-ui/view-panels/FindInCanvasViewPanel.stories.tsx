/**
 * **Structured find-in-canvas.** A right-docked **`<FindInCanvasViewPanel>`** over
 * the **Wikipedia data-viz cartography** (~2k pages / ~5.4k hyperlinks, precomputed
 * ForceAtlas2 positions): build one or more field filters — **id** / **label** /
 * any **property** (`name`, `clusterLabel`, `url`, …), each `contains` or `equals`
 * — AND-combined, and get the matching nodes and edges as a live list. Click a
 * result to **focus + select** it (the camera frames the element and the app-wide
 * `ClickSelectBehaviour` selects it — the same mechanism as the context-menu
 * "Select"); it never hides or filters the canvas.
 *
 * The panel discovers its property-field options straight from the loaded data
 * (here `name` / `url` / `cluster` / `clusterLabel` / `score` on the pages), and
 * both the options and the results recompute off the store's topology/data stream.
 * Try `label` `equals` `Tool`, or `name` `contains` `gephi`, or flip the scope to
 * **Edges** and search the `links_to` ids.
 *
 * The store honours the pages' precomputed positions (mapped to `position`), so
 * `activeLayout: 'none'` no-ops the layout step and the cartography stands. The
 * standard **`<GraphContextMenu>`** (Focus · Select · Hide/Show) and the full
 * **`<GraphControlsToolbar>`** round out the app shell.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Rect } from '@invana/canvas';
import { GraphCanvasApp, GraphContextMenu, GraphControlsToolbar, FindInCanvasViewPanel } from '@invana/canvas-ui';
import { wikipediaDataViz } from '@invana/graph-datasets/wikipedia-dataviz';
import { ThemeProvider } from '@invana/themes';

const meta: Meta = { title: 'canvas-ui/view-panels/FindInCanvasViewPanel' };
export default meta;
type Story = StoryObj;

export const FindInCanvasViewPanelStory: Story = {
  name: 'FindInCanvasViewPanel',
  render: () => {
    // Map the property graph → GraphNode/GraphEdge (label→type, properties→data)
    // and pin each page at its precomputed ForceAtlas2 position. `data` carries
    // the searchable properties (name / url / cluster / clusterLabel / score),
    // which the panel surfaces as `prop:*` filter fields.
    const data = {
      nodes: wikipediaDataViz.nodes.map((n) => ({
        id: n.id,
        type: n.label,
        data: n.properties,
        position: { x: n.properties.x, y: n.properties.y },
      })),
      edges: wikipediaDataViz.edges.map((e) => ({
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
          // Positions ship with the data — `'none'` matches no registered layout,
          // so the engine's layout step no-ops on load and the cartography stands.
          config={{ activeLayout: 'none' }}
          onReady={(c) => {
            if (!c) return;
            // No layout runs, so nothing frames the camera — fit once the graph has
            // painted (retry next frame if the bounds aren't ready yet).
            const fit = (): boolean => {
              const b = (c.layers.get('graph') as { getBounds?(): Rect } | undefined)?.getBounds?.();
              if (b && b.width > 0 && b.height > 0) {
                c.camera.fitContent(b, 60);
                return true;
              }
              return false;
            };
            if (!fit()) requestAnimationFrame(() => void fit());
            c.showMessage('Build a filter on the right · click a match to focus & select it');
          }}
          header={{ title: 'FindInCanvasViewPanel', center: <GraphControlsToolbar /> }}
          // Docked into the app's resizable `right` region — no floating Panel.
          // `content` is a render-fn handed the live control context, so the view
          // gets the engine straight from `ctx.canvas` (null until it's ready —
          // `FindInCanvasViewPanel` handles that itself). No context-reading wrapper.
          right={{
            content: ({ canvas }) => <FindInCanvasViewPanel canvas={canvas} />,
            defaultSize: '360px',
            maxSize: '480px',
            collapsible: true,
          }}
        >
          {/* Standard right-click menu (Focus · Select · Hide/Show) — a sibling of
              the bundle, resolved from the <Canvas> context. */}
          <GraphContextMenu />
        </GraphCanvasApp>
      </ThemeProvider>
    );
  },
};
