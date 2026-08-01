/**
 * **Invana Code Knowledge Graph (elkjs, composite cards)** — the same real
 * code-intelligence graph of the Invana platform monorepo (602 source entities,
 * 1,329 typed relations, from the `understand-anything` static analyser), laid
 * out as a layered dependency DAG instead of a force cloud, and dressed in the
 * `<GraphCanvasApp>` shell.
 *
 * Every node renders as a **composite "card"** (the `kind: 'composite'` shape)
 * so the card itself surfaces the node's data — label, complexity, name,
 * summary, file path, line range. The card's accent bar + border colour follow
 * the active palette (entity **type** or the 8 architectural **clusters**), both
 * offered by the header's *Colour by* switch. `<ElkLayout>` is mounted as a
 * child (fed the real 300×165 card size through its `nodeSize` resolver) and run
 * via `config.activeLayout`; the header's **direction** picker re-runs it, the
 * **types** picker rebuilds `data`, and **Settings** docks
 * `<CanvasSettingsEditorPanel>` over the rest.
 *
 * Edges use the obstacle-aware `manhattan` router: the renderer collects every
 * card as an obstacle and A*-routes each edge through the lanes ELK reserved
 * (`edgeNodeSpacing`), recomputed on every re-route — so avoidance holds after
 * the layout moves nodes, with no per-edge waypoint step.
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
import type { GraphCanvas, GraphData, GraphNode, NodeShapeOptions } from '@invana/graph';
import type { ElkDirection } from '@invana/graph-layout-elkjs';
import {
  invanaCodeKg,
} from '@invana/graph-datasets/usecase-demos';
import { ThemeProvider } from '@invana/themes';
import { Map, Moon, Settings, Sun } from 'lucide-react';

/** The code-KG payload this story reads, declared where it's used. */
type InvanaCodeNodeLabel = 'file' | 'function' | 'class' | 'config' | 'document';
interface InvanaCodeNodeProperties {
  readonly name: string;
  readonly filePath: string;
  readonly summary: string;
  readonly tags: readonly string[];
  readonly complexity: 'simple' | 'moderate' | 'complex';
  readonly lineRange?: readonly [number, number];
  readonly cluster: string | null;
  readonly coverage?: number;
  readonly errors?: number;
}

const meta: Meta = { title: 'usecases/domains/code-kg/CompositeCards' };
export default meta;
type Story = StoryObj;

