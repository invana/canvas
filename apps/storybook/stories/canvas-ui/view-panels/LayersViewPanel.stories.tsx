import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CanvasConfig } from '@invana/canvas';
import { DevInfoLayer, EdgeLODBehaviour, MiniMapLayer, type LayoutFactory } from '@invana/canvas-react';
import type { GraphCanvas, GraphData } from '@invana/graph';
import {
  CanvasMessageBar,
  GraphBackgroundContextMenu,
  GraphCanvasApp,
  GraphControlsToolbar,
  GraphNodeContextMenu,
  GraphStatusBar,
  LayersViewPanel,
  ToolbarItems,
  useSidePanels
} from '@invana/canvas-ui';
import { epicSaga } from '@invana/graph-datasets/epic-saga';
import { topicCartography } from '@invana/graph-datasets/topic-cartography';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { GeometricLayout } from '@invana/graph-layout-geometric';
import { ThemeProvider } from '@invana/themes';
import { Gauge, Layers, Map, Moon, Sun } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

/**
 * `canvas-ui/view-panels/LayersViewPanel` — the `@invana/canvas-ui` **LayersViewPanel**
 * docked into a `GraphCanvasApp`. It introspects the app's live scene — every
 * registered layer, and the Graph layer's painted nodes/edges grouped by type —
 * as a file-tree: toggle a layer's eye to hide/show it, right-click any element
 * for Focus · Select · Hide/Show. Toggle the dock with the header **Layers**
 * button.
 *
 * A **Dataset** dropdown after the title swaps which graph is loaded — the two
 * flagship demo datasets share one identical shell, so only the data and the
 * initial layout differ:
 * - **Topic cartography** (~2k pages / ~5.4k links) ships **precomputed
 *   ForceAtlas2 positions**, so it opens with no layout run.
 * - **Epic Saga** (~5k vertices / ~29k edges) has no positions, so it
 *   opens on a **grid** (the only layout that places this many nodes instantly).
 */
const meta: Meta = { title: 'canvas-ui/view-panels/LayersViewPanel' };
export default meta;
type Story = StoryObj;

// One shared layout picker for the header toolbar — grid first, so
// `applyInitialLayout` runs it on mount for the position-less dataset. Force is
// non-animated → runs to completion off-frame, then snaps (heavy at this scale,
// a deliberate user-clicked action).
const LAYOUTS: Record<string, LayoutFactory> = {
  grid: () => new GeometricLayout({ mode: 'grid', columnGap: 70, rowGap: 70 }),
  circular: () => new GeometricLayout({ mode: 'circular' }),
  'd3-force': () =>
    new D3ForceLayout({ charge: { strength: -80 }, link: { distance: 40 }, animate: false })
};
const LAYOUT_LABEL: Record<string, string> = { grid: 'Grid', circular: 'Circular', 'd3-force': 'Force' };

type DatasetId = 'wikipedia' | 'got';

interface DatasetDef {
  label: string;
  meta: { nodeCount: number; edgeCount: number };
  /** Load the dataset 1:1 with the property-graph → GraphNode/GraphEdge rename. */
  build: () => GraphData;
  /** Config override merged over the bundle defaults (the cartography pins positions). */
  config?: CanvasConfig;
  /** Run the first layout (grid) on mount — for the position-less dataset. */
  applyInitialLayout: boolean;
  /** Frame the camera after the first paint — for the precomputed-position dataset. */
  fitOnReady: boolean;
}

// The two datasets, each self-contained. Everything else in the story is shared.
const DATASETS: Record<DatasetId, DatasetDef> = {
  wikipedia: {
    label: 'Topic cartography',
    meta: topicCartography.meta,
    build: () => ({
      nodes: topicCartography.nodes.map((n) => ({
        ...n,
        position: { x: n.data.x, y: n.data.y }
      })),
      edges: topicCartography.edges
    }),
    // Precomputed ForceAtlas2 positions ship with the data — `'none'` matches no
    // registered layout, so the engine's layout step no-ops on load.
    config: { activeLayout: 'none' },
    applyInitialLayout: false,
    fitOnReady: true
  },
  got: {
    label: 'Epic Saga',
    meta: epicSaga.meta,
    build: () => ({
      nodes: epicSaga.nodes,
      edges: epicSaga.edges
    }),
    // No positions — grid places ~5k nodes instantly on mount.
    applyInitialLayout: true,
    fitOnReady: false
  }
};

