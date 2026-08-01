/**
 * **Code Knowledge Graph — health badges** — Sourcegraph-Cody / Cursor /
 * Augment-style code intelligence overview, composed from `<GraphCanvasApp>`.
 * The same real `invanaCodeKg` graph its two siblings render (`DotsForce`,
 * `CompositeCards`), narrowed to the **file-level import DAG**: 242 source files
 * and the 590 `imports` between them, laid out by `<ElkLayout>` `layered`
 * (pointed at by `config.activeLayout`).
 *
 * Per-file test coverage and error counts ride along as node **badges** resolved
 * from each node's data, so the picture doubles as a code-health dashboard.
 * (Those two fields are the dataset's one synthetic pair — see
 * `InvanaCodeNodeProperties.coverage`.) Fills come from the analyser's eight
 * architectural clusters, so the badge colours read against a stable backdrop.
 *
 * The header's **direction** picker re-runs ELK through
 * `config.layouts.elk.direction`, and **Settings** docks
 * `<CanvasSettingsEditorPanel>` for the rest of the ELK params, the hover
 * emphasis, and every other registered surface.
 *
 * Exercises: `ElkLayout` (layered DAG), node `badges` resolved from per-item
 * data, 1-hop hover focal emphasis, shift+click multi-select, node dragging, and
 * a `MiniMapLayer` for navigation on larger codebases.
 */

import { useCallback, useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElkLayout, MiniMapLayer } from '@invana/canvas-react';
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
import type { GraphCanvas, GraphData, GraphNode, NodeBadge } from '@invana/graph';
import type { ElkDirection } from '@invana/graph-layout-elkjs';
import { invanaCodeKg, type InvanaCodeNodeProperties } from '@invana/graph-datasets/usecase-demos';
import { ThemeProvider } from '@invana/themes';
import { Map, Moon, Settings, Sun } from 'lucide-react';

const meta: Meta = { title: 'usecases/domains/code-kg/HealthBadges' };
export default meta;
type Story = StoryObj;

