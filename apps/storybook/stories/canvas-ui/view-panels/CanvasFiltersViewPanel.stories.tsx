/**
 * **Hide / show driven by a live UI panel.** A header-toggled, right-docked
 * **`<CanvasFiltersViewPanel>`** — the reusable list of currently-hidden elements
 * with per-item + "Show all" restore — over the **Topic cartography cartography**
 * (~2k pages / ~5.4k hyperlinks, precomputed ForceAtlas2 positions).
 *
 * The story **authors a few meaningful pages + links as `hidden: true`** (the graph
 * tools *Gephi* · *Cytoscape* · *Graphviz*, the *Graph theory* field, and two links
 * between well-known pages), so the panel opens populated with recognisable data —
 * click an item, or "Show all", to bring them back. The full **`<GraphControlsToolbar>`**
 * (layout · zoom/fit · select-mode · grid) and the standard **`<GraphContextMenu>`**
 * (Focus · Select · Hide/Show) round out the shell; the store honours the authored
 * `hidden` flag as it ingests the data, so no imperative `hideNodes` calls are needed.
 *
 * Wiring follows the view-panel standard (see `FindInCanvasViewPanel.stories.tsx`):
 * `useSidePanels` drives the header toggle + the docked `region`, `data` / `config` /
 * `onReady` are memoised so a toggle never reloads the engine, and `canvas.fitView`
 * frames the precomputed-position graph.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { DevInfoLayer, MiniMapLayer } from '@invana/canvas-react';
import type { GraphCanvas } from '@invana/graph';
import {
  CanvasMessageBar,
  GraphCanvasApp,
  GraphContextMenu,
  GraphControlsToolbar,
  GraphStatusBar,
  ToolbarItems,
  CanvasFiltersViewPanel,
  useSidePanels
} from '@invana/canvas-ui';
import { topicCartography } from '@invana/graph-datasets/topic-cartography';
import { ThemeProvider } from '@invana/themes';
import { Filter, Gauge, Map, Moon, Sun } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

const meta: Meta = { title: 'canvas-ui/view-panels/CanvasFiltersViewPanel' };
export default meta;
type Story = StoryObj;

export const CanvasFiltersViewPanelStory: Story = {
  name: 'CanvasFiltersViewPanel',
  render: () => {
    // The header toggle + docked region for the filters panel.
    const dock = useSidePanels(
      [{ id: 'filters', icon: Filter, label: 'Filters', render: (c) => <CanvasFiltersViewPanel canvas={c} /> }],
      { defaultOpenId: 'filters', section: { defaultSize: '340px', maxSize: '460px' } },
    );

    // Screen-fixed overlays driven as toolbar items (own their on-state; the
    // layers render as GraphCanvasApp children below, gated on it).
    const [minimapOn, setMinimapOn] = useState(true);
    const [devOn, setDevOn] = useState(false);

    // Map the property graph → GraphNode/GraphEdge (label→type, properties→data),
    // pin each page at its precomputed ForceAtlas2 position, and flag a few
    // recognisable elements `hidden: true` — the store applies that flag as it
    // ingests the data, so the panel opens populated. Memoised so a panel toggle
    // (a re-render) never hands `GraphCanvasApp` a new object and reloads it.
    const data = useMemo(() => {
      const hiddenPages = new Set(['gephi', 'cytoscape', 'graphviz', 'graph theory']);
      const hiddenLinks = new Set(['e2913', 'e1554']); // Info-viz → Data-viz, SNA → Network science
      return {
        nodes: topicCartography.nodes.map((n) => ({
          ...n,
          position: { x: n.data.x, y: n.data.y },
          hidden: hiddenPages.has(n.id)
        })),
        edges: topicCartography.edges.map((e) => ({ ...e, hidden: hiddenLinks.has(e.id) }))
      };
    }, []);

    // Positions ship with the data — `'none'` no-ops the layout step so the
    // cartography stands. Memoised for the same stable-identity reason as `data`.
    const config = useMemo(() => ({ activeLayout: 'none' }), []);

    const onReady = useCallback((c: GraphCanvas | null) => {
      if (!c) return;
      // No layout runs, so nothing frames the camera — `fitView` fits the union of
      // world-layer bounds, one frame later so the scene has flushed its bounds.
      requestAnimationFrame(() => c.fitView(60));
      c.showMessage('Right-click an element to Hide/Show · Filters panel on the right');
    }, []);

    return (
      <ThemeProvider>
        <GraphCanvasApp
          data={data}
          config={config}
          onReady={onReady}
          // The select-mode picker (click / brush / lasso) lets you select before
          // hiding via the right-click menu.
          header={{
            title: 'CanvasFiltersViewPanel',
            center: <GraphControlsToolbar />,
            // One shared toolbar — the panel toggle plus minimap / dev-overlay /
            // theme, all as items.
            right: (ctx) => (
              <ToolbarItems
                orientation="horizontal"
                items={[
                  ...dock.items,
                  {
                    type: 'toggle',
                    key: 'minimap',
                    icon: Map,
                    label: 'Minimap: off',
                    activeLabel: 'Minimap: on',
                    active: minimapOn,
                    onToggle: () => setMinimapOn((v) => !v)
                  },
                  {
                    type: 'toggle',
                    key: 'devinfo',
                    icon: Gauge,
                    label: 'Dev overlay: off',
                    activeLabel: 'Dev overlay: on',
                    active: devOn,
                    onToggle: () => setDevOn((v) => !v)
                  },
                  {
                    type: 'toggle',
                    key: 'theme',
                    icon: Sun,
                    activeIcon: Moon,
                    label: 'Switch to dark theme',
                    activeLabel: 'Switch to light theme',
                    active: ctx.themeKind === 'dark',
                    onToggle: ctx.toggleTheme
                  },
                ]}
              />
            )
          }}
          footer={{ left: <GraphStatusBar />, right: <CanvasMessageBar /> }}
          right={dock.region}
        >
          {/* Screen-fixed overlays driven by the header toggle items above. */}
          {minimapOn && <MiniMapLayer backgroundLayerId="background" position="bottom-left" />}
          {devOn && <DevInfoLayer enabled corner="top-left" margin={{ x: 12, y: 48 }} />}

          {/* Standard right-click menu (Focus · Select · Hide/Show). `nodeItems` /
              `edgeItems` receive `(ctx, defaults)`: spread `defaults` to keep the
              standard items and add your own around them. */}
          <GraphContextMenu
            nodeItems={(ctx, defaults) => [
              ...defaults,
              {
                id: 'inspect',
                label: `Inspect ${ctx.id}`,
                onClick: () => window.alert(`Node ${ctx.id}\n${JSON.stringify(ctx.data)}`)
              },
            ]}
            edgeItems={(ctx, defaults) => [
              ...defaults,
              { id: 'log-edge', label: 'Log edge to console', onClick: () => console.log('edge', ctx.id, ctx.data) },
            ]}
          />
        </GraphCanvasApp>
      </ThemeProvider>
    );
  }
};