export const CompositeCardsStory: Story = {
  name: 'CompositeCards',
  render: function Render() {
    const ALL_LABELS: InvanaCodeNodeLabel[] = ['file', 'function', 'class', 'config', 'document'];

    // Card geometry — the "node definition": an outer rounded frame, a left
    // accent bar, a header divider, and six text blocks. ELK is fed these exact
    // dimensions so it reserves room per card instead of treating nodes as
    // points.
    const CARD = { w: 300, h: 165, pad: 18, radius: 14 };

    const [colorMode, setColorMode] = useState<'type' | 'cluster'>('type');
    const [labels, setLabels] = useState<ReadonlySet<InvanaCodeNodeLabel>>(() => new Set(ALL_LABELS));
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

    // `label → type`, `properties → data`, thinned to the picked entity types.
    // A new identity re-seeds the graph and re-runs ELK.
    const data: GraphData = useMemo(() => {
      const keep = invanaCodeKg.nodes.filter((n) => labels.has(n.type));
      const idSet = new Set(keep.map((n) => n.id));
      return {
        nodes: keep,
        edges: invanaCodeKg.edges
          .filter((e) => idSet.has(e.source) && idSet.has(e.target))
          .map((e) => e),
      };
    }, [labels]);

    const config: CanvasConfig = useMemo(() => {
      // Accent / border colour by node type / entity kind …
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
      const inner = CARD.w - CARD.pad * 2; // 264

      const props = (n: GraphNode): InvanaCodeNodeProperties => n.data as InvanaCodeNodeProperties;
      const accentOf = (n: GraphNode): number =>
        colorMode === 'type'
          ? LABEL_FILL[n.type as InvanaCodeNodeLabel]
          : (CLUSTER_FILL[props(n).cluster ?? ''] ?? UNCLUSTERED_FILL);

      return {
        // The ELK layout mounted as a child below owns the arrangement.
        activeLayout: 'elk',
        behaviours: {
          // The card carries its own colour — nothing else may repaint it.
          color: { enabled: false },
          hover: { enabled: true, state: 'highlighted', degree: 1, direction: 'both' },
          'click-select': { enabled: true, multiple: true, trigger: ['shift'] },
        },
        layers: {
          background: { type: 'pattern', patternType: 'dots', size: 1.2, spacing: 26, alpha: 0.7 },
          graph: {
            node: {
              style: {
                // The card IS the node visual — it carries its own fill/stroke
                // and surfaces the data, so there's no separate label here.
                // `bgFill` / `bgStrokeColor` stay unset: setting them would
                // override the card's own.
                shape: (n: GraphNode): NodeShapeOptions => {
                  const p = props(n);
                  const accent = accentOf(n);
                  return {
                    kind: 'composite',
                    width: CARD.w,
                    height: CARD.h,
                    cornerRadius: CARD.radius,
                    fill: 0x1f2937,
                    stroke: { color: accent, width: 2 },
                    parts: [
                      // left accent bar + header divider
                      { part: 'rect', x: 0, y: CARD.radius, width: 4, height: CARD.h - 2 * CARD.radius, fill: accent },
                      { part: 'line', x: CARD.pad, y: 46, x2: CARD.w - CARD.pad, y2: 46, stroke: { color: 0x374151, width: 1 } },
                      // top tags: entity kind (left) + complexity (right)
                      { part: 'label', x: CARD.pad, y: 16, text: (n.type as string) ?? '', fontSize: 10, fontWeight: 600, fontVariant: 'small-caps', fill: 0x94a3b8 },
                      { part: 'label', x: CARD.w - CARD.pad, y: 16, text: p.complexity, anchor: 'right', fontSize: 10, fontWeight: 600, fill: accent },
                      // heading (name) + description (summary)
                      { part: 'label', x: CARD.pad, y: 56, text: p.name, fontSize: 16, fontWeight: 700, fill: 0xf1f5f9, maxWidth: inner, maxLines: 1, overflow: 'ellipsis' },
                      { part: 'label', x: CARD.pad, y: 86, text: p.summary, fontSize: 12, fill: 0x94a3b8, lineHeight: 16, align: 'left', maxWidth: inner, maxLines: 2, overflow: 'ellipsis' },
                      // footer: file path (left) + line range (right)
                      { part: 'label', x: CARD.pad, y: CARD.h - 28, text: p.filePath, fontSize: 11, fontWeight: 500, fill: 0x64748b, maxWidth: inner - 64, maxLines: 1, overflow: 'ellipsis' },
                      { part: 'label', x: CARD.w - CARD.pad, y: CARD.h - 28, text: p.lineRange ? `L${p.lineRange[0]}–${p.lineRange[1]}` : '', anchor: 'right', fontSize: 11, fontWeight: 500, fill: 0x64748b },
                    ],
                  } as unknown as NodeShapeOptions;
                },
              },
              state: {
                // `bgStrokeColor` overrides the card's own border for the hover
                // / select ring; `dimmed` fades off-focus cards.
                highlighted: { bgStrokeColor: 0xfbbf24, bgStrokeWidth: 3 },
                selected: { bgStrokeColor: 0xffffff, bgStrokeWidth: 3 },
                dimmed: { bgAlpha: 0.25 },
              },
            },
            edge: {
              style: {
                shape: { pathType: 'manhattan' },
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
        },
        layouts: {
          elk: {
            algorithm: 'layered',
            direction,
            nodeSpacing: 28,
            layerSpacing: 90,
            // Reserve a lane between nodes and edges so the manhattan router
            // has clear channels — fewer edges forced over cards.
            edgeNodeSpacing: 24,
          },
        },
      };
      // CARD is a render-local literal the resolvers close over.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [colorMode, direction]);

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
            title: 'Invana Code KG — ELK cards',
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
                    key: 'direction',
                    label: 'Direction',
                    value: direction,
                    options: { RIGHT: 'Right', DOWN: 'Down', LEFT: 'Left', UP: 'Up' },
                    onChange: (v) => setDirection(v as ElkDirection),
                  },
                  {
                    type: 'select',
                    key: 'labels',
                    label: 'Types',
                    // One trigger toggling a single entity type at a time; a
                    // tick marks the ones in play.
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
          {/* `nodeSize` feeds ELK the real card dimensions, so it lays out
              around 300×165 rectangles rather than points. */}
          <ElkLayout
            id="elk"
            targetLayerId="graph"
            fitPadding={80}
            options={{ nodeSize: () => ({ width: CARD.w, height: CARD.h }) }}
          />

          {minimapOn && <MiniMapLayer id="minimap" graphLayerId="graph" backgroundLayerId="background" />}
        </GraphCanvasApp>
      </ThemeProvider>
    );
  },
};
