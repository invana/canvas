/**
 * **Data Lineage (Sankey)** — dbt-docs / Atlan / Monte Carlo-style
 * lineage flow. Volume-weighted ribbons trace data from raw sources
 * (left) through transforms (middle) to consumer marts / dashboards
 * (right). Hovering any node lights up the full upstream + downstream
 * lineage chain so a viewer can trace where a record came from and
 * where it ends up.
 *
 * The synthetic underlying dataset is `ukEnergyFlowAsGraph()` — its
 * topology (raw sources → carriers → end uses) matches a typical
 * three-tier lineage diagram one-for-one, and a single dataset
 * shipping with the engine is enough to make the point. The labels
 * stay as the dataset's energy-flow names; the demo's point is the
 * mechanic, not the domain.
 *
 * Exercises: `D3SankeyLayout`, `bump-horizontal` ribbons with
 * stroke-width = flow value, edge-port anchors (Sankey default),
 * `HoverActivateBehaviour` with high `degree` for full-chain lineage
 * emphasis, volume-formatter GUI knob.
 */

import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  BackgroundLayer,
  Canvas,
  DragPanBehaviour,
  WheelZoomBehaviour,
} from '@invana/canvas';
import {
  ClickSelectBehaviour,
  GraphLayer,
  HoverActivateBehaviour,
  type EdgeData,
  type NodeData,
} from '@invana/graph';
import { D3SankeyLayout } from '@invana/graph-layout-d3-sankey';
import { ukEnergyFlowAsGraph } from '@invana/graph-datasets';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../div-util';

const meta: Meta = { title: 'Usecases/Data Lineage' };
export default meta;
type Story = StoryObj;

