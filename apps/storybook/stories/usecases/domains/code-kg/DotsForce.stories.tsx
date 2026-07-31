/**
 * **Invana Code Knowledge Graph (d3-force)** — a *real* code-intelligence graph
 * of the Invana platform monorepo (602 source entities, 1,329 typed relations),
 * produced by the `understand-anything` static analyser and shipped as
 * `invanaCodeKg` in `@invana/graph-datasets`. Files, functions, classes, configs
 * and docs are drawn as a force-directed cloud; `imports`, `contains`, `calls`,
 * `inherits`, … relations are the edges — the picture a Sourcegraph / CodeSee /
 * Gephi "repo map" shows, over an actual codebase rather than a synthetic one.
 *
 * Composed from `<GraphCanvasApp>`: the bundle's `graph-force` layout does the
 * work (`animate: false` — settle, then show), and the header adds a **colour
 * by** switch (entity *type* vs the 8 architectural **clusters** the analyser
 * found), a per-type **filter** that rebuilds `data` and re-runs the sim, a
 * minimap toggle, and **Settings** — `<CanvasSettingsEditorPanel>` docked in the
 * right region for the force params and every behaviour.
 *
 * Exercises: `D3ForceLayout` at real scale, field-level resolvers driving fill
 * and node radius (by complexity), `labelMinZoom` +
 * `<TextResolutionLODBehaviour>` to keep 602 labels legible *and* crisp, 1-hop
 * hover emphasis, shift+click multi-select, and a `MiniMapLayer`.
 */

import { useCallback, useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MiniMapLayer, TextResolutionLODBehaviour } from '@invana/canvas-react';
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
import type { GraphCanvas, GraphData, GraphNode, NodeShapeOptions } from '@invana/graph';
import {
  invanaCodeKg,
  type InvanaCodeComplexity,
  type InvanaCodeNodeLabel,
  type InvanaCodeNodeProperties,
} from '@invana/graph-datasets/usecase-demos';
import { ThemeProvider } from '@invana/themes';
import { Map, Moon, Settings, Sun } from 'lucide-react';

const meta: Meta = { title: 'usecases/domains/code-kg/DotsForce' };
export default meta;
type Story = StoryObj;

