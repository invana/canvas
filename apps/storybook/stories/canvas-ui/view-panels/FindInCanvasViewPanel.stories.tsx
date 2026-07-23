/**
 * **Structured find-in-canvas.** A right-docked **`<FindInCanvasViewPanel>`** over
 * the **Wikipedia data-viz cartography** (~2k pages / ~5.4k hyperlinks, precomputed
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
import type { GraphCanvas } from '@invana/graph';
import {
  GraphCanvasApp,
  GraphContextMenu,
  GraphControlsToolbar,
  ToolbarItems,
  FindInCanvasViewPanel,
  CanvasFiltersViewPanel,
  useSidePanels,
} from '@invana/canvas-ui';
import { wikipediaDataViz } from '@invana/graph-datasets/wikipedia-dataviz';
import { ThemeProvider } from '@invana/themes';
import { Filter, Search } from 'lucide-react';
import { useCallback, useMemo } from 'react';

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

    // Map the property graph → GraphNode/GraphEdge (label→type, properties→data)
    // and pin each page at its precomputed ForceAtlas2 position. Memoised so
    // toggling a panel (a re-render) keeps a stable identity and never reloads the
    // engine.
    const data = useMemo(
      () => ({
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
            // One shared toolbar — both panel toggles as items, not a bar each.
            right: <ToolbarItems orientation="horizontal" items={dock.items} />,
          }}
          // The active panel docks into the app's resizable `right` region (or none).
          right={dock.region}
        >
          {/* Standard right-click menu (Focus · Select · Hide/Show) — Hide feeds
              the Filters panel. */}
          <GraphContextMenu />
        </GraphCanvasApp>
      </ThemeProvider>
    );
  },
};