export const HealthBadgesStory: Story = {
  name: 'HealthBadges',
  render: function Render() {
    // Fill by the analyser's eight architectural clusters — the dataset's own
    // grouping, and the closest thing it has to "which package is this in".
    const CLUSTER_FILL: Record<string, number> = {
      'layer:graph-connectors': 0x2563eb, // blue
      'layer:modeller': 0x8b5cf6, // violet
      'layer:engine-domain': 0x10b981, // emerald
      'layer:engine-platform': 0x14b8a6, // teal
      'layer:studio-ui': 0xf59e0b, // amber
      'layer:studio-data': 0xec4899, // pink
      'layer:studio-types': 0xef4444, // red
      'layer:config': 0x64748b, // slate
    };
    const UNCLUSTERED_FILL = 0x94a3b8; // slate-400 — file in no cluster

    const [direction, setDirection] = useState<ElkDirection>('RIGHT');
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

    // The dataset is engine-ready; this only narrows it to the file-level import
    // DAG — `file` entities, and the `imports` between two of them. (Every
    // `imports` edge in the dataset is already file→file.)
    const data: GraphData = useMemo(() => {
      const files = new Set(invanaCodeKg.nodes.filter((n) => n.type === 'file').map((n) => n.id));
      return {
        nodes: invanaCodeKg.nodes.filter((n) => files.has(n.id)),
        edges: invanaCodeKg.edges.filter(
          (e) => e.type === 'imports' && files.has(e.source) && files.has(e.target),
        ),
      };
    }, []);

    const config: CanvasConfig = useMemo(
      () => ({
        // The ELK layout mounted as a child below owns the arrangement.
        activeLayout: 'elk',
        behaviours: {
          // Cluster colours come from the `bgFill` resolver below.
          color: { enabled: false },
          hover: { enabled: true, state: 'highlighted', inactiveState: 'dimmed', degree: 1, direction: 'both' },
          'click-select': { enabled: true, multiple: true, trigger: ['shift'] },
        },
        layers: {
          background: { type: 'pattern', patternType: 'dots', size: 1.2, spacing: 26, alpha: 0.7 },
          graph: {
            node: {
              style: {
                bgFill: (n: GraphNode) =>
                  CLUSTER_FILL[(n.data as InvanaCodeNodeProperties).cluster ?? ''] ?? UNCLUSTERED_FILL,
                labelText: (n: GraphNode) => (n.data as InvanaCodeNodeProperties).name,
                // Coverage colour bands at 80 % / 60 % follow the Codecov
                // convention; the errors badge only renders when there's
                // something to flag. Both fields are optional on the dataset —
                // a file with no coverage figure simply shows no coverage pill.
                badges: (n: GraphNode): readonly NodeBadge[] => {
                  const d = n.data as InvanaCodeNodeProperties;
                  const badges: NodeBadge[] = [];
                  if (d.coverage !== undefined) {
                    const coverageFill = d.coverage >= 80 ? 0x16a34a : d.coverage >= 60 ? 0xd97706 : 0xdc2626;
                    badges.push({
                      id: 'coverage',
                      placement: 'top-right',
                      origin: 'center',
                      shape: { kind: 'rect', width: 34, height: 16, cornerRadius: 8 },
                      fill: coverageFill,
                      strokeColor: 0xffffff,
                      strokeWidth: 1.5,
                      labelText: `${d.coverage}%`,
                      labelColor: 0xffffff,
                      labelFontSize: 10,
                    });
                  }
                  if ((d.errors ?? 0) > 0) {
                    badges.push({
                      id: 'errors',
                      placement: 'top-left',
                      origin: 'center',
                      shape: { kind: 'circle', radius: 9 },
                      fill: 0xdc2626,
                      strokeColor: 0xffffff,
                      strokeWidth: 1.5,
                      labelText: String(d.errors ?? 0),
                      labelColor: 0xffffff,
                      labelFontSize: 11,
                    });
                  }
                  return badges;
                },
                shape: { kind: 'rect', width: 168, height: 46, cornerRadius: 8 },
                bgStrokeColor: 0xffffff,
                bgStrokeWidth: 1.5,
                labelColor: 0xffffff,
                labelFontSize: 12,
                labelFontWeight: 600,
                labelPlacement: 'center',
              },
              state: {
                // Sharper highlight ring against the saturated cluster fills.
                highlighted: { bgStrokeColor: 0xfbbf24, bgStrokeWidth: 3 },
                selected: { bgStrokeColor: 0xffffff, bgStrokeWidth: 4 },
              },
            },
            edge: {
              style: {
                shape: { pathType: 'rounded', pathStyleOpts: { radius: 8 } },
                strokeColor: 0x94a3b8,
                strokeWidth: 1.3,
                strokeAlpha: 0.75,
                arrowTargetShape: 'triangle',
                arrowTargetSize: 8,
                arrowTargetColor: 0x94a3b8,
              },
              state: {
                highlighted: {
                  strokeColor: 0xfbbf24,
                  strokeWidth: 2,
                  strokeAlpha: 1,
                  arrowTargetColor: 0xfbbf24,
                },
              },
            },
          },
          minimap: { position: 'bottom-right', width: 220, height: 160 },
        },
        layouts: {
          elk: { algorithm: 'layered', direction, nodeSpacing: 28, layerSpacing: 90 },
        },
      }),
      // CLUSTER_FILL is a render-local literal the config closes over once.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [direction],
    );

    const onReady = useCallback((c: GraphCanvas | null) => {
      c?.showMessage('Badges show test coverage · red circle = open errors');
    }, []);

    return (
      <ThemeProvider>
        <GraphCanvasApp
          data={data}
          config={config}
          onReady={onReady}
          header={{
            title: 'Code Knowledge Graph',
            center: <GraphControlsToolbar />,
            right: (ctx) => (
              <ToolbarItems
                orientation="horizontal"
                items={[
                  {
                    type: 'select',
                    key: 'direction',
                    label: 'Direction',
                    value: direction,
                    options: { RIGHT: 'Right', DOWN: 'Down', LEFT: 'Left', UP: 'Up' },
                    onChange: (v) => setDirection(v as ElkDirection),
                  },
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
          {/* Registered as `elk`; `config.activeLayout` runs it once data is in,
              and re-runs it whenever the direction patch lands. */}
          <ElkLayout id="elk" targetLayerId="graph" fitPadding={80} />

          {minimapOn && <MiniMapLayer id="minimap" graphLayerId="graph" backgroundLayerId="background" />}
        </GraphCanvasApp>
      </ThemeProvider>
    );
  },
};
