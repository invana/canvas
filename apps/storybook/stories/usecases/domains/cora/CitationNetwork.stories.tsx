/**
 * **Cora citation network** — the canonical ML benchmark dataset, 2,708 papers
 * with 10,556 `CITES` edges, rendered as a force-directed graph with tiny dots
 * and translucent bezier ribbons. The dense overlay of low-alpha curves produces
 * the "watercolor" effect that lets the cluster topology read at a glance — the
 * same picture style as the Connected-Papers / Gephi force-atlas screenshots
 * people share for Cora.
 *
 * Composed from `<GraphCanvasApp>`: the bundle brings background · graph ·
 * d3-force · pan / zoom / drag / hover, and the story feeds it a subject-colour
 * resolver through `config`. Two header toggles sit beside the theme switch — a
 * **density overlay** (mount / unmount of `<DensityContourFillLayer>`, showing
 * where the citation hubs sit) and **Settings**, which docks
 * `<CanvasSettingsEditorPanel>` into the resizable right region so the force
 * params, the contour, and every behaviour are editable live.
 *
 * Exercises: `D3ForceLayout` on a real dataset at scale (~2.7k nodes, ~10k
 * edges), bezier edges with low alpha for the additive-blending look,
 * colour-by-subject resolver, optional density contour overlay.
 */

import { useCallback, useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DensityContourFillLayer } from '@invana/canvas-react';
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
import { cora, type CoraNodeData, type CoraSubject } from '@invana/graph-datasets/usecase-demos';
import { ThemeProvider } from '@invana/themes';
import { Layers, Moon, Settings, Sun } from 'lucide-react';

const meta: Meta = { title: 'usecases/domains/cora/CitationNetwork' };
export default meta;
type Story = StoryObj;

export const CitationNetwork: Story = {
  render: function Render() {
    // One colour per Cora subject — the story's own palette, so the bundle's
    // colour-by-type behaviour stays off in `config`.
    const SUBJECT_FILL: Record<CoraSubject, number> = {
      Neural_Networks: 0x2563eb, // blue
      Rule_Learning: 0xdc2626, // red
      Reinforcement_Learning: 0xf59e0b, // amber
      Probabilistic_Methods: 0x10b981, // emerald
      Theory: 0x8b5cf6, // violet
      Genetic_Algorithms: 0xec4899, // pink
      Case_Based: 0x14b8a6, // teal
    };
    // blue-500 — the single-colour "watercolor" tone the edges also use.
    const DEFAULT_FILL = 0x3b82f6;

    // The density overlay is a header toggle: mounting / unmounting the layer is
    // the declarative equivalent of flipping `layer.visible`.
    const [densityOn, setDensityOn] = useState(false);

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

    // Each paper's subject becomes its node type (a real category for the status
    // bar / inspector). Memoised so a header toggle never re-seeds the engine —
    // reloading 2.7k nodes on every re-render would be very visible here.
    const data: GraphData = useMemo(
      () => ({
        nodes: cora.nodes.map((n) => ({ ...n, type: (n.data as CoraNodeData).subject })),
        edges: cora.edges.map((e) => ({ ...e })),
      }),
      [],
    );

    const config: CanvasConfig = useMemo(
      () => ({
        behaviours: {
          // The subject palette is applied by the `bgFill` resolver below.
          color: { enabled: false },
          hover: {
            enabled: true,
            state: 'hovered',
            // No `inactiveState` on this dataset: dimming forces a per-hover walk
            // over all 2,708 nodes + 10,556 edges (one sync re-render each). The
            // highlighted neighbourhood reads fine against the watercolor
            // background without it.
            degree: 1,
            direction: 'both',
          },
        },
        layers: {
          graph: {
            node: {
              style: {
                bgFill: (n: GraphNode) => SUBJECT_FILL[(n.data as CoraNodeData).subject] ?? DEFAULT_FILL,
                shape: { kind: 'circle', radius: 10 },
                bgAlpha: 0.95,
                // No stroke at base scale — keeps the dots reading as pinpoints
                // rather than rings (matches the reference screenshot).
                bgStrokeWidth: 0,
              },
              state: {
                hovered: {
                  shape: { kind: 'circle', radius: 5 },
                  bgStrokeColor: 0xfbbf24,
                  bgStrokeWidth: 1.5,
                },
                dimmed: { bgAlpha: 0.15 },
              },
            },
            edge: {
              style: {
                // Low-tension bezier ribbons. The additive overlap of a few
                // thousand near-transparent curves is what produces the
                // watercolor / Gephi look — the path type itself doesn't bundle.
                shape: {
                  pathType: 'bezier',
                  sourceAnchor: 'boundary',
                  targetAnchor: 'boundary',
                  pathStyleOpts: { axis: 'h', tension: 0.5 },
                },
                strokeColor: DEFAULT_FILL,
                strokeWidth: 1,
                strokeAlpha: 0.6,
                arrowTargetShape: 'none',
              },
              state: {
                highlighted: { strokeColor: 0xfbbf24, strokeAlpha: 0.9, strokeWidth: 1.2 },
                dimmed: { strokeAlpha: 0.04 },
              },
            },
          },
        },
        layouts: {
          'graph-force': {
            // At this size per-tick writeback dominates the run cost.
            // `animate: false` skips intermediate renders and flushes positions
            // once on settle, so the user sees the finished picture appear
            // rather than watching a slow scatter.
            animate: false,
            link: {},
            charge: {},
            center: { x: 0, y: 0 },
          },
        },
      }),
      // SUBJECT_FILL / DEFAULT_FILL are render-local literals the config closes
      // over once.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [],
    );

    const onReady = useCallback((c: GraphCanvas | null) => {
      c?.showMessage(`${cora.nodes.length} papers · ${cora.edges.length} citations`);
    }, []);

    return (
      <ThemeProvider>
        <GraphCanvasApp
          data={data}
          config={config}
          onReady={onReady}
          header={{
            title: 'Cora Citation Network',
            center: <GraphControlsToolbar />,
            right: (ctx) => (
              <ToolbarItems
                orientation="horizontal"
                items={[
                  {
                    type: 'toggle',
                    key: 'density',
                    icon: Layers,
                    label: 'Density overlay: off',
                    activeLabel: 'Density overlay: on',
                    active: densityOn,
                    onToggle: () => setDensityOn((v) => !v),
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
          {/* Toggled from the header. It recomputes on every settled layout run,
              so the bands follow the nodes rather than their start positions. */}
          {densityOn && (
            <DensityContourFillLayer
              id="density"
              graphLayerId="graph"
              bandwidth={20}
              thresholds={10}
              cellSize={4}
              fillOpacity={0.4}
              padding={80}
              palette="blues"
            />
          )}
        </GraphCanvasApp>
      </ThemeProvider>
    );
  },
};
