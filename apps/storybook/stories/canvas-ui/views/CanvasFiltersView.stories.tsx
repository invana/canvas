/**
 * **Hide / show driven by a live UI panel.** The flagship demo of first-class
 * per-element + whole-layer visibility feeding React UI, over the **Wikipedia
 * data-viz cartography** (~2k pages / ~5.4k hyperlinks, precomputed ForceAtlas2
 * positions):
 *
 *   - a right-docked **`<CanvasFiltersView>`** — the reusable list of
 *     currently-hidden elements with per-item + "Show all" restore. The story
 *     **authors a few meaningful pages + links as `hidden: true`** (the graph
 *     tools *Gephi* · *Cytoscape* · *Graphviz*, the *Graph theory* field, and the
 *     *Information visualization → Data visualization* / *Social network analysis
 *     → Network science* links), so the view opens populated with recognisable
 *     data — click an item, or "Show all", to bring them back,
 *   - the full **`<GraphControlsToolbar>`** in the header (layout · zoom/fit ·
 *     **select-mode** · grid · …) so you can marquee/lasso-select, and
 *   - the standard **`<GraphContextMenu>`** — right-click any node/edge for
 *     Focus · Select · **Hide/Show**, zero config.
 *
 * The store honours the authored `hidden` flag while it ingests the data, so no
 * imperative `hideNodes` / `hideEdges` calls are needed. Both `CanvasFiltersView`
 * and `GraphContextMenu` recompute off the store's `node:visibility` /
 * `edge:visibility` stream — on change, not per render.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Rect } from '@invana/canvas';
import { GraphCanvasApp, GraphContextMenu, GraphControlsToolbar, CanvasFiltersView } from '@invana/canvas-ui';
import { wikipediaDataViz } from '@invana/graph-datasets/wikipedia-dataviz';
import { ThemeProvider } from '@invana/themes';

const meta: Meta = { title: 'canvas-ui/views/CanvasFiltersView' };
export default meta;
type Story = StoryObj;

// Meaningful elements to open hidden — recognisable data-viz pages (node ids are
// the page slugs, so they read cleanly in the CanvasFiltersView) and two links
// between well-known *visible* pages (so they list as explicitly hidden edges).
const HIDDEN_PAGES = new Set(['gephi', 'cytoscape', 'graphviz', 'graph theory']);
const HIDDEN_LINKS = new Set([
  'e2913', // Information visualization → Data visualization
  'e1554', // Social network analysis → Network science
]);

export const CanvasFiltersViewStory: Story = {
  name: 'CanvasFiltersView',
  render: () => {
    // Map the property graph → GraphNode/GraphEdge (label→type, properties→data),
    // pin each page at its precomputed ForceAtlas2 position, and flag the chosen
    // few as `hidden: true` — the store applies that flag as it ingests the data.
    const data = {
      nodes: wikipediaDataViz.nodes.map((n) => ({
        id: n.id,
        type: n.label,
        data: n.properties,
        position: { x: n.properties.x, y: n.properties.y },
        hidden: HIDDEN_PAGES.has(n.id),
      })),
      edges: wikipediaDataViz.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: e.label,
        hidden: HIDDEN_LINKS.has(e.id),
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
            c.showMessage('Right-click an element to Hide/Show · Filters panel on the right');
          }}
          // The full graph toolbar — the select-mode picker (click / brush / lasso)
          // lets you select before hiding via the right-click menu.
          header={{ title: 'CanvasFiltersView', center: <GraphControlsToolbar /> }}
          // Docked into the app's resizable `right` region — no floating Panel.
          // `content` is a render-fn handed the live control context, so the view
          // gets the engine straight from `ctx.canvas` (null until it's ready —
          // `CanvasFiltersView` handles that itself). No context-reading wrapper.
          right={{
            content: ({ canvas }) => <CanvasFiltersView canvas={canvas} />,
            defaultSize: '340px',
            maxSize: '460px',
            collapsible: true,
          }}
        >
          {/* Standard right-click menu (Focus · Select · Hide/Show) — a sibling of
              the bundle, resolved from the <Canvas> context. `nodeItems`/`edgeItems`
              receive `(ctx, defaults)`: spread `defaults` to keep the standard
              items and add your own around them. */}
          <GraphContextMenu
            nodeItems={(ctx, defaults) => [
              ...defaults,
              {
                id: 'inspect',
                label: `Inspect ${ctx.id}`,
                // eslint-disable-next-line no-alert
                onClick: () => window.alert(`Node ${ctx.id}\n${JSON.stringify(ctx.data)}`),
              },
            ]}
            edgeItems={(ctx, defaults) => [
              ...defaults,
              {
                id: 'log-edge',
                label: 'Log edge to console',
                onClick: () => console.log('edge', ctx.id, ctx.data),
              },
            ]}
          />
        </GraphCanvasApp>
      </ThemeProvider>
    );
  },
};