export const DotsForceStory: Story = {
  name: 'DotsForce',
  render: function Render() {
    const ALL_LABELS: InvanaCodeNodeLabel[] = ['file', 'function', 'class', 'config', 'document'];

    const [colorMode, setColorMode] = useState<'type' | 'cluster'>('type');
    const [labels, setLabels] = useState<ReadonlySet<InvanaCodeNodeLabel>>(() => new Set(ALL_LABELS));
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

    // Map the dataset's property-graph shape (`label → type`, `properties →
    // data`) and thin it to the picked entity types. A new identity re-seeds the
    // graph and re-runs the force sim, so a filter change re-lays-out.
    const data: GraphData = useMemo(() => {
      const keep = invanaCodeKg.nodes.filter((n) => labels.has(n.label));
      const idSet = new Set(keep.map((n) => n.id));
      return {
        nodes: keep.map((n) => ({ id: n.id, type: n.label, data: n.properties })),
        edges: invanaCodeKg.edges
          .filter((e) => idSet.has(e.source) && idSet.has(e.target))
          .map((e) => ({ id: e.id, source: e.source, target: e.target, type: e.label, data: e.properties })),
      };
    }, [labels]);

    const config: CanvasConfig = useMemo(() => {
      // Fill by node label / entity kind …
      const LABEL_FILL: Record<InvanaCodeNodeLabel, number> = {
        file: 0x3b82f6, // blue
        function: 0x10b981, // emerald
        class: 0x8b5cf6, // violet
        config: 0xf59e0b, // amber
        document: 0xec4899, // pink
      };
      // … or by the analyser's 8 architectural clusters (the source `layers`).
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
      const UNCLUSTERED_FILL = 0x94a3b8; // slate-400 — node in no cluster
      // Complex modules read larger.
      const COMPLEXITY_RADIUS: Record<InvanaCodeComplexity, number> = {
        simple: 4,
        moderate: 5.5,
        complex: 8,
      };
      const props = (n: GraphNode): InvanaCodeNodeProperties => n.data as InvanaCodeNodeProperties;

      return {
        behaviours: {
          // The resolvers below own node colour.
          color: { enabled: false },
          hover: { enabled: true, state: 'highlighted', degree: 1, direction: 'both' },
          'click-select': { enabled: true, multiple: true, trigger: ['shift'] },
          'label-lod': { enabled: true },
        },
        layers: {
          background: { type: 'pattern', patternType: 'dots', size: 1.2, spacing: 26, alpha: 0.7 },
          graph: {
            node: {
              style: {
                shape: (n: GraphNode): NodeShapeOptions => ({
                  kind: 'circle',
                  radius: COMPLEXITY_RADIUS[props(n).complexity],
                }),
                bgFill: (n: GraphNode) =>
                  colorMode === 'type'
                    ? LABEL_FILL[n.type as InvanaCodeNodeLabel]
                    : (CLUSTER_FILL[props(n).cluster ?? ''] ?? UNCLUSTERED_FILL),
                labelText: (n: GraphNode) => props(n).name,
                bgAlpha: 0.95,
                bgStrokeColor: 0xffffff,
                bgStrokeWidth: 1,
                labelColor: 0x64748b, // slate-500 — reads on both light + dark bg
                labelFontSize: 9,
                labelPlacement: 'bottom',
                labelOffsetY: 2,
                // 602 labels would smother the cloud at the fitted overview, so
                // they only switch on past 0.6× — a small zoom-in from the
                // fitted view.
                labelMinZoom: 0.6,
              },
              state: {
                highlighted: {
                  bgStrokeColor: 0xfbbf24,
                  bgStrokeWidth: 2.5,
                  // A hovered node is readable at any zoom.
                  labelForceShow: true,
                },
                selected: { bgStrokeColor: 0xffffff, bgStrokeWidth: 3 },
                dimmed: { bgAlpha: 0.12 },
              },
            },
            edge: {
              style: {
                shape: { pathType: 'straight' },
                strokeColor: 0x94a3b8,
                strokeWidth: 0.8,
                strokeAlpha: 0.22,
                arrowTargetShape: 'triangle',
                arrowTargetSize: 5,
                arrowTargetColor: 0x94a3b8,
              },
              state: {
                highlighted: {
                  strokeColor: 0xfbbf24,
                  strokeWidth: 1.6,
                  strokeAlpha: 0.95,
                  arrowTargetColor: 0xfbbf24,
                },
                dimmed: { strokeAlpha: 0.03 },
              },
            },
          },
          minimap: { position: 'bottom-right', width: 220, height: 160 },
          'label-lod': {
            levels: [
              { minZoom: 0, multiplier: 1 },
              { minZoom: 1.6, multiplier: 4 },
            ],
          },
        },
        layouts: {
          'graph-force': {
            // ~600 nodes / ~1.3k edges — skip intermediate renders and flush
            // once on settle, so the user sees the laid-out graph, not the
            // scatter.
            animate: false,
            link: { distance: 36 },
            charge: { strength: -90 },
            collide: { radius: 9 },
            center: { x: 0, y: 0 },
          },
        },
      };
    }, [colorMode]);

    const onReady = useCallback((c: GraphCanvas | null) => {
      c?.showMessage(
        `${invanaCodeKg.project.name} · ${invanaCodeKg.nodes.length} entities · ${invanaCodeKg.edges.length} relations`,
      );
    }, []);

    return (
      <ThemeProvider>
        <GraphCanvasApp
          data={data}
          config={config}
          onReady={onReady}
          header={{
            title: 'Invana Code KG — d3-force',
            center: <GraphControlsToolbar />,
            right: (ctx) => (
              <ToolbarItems
                orientation="horizontal"
                items={[
                  {
                    type: 'select',
                    key: 'color-mode',
                    label: 'Colour by',
                    value: colorMode,
                    options: { type: 'Entity type', cluster: 'Cluster' },
                    onChange: (v) => setColorMode(v as 'type' | 'cluster'),
                  },
                  {
                    type: 'select',
                    key: 'labels',
                    label: 'Types',
                    // One trigger toggling a single entity type at a time keeps
                    // the header compact; a tick marks the ones in play.
                    value: '',
                    options: Object.fromEntries(
                      ALL_LABELS.map((l) => [l, `${labels.has(l) ? '✓ ' : ''}${l}`]),
                    ),
                    triggerLabelOnly: true,
                    onChange: (l) =>
                      setLabels((prev) => {
                        const next = new Set(prev);
                        if (next.has(l as InvanaCodeNodeLabel)) next.delete(l as InvanaCodeNodeLabel);
                        else next.add(l as InvanaCodeNodeLabel);
                        return next;
                      }),
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
          {/* Labels appear at 0.6× (`labelMinZoom`); this re-rasters them at 4×
              once you pass 1.6× so the text you zoomed in to read stays crisp.
              It never hides / shows labels — only their texture resolution. */}
          <TextResolutionLODBehaviour id="label-lod" targetLayerId="graph" />

          {minimapOn && <MiniMapLayer id="minimap" graphLayerId="graph" backgroundLayerId="background" />}
        </GraphCanvasApp>
      </ThemeProvider>
    );
  },
};