export const LayersViewPanelStory: Story = {
  name: 'LayersViewPanel',
  render: function Render() {
    const [datasetId, setDatasetId] = useState<DatasetId>('wikipedia');
    const ds = DATASETS[datasetId];

    // The header toggle + docked region for the LayersViewPanel (self-wiring — it
    // reads the app context, so `render` ignores the passed canvas).
    const dock = useSidePanels(
      [{ id: 'layers', icon: Layers, label: 'Layers', render: () => <LayersViewPanel /> }],
      { defaultOpenId: 'layers', section: { defaultSize: '320px', maxSize: '460px' } },
    );

    // The minimap / dev-overlay are screen-fixed layers, so we drive them as plain
    // toolbar toggle *items* (not the turnkey `*ToggleButton`s): own the on-state
    // here and render the layer as a `GraphCanvasApp` child gated on it (below).
    const [minimapOn, setMinimapOn] = useState(true);
    const [devOn, setDevOn] = useState(false);

    // Build the graph once per dataset. The whole app is keyed on `datasetId`
    // below, so switching remounts a fresh engine with the new data + config.
    const data = useMemo(() => DATASETS[datasetId].build(), [datasetId]);

    // Memoised per dataset so toggling the panel (a re-render) doesn't re-fire it.
    const onReady = useCallback(
      (c: GraphCanvas | null) => {
        if (!c) return;
        const d = DATASETS[datasetId];
        c.showMessage(
          `Loaded ${d.label} — ${d.meta.nodeCount.toLocaleString()} nodes / ${d.meta.edgeCount.toLocaleString()} edges`,
        );
        // The precomputed-position dataset runs no layout, so nothing frames the
        // camera — `fitView` fits the union of world-layer bounds, one frame later
        // so the scene has flushed its bounds.
        if (d.fitOnReady) requestAnimationFrame(() => c.fitView(60));
      },
      [datasetId],
    );

    return (
      <ThemeProvider>
        <GraphCanvasApp
          key={datasetId}
          data={data}
          config={ds.config}
          onReady={onReady}
          header={{
            // Title + the dataset dropdown (a `select` ToolbarItem — its trigger
            // reads `Dataset: <current>`, so it doubles as the loaded-dataset
            // label). `left` renders immediately, so the switch is always live.
            left: (
              <>
                <span className="text-[13px] font-semibold whitespace-nowrap mr-3">LayersViewPanel</span>
                <ToolbarItems
                  orientation="horizontal"
                  items={[
                    {
                      type: 'select',
                      key: 'dataset',
                      label: 'Dataset',
                      value: datasetId,
                      options: { wikipedia: DATASETS.wikipedia.label, got: DATASETS.got.label },
                      onChange: (v) => setDatasetId(v as DatasetId)
                    },
                  ]}
                />
              </>
            ),
            center: (
              <GraphControlsToolbar
                layouts={LAYOUTS}
                layoutLabel={LAYOUT_LABEL}
                applyInitialLayout={ds.applyInitialLayout}
              />
            ),
            // One shared toolbar — Layers (from `useSidePanels`), the minimap /
            // dev-overlay layer toggles, and the theme toggle, all as `items`.
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
          // The star: the LayersViewPanel, docked into the app's resizable `right`
          // region, toggled by the header “Layers” button.
          right={dock.region}
        >
          {/* Screen-fixed overlays driven by the header toggle items above — they
              render correctly from anywhere under the canvas context, so they live
              here as GraphCanvasApp children, gated on their own state. */}
          {minimapOn && <MiniMapLayer backgroundLayerId="background" position="bottom-left" />}
          {devOn && <DevInfoLayer enabled corner="top-left" margin={{ x: 12, y: 48 }} />}

          {/* Edge zoom-LOD — below 0.5× thin the edges to the top 15% by degree
              (keep the backbone), so the zoomed-out hairball is cheap to draw. */}
          <EdgeLODBehaviour targetLayerId="graph" minZoom={0.5} keepFraction={0.15} keepBy="degree" />

          {/* Right-click menus. */}
          <GraphNodeContextMenu
            items={(ctx) => [
              { id: 'inspect', label: `Inspect ${ctx.id}`, onClick: () => window.alert(`Element ${ctx.id}`) },
            ]}
          />
          <GraphBackgroundContextMenu
            items={() => [
              {
                id: 'about',
                label: `${ds.label} — full graph`,
                onClick: () => window.alert(`${ds.label}: ${ds.meta.nodeCount} nodes / ${ds.meta.edgeCount} edges`)
              },
            ]}
          />
        </GraphCanvasApp>
      </ThemeProvider>
    );
  }
};
