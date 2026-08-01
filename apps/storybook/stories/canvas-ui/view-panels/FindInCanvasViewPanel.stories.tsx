/**
 * **Structured find-in-canvas.** A right-docked **`<FindInCanvasViewPanel>`** over
 * the **Topic cartography cartography** (~2k pages / ~5.4k hyperlinks, precomputed
 * ForceAtlas2 positions): build a field filter — **id** / **label** / any
 * **property** (`name`, `clusterLabel`, `url`, …) with `contains` / `equals` /
 * numeric operators — and get the matching nodes and edges as a live list. Click a
 * result to **focus + select** it (the camera frames the element and the app-wide
 * `ClickSelectBehaviour` selects it); it never hides or filters the canvas.
 *
 * **One shared header toolbar** drives the side panels via `useSidePanels`: it
 * turns the panel descriptors into the toggle `items` (spread into a single
 * `<ToolbarItems>`, not a bar each) and the active panel's `region`. At most one
 * panel occupies the resizable `right` region at a time (activity-bar style) —
 * toggling one on swaps the dock, toggling it off drops the region so the canvas
 * reclaims the space.
 *
 * The find panel discovers its property-field options straight from the loaded
 * data (`name` / `url` / `cluster` / `clusterLabel` / `score`). Try `label`
 * `equals` `Tool`, or `name` `contains` `gephi`, or flip the scope to **Edges**.
 * The filters panel lists elements you've hidden (right-click → Hide).
 *
 * The store honours the pages' precomputed positions (mapped to `position`), so
 * `activeLayout: 'none'` no-ops the layout step and the cartography stands.
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
  FindInCanvasViewPanel,
  CanvasFiltersViewPanel,
  useSidePanels,
} from '@invana/canvas-ui';
import { topicCartography } from '@invana/graph-datasets/topic-cartography';
import { ThemeProvider } from '@invana/themes';
import { Filter, Gauge, Map, Moon, Search, Sun } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

const meta: Meta = { title: 'canvas-ui/view-panels/FindInCanvasViewPanel' };
export default meta;
type Story = StoryObj;

export const FindInCanvasViewPanelStory: Story = {
  name: 'FindInCanvasViewPanel',
  render: () => {
    // The shared activity-bar: descriptors → toggle `items` + the active `region`,
    // one panel docked at a time. `render` is handed the live engine.
    const dock = useSidePanels(
      [
        { id: 'filters', icon: Filter, label: 'Filters', render: (c) => <CanvasFiltersViewPanel canvas={c} /> },
        { id: 'find', icon: Search, label: 'Find', render: (c) => <FindInCanvasViewPanel canvas={c} /> },
      ],
      { defaultOpenId: 'find', section: { defaultSize: '360px', maxSize: '480px' } },
    );

    // Screen-fixed overlays driven as toolbar items (own their on-state; the
    // layers render as GraphCanvasApp children below, gated on it).
    const [minimapOn, setMinimapOn] = useState(true);
    const [devOn, setDevOn] = useState(false);

    // Pin each page at its precomputed ForceAtlas2 position; everything else
    // about the dataset is already engine-ready. Memoised so
    // toggling a panel (a re-render) keeps a stable identity and never reloads the
    // engine.
    const data = useMemo(
      () => ({
        nodes: topicCartography.nodes.map((n) => ({
          ...n,
          position: { x: n.data.x, y: n.data.y },
        })),
        edges: topicCartography.edges,
      }),
      [],
    );

    // Positions ship with the data — `'none'` no-ops the layout step so the
    // cartography stands. Memoised for the same stable-identity reason as `data`.
    const config = useMemo(() => ({ activeLayout: 'none' }), []);

    const onReady = useCallback((c: GraphCanvas | null) => {
      if (!c) return;
      // `fitView` frames the union of every world layer's bounds (no manual
      // getBounds) — the same fitter as the Fit button. One frame later so the
      // just-loaded scene has flushed its bounds. (The engine's own `fitOnLoad`
      // does exactly this, but our truthy `'none'` activeLayout keeps it from
      // arming — it waits for a layout run that never happens.)
      requestAnimationFrame(() => c.fitView(60));
      c.showMessage('Toggle Find / Filters from the header · right-click an element to Hide it');
    }, []);

    return (
      <ThemeProvider>
        <GraphCanvasApp
          data={data}
          config={config}
          onReady={onReady}
          header={{
            title: 'FindInCanvasViewPanel',
            center: <GraphControlsToolbar />,
            // One shared toolbar — the panel toggles plus minimap / dev-overlay /
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
                    onToggle: () => setMinimapOn((v) => !v),
                  },
                  {
                    type: 'toggle',
                    key: 'devinfo',
                    icon: Gauge,
                    label: 'Dev overlay: off',
                    activeLabel: 'Dev overlay: on',
                    active: devOn,
                    onToggle: () => setDevOn((v) => !v),
                  },
                  {
                    type: 'toggle',
                    key: 'theme',
                    icon: Sun,
                    activeIcon: Moon,
                    label: 'Switch to dark theme',
                    activeLabel: 'Switch to light theme',
                    active: ctx.themeKind === 'dark',
                    onToggle: ctx.toggleTheme,
                  },
                ]}
              />
            ),
          }}
          footer={{ left: <GraphStatusBar />, right: <CanvasMessageBar /> }}
          // The active panel docks into the app's resizable `right` region (or none).
          right={dock.region}
        >
          {/* Screen-fixed overlays driven by the header toggle items above. */}
          {minimapOn && <MiniMapLayer backgroundLayerId="background" position="bottom-left" />}
          {devOn && <DevInfoLayer enabled corner="top-left" margin={{ x: 12, y: 48 }} />}

          {/* Standard right-click menu (Focus · Select · Hide/Show) — Hide feeds
              the Filters panel. */}
          <GraphContextMenu />
        </GraphCanvasApp>
      </ThemeProvider>
    );
  },
};
