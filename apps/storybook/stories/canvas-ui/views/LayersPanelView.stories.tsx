import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CanvasConfig, Rect } from '@invana/canvas';
import { EdgeLODBehaviour, type LayoutFactory } from '@invana/canvas-react';
import type { GraphData } from '@invana/graph';
import {
  CanvasMessageBar,
  DevInfoToggleButton,
  GraphBackgroundContextMenu,
  GraphCanvasApp,
  GraphControlsToolbar,
  GraphNodeContextMenu,
  GraphStatusBar,
  LayersPanelView,
  MiniMapToggleButton,
  ThemeToggle,
  ToolbarItems,
} from '@invana/canvas-ui';
import { gameOfThrones } from '@invana/graph-datasets/game-of-thrones';
import { wikipediaDataViz } from '@invana/graph-datasets/wikipedia-dataviz';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { GeometricLayout } from '@invana/graph-layout-geometric';
import { ThemeProvider } from '@invana/themes';
import { Layers } from 'lucide-react';
import { useMemo, useState } from 'react';

/**
 * `canvas-ui/views/LayersPanelView` — the `@invana/canvas-ui` **LayersPanelView**
 * docked into a `GraphCanvasApp`. It introspects the app's live scene — every
 * registered layer, and the Graph layer's painted nodes/edges grouped by type —
 * as a file-tree: toggle a layer's eye to hide/show it, right-click any element
 * for Focus · Select · Hide/Show. Toggle the dock with the header **Layers**
 * button.
 *
 * A **Dataset** dropdown after the title swaps which graph is loaded — the two
 * flagship demo datasets share one identical shell, so only the data and the
 * initial layout differ:
 * - **Wikipedia data-viz** (~2k pages / ~5.4k links) ships **precomputed
 *   ForceAtlas2 positions**, so it opens with no layout run.
 * - **Game of Thrones** (~5k vertices / ~29k edges) has no positions, so it
 *   opens on a **grid** (the only layout that places this many nodes instantly).
 */
const meta: Meta = { title: 'canvas-ui/views/LayersPanelView' };
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
    new D3ForceLayout({ charge: { strength: -80 }, link: { distance: 40 }, animate: false }),
};
const LAYOUT_LABEL: Record<string, string> = { grid: 'Grid', circular: 'Circular', 'd3-force': 'Force' };

type DatasetId = 'wikipedia' | 'got';

interface DatasetDef {
  label: string;
  meta: { nodeCount: number; edgeCount: number };
  /** Load the dataset 1:1 with the property-graph → GraphNode/GraphEdge rename. */
  build: () => GraphData;
  /** Config override merged over the bundle defaults (Wikipedia pins positions). */
  config?: CanvasConfig;
  /** Run the first layout (grid) on mount — for the position-less dataset. */
  applyInitialLayout: boolean;
  /** Frame the camera after the first paint — for the precomputed-position dataset. */
  fitOnReady: boolean;
}

// The two datasets, each self-contained. Everything else in the story is shared.
const DATASETS: Record<DatasetId, DatasetDef> = {
  wikipedia: {
    label: 'Wikipedia data-viz',
    meta: wikipediaDataViz.meta,
    build: () => ({
      nodes: wikipediaDataViz.nodes.map((n) => ({
        id: n.id,
        type: n.label,
        data: n.properties,
        position: { x: n.properties.x, y: n.properties.y },
      })),
      edges: wikipediaDataViz.edges.map((e) => ({ id: e.id, source: e.source, target: e.target, type: e.label })),
    }),
    // Precomputed ForceAtlas2 positions ship with the data — `'none'` matches no
    // registered layout, so the engine's layout step no-ops on load.
    config: { activeLayout: 'none' },
    applyInitialLayout: false,
    fitOnReady: true,
  },
  got: {
    label: 'Game of Thrones',
    meta: gameOfThrones.meta,
    build: () => ({
      nodes: gameOfThrones.nodes.map((n) => ({ id: n.id, type: n.label, data: n.properties })),
      edges: gameOfThrones.edges.map((e) => ({ id: e.id, source: e.source, target: e.target, type: e.label })),
    }),
    // No positions — grid places ~5k nodes instantly on mount.
    applyInitialLayout: true,
    fitOnReady: false,
  },
};

export const LayersPanel: Story = {
  name: 'LayersPanelView',
  render: function Render() {
    const [datasetId, setDatasetId] = useState<DatasetId>('wikipedia');
    const [layersOpen, setLayersOpen] = useState(true);
    const ds = DATASETS[datasetId];

    // Build the graph once per dataset. The whole app is keyed on `datasetId`
    // below, so switching remounts a fresh engine with the new data + config.
    const data = useMemo(() => DATASETS[datasetId].build(), [datasetId]);

    return (
      <ThemeProvider>
        <GraphCanvasApp
          key={datasetId}
          data={data}
          config={ds.config}
          onReady={(c) => {
            if (!c) return;
            c.showMessage(
              `Loaded ${ds.label} — ${ds.meta.nodeCount.toLocaleString()} nodes / ${ds.meta.edgeCount.toLocaleString()} edges`,
            );
            // The precomputed-position dataset runs no layout, so nothing frames
            // the camera — fit once the graph has painted (retry next frame if the
            // bounds aren't ready yet).
            if (ds.fitOnReady) {
              const fit = (): boolean => {
                const b = (c.layers.get('graph') as { getBounds?(): Rect } | undefined)?.getBounds?.();
                if (b && b.width > 0 && b.height > 0) {
                  c.camera.fitContent(b, 60);
                  return true;
                }
                return false;
              };
              if (!fit()) requestAnimationFrame(() => void fit());
            }
          }}
          header={{
            // Title + the dataset dropdown (a `select` ToolbarItem — its trigger
            // reads `Dataset: <current>`, so it doubles as the loaded-dataset
            // label). `left` renders immediately, so the switch is always live.
            left: (
              <>
                <span className="text-[13px] font-semibold whitespace-nowrap mr-3">LayersPanelView</span>
                <ToolbarItems
                  orientation="horizontal"
                  items={[
                    {
                      type: 'select',
                      key: 'dataset',
                      label: 'Dataset',
                      value: datasetId,
                      options: { wikipedia: DATASETS.wikipedia.label, got: DATASETS.got.label },
                      onChange: (v) => setDatasetId(v as DatasetId),
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
            right: (ctx) => (
              <>
                <ToolbarItems
                  orientation="horizontal"
                  items={[
                    {
                      type: 'toggle',
                      key: 'layers',
                      icon: Layers,
                      label: 'Layers: hidden',
                      activeLabel: 'Layers: shown',
                      active: layersOpen,
                      onToggle: () => setLayersOpen((o) => !o),
                    },
                  ]}
                />
                <MiniMapToggleButton backgroundLayerId="background" position="bottom-left" />
                <DevInfoToggleButton corner="top-left" margin={{ x: 12, y: 48 }} />
                <ThemeToggle ctx={ctx} />
              </>
            ),
          }}
          footer={{ left: <GraphStatusBar />, right: <CanvasMessageBar /> }}
          // The star: the LayersPanelView, docked into the app's resizable `right`
          // region, toggled by the header “Layers” button.
          right={
            layersOpen
              ? { content: <LayersPanelView />, defaultSize: '320px', maxSize: '460px', collapsible: true }
              : undefined
          }
        >
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
                onClick: () => window.alert(`${ds.label}: ${ds.meta.nodeCount} nodes / ${ds.meta.edgeCount} edges`),
              },
            ]}
          />
        </GraphCanvasApp>
      </ThemeProvider>
    );
  },
};