export const DataLineage: Story = {
  render: () => createContainer({ id: 'usecase-data-lineage' }),

  play: async ({ canvasElement }) => {
    // 10-colour categorical palette (d3 schemeCategory10) — assigns one
    // hue per source category so ribbons that share a source look
    // visually related at a glance.
    const palette = [
      0x1f77b4, 0xff7f0e, 0x2ca02c, 0xd62728, 0x9467bd,
      0x8c564b, 0xe377c2, 0x7f7f7f, 0xbcbd22, 0x17becf,
    ];

    const settings = {
      nodeWidth: 16,
      nodePadding: 12,
      volumeFormat: 'k' as 'raw' | 'k' | 'M',
      showEdgeLabels: true,
      hoverChainDepth: 12,
    };

    // ── Canvas setup ─────────────────────────────────────────────────────
    const container = canvasElement.querySelector<HTMLDivElement>('#usecase-data-lineage')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    canvas.layers.add(
      new BackgroundLayer({
        id: 'bg',
        options: {
          type: 'solid',
          mode: 'auto',
          color: { light: '#ffffff', dark: '#0b1220' },
        },
      }),
    );

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        node: {
          style: {
            // SankeyLayout writes per-node `shape: { kind: 'rect', width, height }`
            // and per-edge `shape: { pathType: 'bump-horizontal', anchors }`,
            // so these defaults are only used briefly before the layout
            // settles.
            shape: { kind: 'rect', width: settings.nodeWidth, height: 28 },
            bgFill: 0x64748b,
            bgStrokeColor: 0xffffff,
            bgStrokeWidth: 1,
            labelColor: 0x334155,
            labelFontSize: 11,
            labelFontWeight: 500,
          },
          state: {
            highlighted: { bgStrokeColor: 0xfbbf24, bgStrokeWidth: 2.5 },
            dimmed: { bgAlpha: 0.2 },
            selected: { bgStrokeColor: 0x111827, bgStrokeWidth: 2.5 },
          },
        },
        edge: {
          style: {
            shape: { pathType: 'bump-horizontal' },
            strokeColor: 0x94a3b8,
            strokeAlpha: 0.35,
            arrowTargetShape: 'none',
            labelColor: 0x475569,
            labelFontSize: 9,
            labelBackgroundFill: 0xffffff,
            labelBackgroundAlpha: 0.85,
            labelBackgroundPadding: 2,
            labelBackgroundCornerRadius: 2,
            labelKeepUpright: true,
          },
          state: {
            highlighted: { strokeColor: 0xfbbf24, strokeAlpha: 0.95 },
            dimmed: { strokeAlpha: 0.05 },
          },
        },
      },
    });
    canvas.layers.add(graph);

    // ── Behaviours ──────────────────────────────────────────────────────
    canvas.behaviours.register(
      new HoverActivateBehaviour({
        id: 'lineage-hover', layerId: 'graph', enabled: true,
        state: 'highlighted',
        inactiveState: 'dimmed',
        // Walk the whole chain in both directions — 12 is comfortably
        // larger than any DAG depth in the demo dataset.
        degree: settings.hoverChainDepth,
        direction: 'both',
      }),
    );
    canvas.behaviours.register(
      new ClickSelectBehaviour({
        id: 'select', layerId: 'graph', enabled: true,
        multiple: true, trigger: ['shift'],
      }),
    );

    // ── Project dataset + run Sankey ────────────────────────────────────
    let layout: D3SankeyLayout | null = null;

    const colorForCategory = (cat: string): number => {
      let h = 0;
      for (let i = 0; i < cat.length; i++) h = (h * 31 + cat.charCodeAt(i)) | 0;
      return palette[Math.abs(h) % palette.length]!;
    };

    const formatVolume = (v: number): string => {
      switch (settings.volumeFormat) {
        case 'k': return `${v.toFixed(1)} TWh`;
        case 'M': return `${(v / 1000).toFixed(2)} TWh-K`;
        default:  return `${Math.round(v)}`;
      }
    };

    const run = async (): Promise<void> => {
      layout?.stop();
      const raw = ukEnergyFlowAsGraph();

      // Per-node colour from category. Sankey writes layout-position +
      // shape size; we keep the rest of the style live.
      const nodes: NodeData<{ name: string; category: string }>[] = raw.nodes.map((n) => ({
        id: n.id,
        data: n.data,
        style: {
          bgFill: colorForCategory(n.data.category),
          labelText: n.data.name,
          labelPlacement: 'right',
          labelOffsetX: 6,
        },
      }));

      // Per-edge tint = source category colour; label = formatted volume.
      const sourceCategoryById = new Map(raw.nodes.map((n) => [n.id, n.data.category] as const));
      const edges: EdgeData<{ value: number }>[] = raw.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        data: e.data,
        style: {
          strokeColor: colorForCategory(sourceCategoryById.get(e.source) ?? ''),
          strokeAlpha: 0.42,
          ...(settings.showEdgeLabels ? { labelText: formatVolume(e.data.value) } : {}),
        },
      }));

      graph.setData({ nodes, edges });

      layout = new D3SankeyLayout({
        size: [1200, 720],
        nodeWidth: settings.nodeWidth,
        nodePadding: settings.nodePadding,
        iterations: 6,
        nodeAlign: 'justify',
      });
      await layout.apply(graph);
      canvas.camera.fitContent(graph.getBounds(), 80);
    };
    await run();
    onStoryTeardown(() => layout?.stop());

    // ── GUI ─────────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'Data Lineage' });
    onStoryTeardown(() => gui.destroy());

    const layoutFolder = gui.addFolder('Sankey layout');
    layoutFolder.add(settings, 'nodeWidth', 6, 40, 1).onFinishChange(() => void run());
    layoutFolder.add(settings, 'nodePadding', 2, 40, 1).onFinishChange(() => void run());

    const stylingFolder = gui.addFolder('Edge labels');
    stylingFolder.add(settings, 'showEdgeLabels').onChange(() => void run());
    stylingFolder
      .add(settings, 'volumeFormat', ['raw', 'k', 'M'])
      .name('volume format')
      .onChange(() => void run());

    // Re-relabel only the edges (re-derives labelText from `volumeFormat`
    // without rerunning the layout). Per the GraphStore docs,
    // `updateEdge({ style })` replaces wholesale, so we spread the prior
    // style first to preserve the Sankey-written `strokeWidth` and
    // `shape`.
    function reapplyEdgeLabels(): void {
      graph.store.batch(() => {
        for (const e of graph.store.edges()) {
          const prev = e.style ?? {};
          const value = (e.data as { value?: number } | undefined)?.value;
          graph.store.updateEdge(e.id, {
            style: {
              ...prev,
              ...(settings.showEdgeLabels && value !== undefined
                ? { labelText: formatVolume(value) }
                : { labelText: undefined }),
            },
          });
        }
      });
    }
    stylingFolder.add({ relabel: reapplyEdgeLabels }, 'relabel').name('Re-label edges only');

    gui
      .add({ refit: () => canvas.camera.fitContent(graph.getBounds(), 80) }, 'refit')
      .name('Re-fit camera');
  },
};
