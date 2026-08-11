/**
 * **Data Lineage (Sankey)** — dbt-docs / Atlan / Monte Carlo-style lineage flow,
 * composed from `<GraphCanvasApp>`. Volume-weighted ribbons trace data from raw
 * sources (left) through transforms (middle) to consumer marts / dashboards
 * (right). Hovering any node lights up the full upstream **and** downstream
 * lineage chain — `degree: 12` is comfortably deeper than the DAG — so a viewer
 * can trace where a record came from and where it ends up.
 *
 * The `<D3SankeyLayout>` is mounted as a child and pointed at by
 * `config.activeLayout`; it writes the node rects **and** the per-edge ribbon
 * hints, so the graph's own style config only supplies what the layout doesn't.
 * The header's **volume format** picker re-labels the ribbons (a data rebuild),
 * and **Settings** docks `<CanvasSettingsEditorPanel>` so `nodeWidth` /
 * `nodePadding` / `nodeAlign` are editable live.
 *
 * The synthetic dataset is `ukEnergyFlowAsGraph()` — its topology (raw sources →
 * carriers → end uses) matches a three-tier lineage diagram one-for-one. The
 * labels stay as the dataset's energy-flow names; the point is the mechanic, not
 * the domain.
 *
 * Exercises: `D3SankeyLayout`, `bump-horizontal` ribbons with stroke-width =
 * flow value, edge-port anchors (Sankey default), deep-chain hover emphasis.
 */

