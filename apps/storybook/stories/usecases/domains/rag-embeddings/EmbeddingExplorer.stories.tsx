/**
 * **RAG Embedding Explorer** — vector-DB topology view in the style of
 * Pinecone / Weaviate / LangSmith's embedding explorer, composed from
 * `<GraphCanvasApp>`. ~400 synthetic 2D-projected chunks land on the canvas; a
 * `<DensityContourFillLayer>` paints the cluster topology beneath them; hover
 * reveals the chunk text; the header's select-mode picker arms the **lasso** so
 * a sub-cluster can be pulled into a selection set.
 *
 * The chunks ship their own coordinates, so `activeLayout: 'none'` no-ops the
 * layout step and the projection stands as authored — the camera frames it once
 * via `canvas.fitView(...)`. Density params, hover, and the select behaviours
 * are all editable live from the header's **Settings** toggle, which docks
 * `<CanvasSettingsEditorPanel>` into the app's right region.
 *
 * Exercises: `DensityContourFillLayer` + `GraphLayer` composition,
 * pre-positioned data (no layout pass), hover-driven label reveal, lasso
 * select, `MiniMapLayer`.
 */

import { useCallback, useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DensityContourFillLayer, MiniMapLayer } from '@invana/canvas-react';
import {
  CanvasMessageBar,
  CanvasSettingsEditorPanel,
  GraphCanvasApp,
  GraphControlsToolbar,
  GraphStatusBar,
  ToolbarItems,
  useSidePanels,
} from '@invana/canvas-ui';
import type { CanvasConfig } from '@invana/canvas';
import type { GraphCanvas, GraphData, GraphNode } from '@invana/graph';
import {
  ragEmbeddings,
  type RagEmbeddingsCluster,
  type RagEmbeddingsNodeData,
} from '@invana/graph-datasets/usecase-demos';
import { ThemeProvider } from '@invana/themes';
import { Map, Moon, Settings, Sun } from 'lucide-react';

const meta: Meta = { title: 'usecases/domains/rag-embeddings/EmbeddingExplorer' };
export default meta;
type Story = StoryObj;

export const EmbeddingExplorer: Story = {
  render: function Render() {
    // One colour per source cluster — the story's own palette, so the bundle's
    // colour-by-type behaviour stays off in `config`.
    const CLUSTER_FILL: Record<RagEmbeddingsCluster, number> = {
      auth: 0x6366f1, // indigo
      billing: 0x10b981, // emerald
      search: 0xf59e0b, // amber
      infra: 0xf43f5e, // rose
      ml: 0x8b5cf6, // violet
    };

    /** Clip a chunk snippet for the resting label (hover shows the full text). */
    const truncate = (s: string, n: number): string => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

    const [minimapOn, setMinimapOn] = useState(true);

    const dock = useSidePanels(
      [
        {
          id: 'settings',
          icon: Settings,
          label: 'Settings',
          render: (canvas) => (
            <CanvasSettingsEditorPanel canvas={canvas} className="border-0 bg-transparent shadow-none" />
          ),
        },
      ],
      { section: { defaultSize: '360px', maxSize: '460px' } },
    );

    // Pre-projected chunks — each carries its own `position`, and the cluster
    // becomes the node type. Memoised so a header toggle never re-seeds the
    // engine (which would also drop the authored positions' framing).
    const data: GraphData = useMemo(
      () => ({
        nodes: ragEmbeddings.nodes.map((p) => ({
          id: p.id,
          type: p.data.cluster,
          position: p.position,
          data: p.data,
        })),
        edges: [],
      }),
      [],
    );

    const config: CanvasConfig = useMemo(
      () => ({
        // The projection *is* the layout — no force run.
        activeLayout: 'none',
        behaviours: {
          // Cluster colours come from the `bgFill` resolver below.
          color: { enabled: false },
          // Single-node hover, no neighbour expansion — there are no edges.
          hover: { enabled: true, state: 'hovered', degree: 0 },
          'click-select': { enabled: true, multiple: true, trigger: ['shift'], clearOnBackground: true },
          // Armed from the header's select-mode picker; hands its picked ids to
          // the click-select behaviour by sharing the `selected` state name.
          'lasso-select': { enabled: false, clickSelectId: 'click-select', immediately: false },
        },
        layers: {
          graph: {
            node: {
              style: {
                bgFill: (n: GraphNode) => CLUSTER_FILL[(n.data as RagEmbeddingsNodeData).cluster],
                labelText: (n: GraphNode) => truncate((n.data as RagEmbeddingsNodeData).text, 36),
                shape: { kind: 'circle', radius: 4 },
                bgAlpha: 0.95,
                bgStrokeColor: 0x0b1220,
                bgStrokeWidth: 0.5,
                labelFontSize: 10,
                labelPlacement: 'bottom',
                labelOffsetY: 4,
                labelBackgroundAlpha: 0.8,
                labelBackgroundPadding: 3,
                labelBackgroundCornerRadius: 3,
                // Labels stay hidden until the viewer zooms in; the hover /
                // selected states force them on regardless.
                labelMinZoom: 1.5,
              },
              state: {
                hovered: {
                  shape: { kind: 'circle', radius: 6 },
                  bgStrokeColor: 0xfbbf24,
                  bgStrokeWidth: 1.5,
                  // Hover swaps the clipped snippet for the whole chunk.
                  labelText: (n: GraphNode) => (n.data as RagEmbeddingsNodeData).text,
                  labelFontSize: 11,
                  labelForceShow: true,
                },
                selected: {
                  shape: { kind: 'circle', radius: 5 },
                  bgStrokeColor: 0xffffff,
                  bgStrokeWidth: 1.5,
                  labelForceShow: true,
                },
                dimmed: { bgAlpha: 0.15 },
              },
            },
          },
          minimap: { position: 'bottom-right', width: 220, height: 160 },
        },
      }),
      // CLUSTER_FILL / truncate are render-local; the config closes over them once.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [],
    );

    const onReady = useCallback((c: GraphCanvas | null) => {
      if (!c) return;
      // `fitView` frames the union of every world layer's bounds — the same
      // fitter as the Fit button. One frame later, so the just-loaded scene has
      // flushed its bounds. (The engine's `fitOnLoad` waits on a layout run,
      // and our truthy `'none'` activeLayout means none ever happens.)
      requestAnimationFrame(() => c.fitView(80));
      c.showMessage('Hover a chunk for its text · pick Lasso in the header to grab a cluster');
    }, []);

    return (
      <ThemeProvider>
        <GraphCanvasApp
          data={data}
          config={config}
          onReady={onReady}
          header={{
            title: 'RAG Embedding Explorer',
            center: <GraphControlsToolbar />,
            right: (ctx) => (
              <ToolbarItems
                orientation="horizontal"
                items={[
                  {
                    type: 'toggle',
                    key: 'minimap',
                    icon: Map,
                    label: 'Minimap: off',
                    activeLabel: 'Minimap: on',
                    active: minimapOn,
                    onToggle: () => setMinimapOn((v) => !v),
                  },
                  ...dock.items,
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
          right={dock.region}
        >
          {/* Under the points (`zIndex: -1` by default). Nothing moves the nodes
              here, so it paints once off the authored positions. */}
          <DensityContourFillLayer
            id="density"
            graphLayerId="graph"
            bandwidth={32}
            thresholds={12}
            cellSize={4}
            fillOpacity={0.45}
            padding={80}
            palette="magma"
          />

          {minimapOn && <MiniMapLayer id="minimap" graphLayerId="graph" backgroundLayerId="background" />}
        </GraphCanvasApp>
      </ThemeProvider>
    );
  },
};