import { useCallback, useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { D3SankeyLayout } from '@invana/canvas-react';
import {
  CanvasMessageBar,
  CanvasSettingsEditorPanel,
  GraphCanvasApp,
  GraphControlsToolbar,
  GraphStatusBar,
  ToolbarItems,
  useSidePanels
} from '@invana/canvas-ui';
import type { CanvasConfig } from '@invana/canvas';
import type { GraphCanvas, GraphData } from '@invana/graph';
import { ukEnergyFlowAsGraph } from '@invana/graph-datasets';
import { ThemeProvider } from '@invana/themes';
import { Moon, Settings, Sun } from 'lucide-react';

const meta: Meta = { title: 'usecases/by-casestudies/data-lineage/SankeyLineage' };
export default meta;
type Story = StoryObj;

export const SankeyLineageStory: Story = {
  name: 'SankeyLineage',
  render: function Render() {
    const [volumeFormat, setVolumeFormat] = useState<'raw' | 'k' | 'M'>('k');

    const dock = useSidePanels(
      [
        {
          id: 'settings',
          icon: Settings,
          label: 'Settings',
          render: (canvas) => (
            <CanvasSettingsEditorPanel canvas={canvas} className="border-0 bg-transparent shadow-none" />
          )
        },
      ],
      { section: { defaultSize: '360px', maxSize: '460px' } },
    );

    // Per-item colour + label ride on the data's `style`: the ribbon hue follows
    // its **source** category, which a layer-template resolver can't see from an
    // edge alone. Rebuilt when the volume format changes.
    const data: GraphData = useMemo(() => {
      // 10-colour categorical palette (d3 schemeCategory10) — one hue per source
      // category, so ribbons sharing a source read as related.
      const palette = [
        0x1f77b4, 0xff7f0e, 0x2ca02c, 0xd62728, 0x9467bd, 0x8c564b, 0xe377c2, 0x7f7f7f, 0xbcbd22,
        0x17becf,
      ];
      const colorForCategory = (cat: string): number => {
        let h = 0;
        for (let i = 0; i < cat.length; i++) h = (h * 31 + cat.charCodeAt(i)) | 0;
        return palette[Math.abs(h) % palette.length]!;
      };
      const formatVolume = (v: number): string => {
        switch (volumeFormat) {
          case 'k':
            return `${v.toFixed(1)} TWh`;
          case 'M':
            return `${(v / 1000).toFixed(2)} TWh-K`;
          default:
            return `${Math.round(v)}`;
        }
      };

      const raw = ukEnergyFlowAsGraph();
      const categoryById = new Map(raw.nodes.map((n) => [n.id, n.data.category] as const));

      return {
        nodes: raw.nodes.map((n) => ({
          id: n.id,
          type: n.data.category,
          data: n.data,
          style: {
            bgFill: colorForCategory(n.data.category),
            labelText: n.data.name,
            labelPlacement: 'right' as const,
            labelOffsetX: 6
          }
        })),
        edges: raw.edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          type: 'FLOWS_TO',
          data: e.data,
          style: {
            strokeColor: colorForCategory(categoryById.get(e.source) ?? ''),
            strokeAlpha: 0.42,
            labelText: formatVolume(e.data.value)
          }
        }))
      };
    }, [volumeFormat]);

    const config: CanvasConfig = useMemo(
      () => ({
        // The sankey layout mounted as a child below owns the arrangement.
        activeLayout: 'sankey',
        behaviours: {
          // Category colours are stamped per item above.
          color: { enabled: false },
          hover: {
            enabled: true,
            state: 'highlighted',
            inactiveState: 'dimmed',
            // Walk the whole chain both ways — 12 is deeper than any path in
            // the demo dataset, so a hover lights the complete lineage.
            degree: 12,
            direction: 'both'
          },
          'click-select': { enabled: true, multiple: true, trigger: ['shift'] },
          // Sankey positions are the picture; dragging a node out of its column
          // would only break the ribbons.
          'drag-node': { enabled: false }
        },
        layers: {
          background: { type: 'solid' },
          graph: {
            node: {
              style: {
                // The layout writes each node's real `shape` (rect sized by
                // throughput); these defaults only show before it settles.
                shape: { kind: 'rect', width: 16, height: 28 },
                bgFill: 0x64748b,
                bgStrokeColor: 0xffffff,
                bgStrokeWidth: 1,
                labelFontSize: 11,
                labelFontWeight: 500
              },
              state: {
                highlighted: { bgStrokeColor: 0xfbbf24, bgStrokeWidth: 2.5 },
                dimmed: { bgAlpha: 0.2 },
                selected: { bgStrokeColor: 0x111827, bgStrokeWidth: 2.5 }
              }
            },
            edge: {
              style: {
                shape: { pathType: 'bump-horizontal' },
                strokeColor: 0x94a3b8,
                strokeAlpha: 0.35,
                arrowTargetShape: 'none',
                labelFontSize: 9,
                labelBackgroundAlpha: 0.85,
                labelBackgroundPadding: 2,
                labelBackgroundCornerRadius: 2,
                labelKeepUpright: true
              },
              state: {
                highlighted: { strokeColor: 0xfbbf24, strokeAlpha: 0.95 },
                dimmed: { strokeAlpha: 0.05 }
              }
            }
          }
        },
        layouts: {
          sankey: {
            size: [1200, 720],
            nodeWidth: 16,
            nodePadding: 12,
            iterations: 6,
            nodeAlign: 'justify'
          }
        }
      }),
      [],
    );

    const onReady = useCallback((c: GraphCanvas | null) => {
      c?.showMessage('Hover any node to light its full upstream + downstream lineage');
    }, []);

    return (
      <ThemeProvider>
        <GraphCanvasApp
          data={data}
          config={config}
          onReady={onReady}
          header={{
            title: 'Data Lineage',
            center: <GraphControlsToolbar />,
            right: (ctx) => (
              <ToolbarItems
                orientation="horizontal"
                items={[
                  {
                    type: 'select',
                    key: 'volume',
                    label: 'Volume',
                    value: volumeFormat,
                    options: { raw: 'Raw', k: 'TWh', M: 'TWh-K' },
                    onChange: (v) => setVolumeFormat(v as 'raw' | 'k' | 'M')
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
                    onToggle: ctx.toggleTheme
                  },
                ]}
              />
            )
          }}
          footer={{ left: <GraphStatusBar />, right: <CanvasMessageBar /> }}
          right={dock.region}
        >
          {/* Registered as `sankey`; `config.activeLayout` runs it once data is
              in, and again whenever the volume format rebuilds `data`. */}
          <D3SankeyLayout id="sankey" targetLayerId="graph" fitPadding={80} />
        </GraphCanvasApp>
      </ThemeProvider>
    );
  }
};
