import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  BackgroundLayer,
  DevInfoLayer,
  DragPanBehaviour,
  WheelZoomBehaviour,
} from '@invana/canvas';
import { GraphCanvas, GraphLayer } from '@invana/graph';
import type { ShapeLabelStyle } from '@invana/canvas';
import { D3SankeyLayout } from '@invana/graph-layout-d3-sankey';
import type { D3SankeyLayoutOptions } from '@invana/graph-layout-d3-sankey';
import { ukEnergyFlowAsGraph } from '@invana/graph-datasets';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';
import { SystemThemeBehaviour } from '../../../system-theme';

const meta: Meta = { title: 'canvas/graph-layouts/d3-sankey/Sankey' };
export default meta;
type Story = StoryObj;

/**
 * Port of https://observablehq.com/@d3/sankey-component over the canonical
 * UK 2050 energy-flow dataset (48 nodes, 68 links, 840 TWh of flow). Nodes
 * are coloured by the first word of their name (d3 example's grouping);
 * each ribbon is a stroked `bump-horizontal` cubic with `strokeWidth`
 * proportional to flow.
 */
export const Sankey: Story = {
  render: () => createContainer({ id: 'graph-sankey' }),

  play: async ({ canvasElement }) => {
    // ── Settings ─────────────────────────────────────────────────────────
    const settings = {
      // Style
      linkAlpha: 0.4,
      linkStroke: 0x94a3b8,
      // d3's schemeCategory10 — used per-category to colour both the
      // source rectangle and (a tint of) its outgoing ribbons.
      paletteSeed: 0,
      // Labels follow the d3 example: left-half nodes label to the right
      // of the rect; right-half nodes label to the left.
      showLabels: true,
      labelFontSize: 10,
    };

    // d3's schemeCategory10
    const palette = [
      0x1f77b4, 0xff7f0e, 0x2ca02c, 0xd62728, 0x9467bd,
      0x8c564b, 0xe377c2, 0x7f7f7f, 0xbcbd22, 0x17becf,
    ];

    /** Stable category → palette index map, salted by `paletteSeed` so the
     *  user can rotate colours without re-deriving categories. */
    const colorFor = (category: string): number => {
      // FNV-ish lightweight hash so the same category always hits the same
      // colour. Stable across re-renders.
      let h = 0;
      for (let i = 0; i < category.length; i++) h = (h * 31 + category.charCodeAt(i)) | 0;
      const idx = (Math.abs(h) + settings.paletteSeed) % palette.length;
      return palette[idx]!;
    };

    // ── Add everything, then init() last ─────────────────────────────────
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-sankey')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: {} }));

    const graph = new GraphLayer({
      id: 'graph',
      // Data is content → it rides on `initData`. The layout overrides shape
      // per node; literal base style for nodes/edges lives in `canvasOptions`.
      options: { initData: ukEnergyFlowAsGraph() },
    });
    canvas.layers.add(graph);

    canvas.layers.add(new DevInfoLayer({ id: 'dev', corner: 'top-left' }));

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new SystemThemeBehaviour({ id: 'system-theme', layerId: 'bg' }));

    // `D3SankeyLayout`'s ctor types only its own sankey params, but forwards
    // the shared `LayoutOptions` wiring (`id` / `targetLayerId`) to the base
    // `Layout`. The literal carries both; cast past the narrow ctor type so
    // the registry keys the layout as 'sankey' (matching `activeLayout`).
    const sankeyLayout = new D3SankeyLayout(
      { id: 'sankey', targetLayerId: 'graph' } as unknown as D3SankeyLayoutOptions,
    );
    canvas.layouts.add(sankeyLayout);

    const canvasOptions = {
      layers: {
        bg: { type: 'solid', color: '#0b1220' },
        graph: {
          node: {
            // The layout overrides shape per node, but the bgFill catches the
            // case before per-node category styling runs.
            style: {
              shape: { kind: 'rect', width: 15, height: 30 },
              bgFill: 0x64748b,
            },
          },
          edge: {
            style: {
              shape: { pathType: 'bump-horizontal' },
              strokeColor: settings.linkStroke,
              strokeWidth: 1,
              strokeAlpha: settings.linkAlpha,
              arrowTargetShape: 'none',
            },
          },
        },
      },
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
        'system-theme': {
          enabled: true,
          light: { backgroundColor: '#ffffff', color: '#94a3b8' },
          dark: { backgroundColor: '#0b1220', color: '#475569' },
        },
      },
      layouts: {
        sankey: {
          size: [1200, 720] as [number, number],
          nodeWidth: 15,
          nodePadding: 10,
          iterations: 6,
          nodeAlign: 'justify' as 'left' | 'right' | 'center' | 'justify',
        },
      },
      activeLayout: 'sankey',
    };

    /**
     * Per-node fill + per-node label. d3's example colours each rect by its
     * category bucket; labels sit on the *outside* of the rect, on
     * whichever side has more room (left half of the layout → label to the
     * right; right half → label to the left).
     */
    const applyNodeStyling = (): void => {
      const bounds = graph.getBounds();
      const midX = bounds.x + bounds.width / 2;
      graph.store.batch(() => {
        for (const node of graph.store.nodes()) {
          const data = node.data as {
            name?: string;
            category?: string;
          };
          const baseStyle = { ...(node.style ?? {}) };
          delete (baseStyle as { labelStyle?: ShapeLabelStyle }).labelStyle;

          if (data.category) {
            (baseStyle as { bgFill?: number }).bgFill = colorFor(data.category);
          }

          if (settings.showLabels && data.name && node.position) {
            const onLeftHalf = node.position.x < midX;
            const labelStyle: ShapeLabelStyle = {
              content: {
                kind: 'text',
                text: data.name,
                fontSize: settings.labelFontSize,
                fill: 0x0f172a,
              },
              placement: onLeftHalf ? 'right' : 'left',
              offset: { x: onLeftHalf ? 4 : -4 },
            };
            (baseStyle as { labelStyle?: ShapeLabelStyle }).labelStyle = labelStyle;
          }

          graph.store.updateNode(node.id, { style: baseStyle });
        }
      });
    };

    /**
     * Per-edge link tint. d3's example strokes each link with the source
     * node's colour at lower alpha; we mirror that, while leaving the
     * layout-written `strokeWidth` / `pathType` / anchor opts intact.
     */
    const applyEdgeStyling = (): void => {
      graph.store.batch(() => {
        for (const edge of graph.store.edges()) {
          const baseStyle = { ...(edge.style ?? {}) };
          const srcNode = graph.store.getNode(edge.source);
          const srcCategory = (srcNode?.data as { category?: string } | undefined)?.category;
          const stroke = srcCategory ? colorFor(srcCategory) : settings.linkStroke;
          graph.store.updateEdge(edge.id, {
            style: {
              ...baseStyle,
              strokeColor: stroke,
              strokeAlpha: settings.linkAlpha,
            },
          });
        }
      });
    };

    await canvas.init({ container, autoResize: true, config: canvasOptions });
    // initData loads on mount and the active 'sankey' layout auto-runs.
    // Re-tint + re-label and fit once the layout settles (positions ready).
    onStoryTeardown(
      sankeyLayout.events.on('end', () => {
        applyNodeStyling();
        applyEdgeStyling();
        canvas.camera.fitContent(graph.getBounds(), 80);
      }),
    );

    // Pushes the whole sankey param bag back through update() → re-runs the
    // layout; styling re-applies from the 'end' handler above.
    const applyLayout = (): void =>
      canvas.update({ layouts: { sankey: canvasOptions.layouts.sankey } });

    // ── GUI ──────────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'Sankey' });
    onStoryTeardown(() => gui.destroy());
    onStoryTeardown(() => sankeyLayout.stop());

    const layoutFolder = gui.addFolder('Layout');
    layoutFolder.add(canvasOptions.layouts.sankey.size, '0', 600, 2400, 50).name('width').onFinishChange(applyLayout);
    layoutFolder.add(canvasOptions.layouts.sankey.size, '1', 400, 1600, 50).name('height').onFinishChange(applyLayout);
    layoutFolder.add(canvasOptions.layouts.sankey, 'nodeWidth', 4, 60, 1).onFinishChange(applyLayout);
    layoutFolder.add(canvasOptions.layouts.sankey, 'nodePadding', 0, 40, 1).onFinishChange(applyLayout);
    layoutFolder.add(canvasOptions.layouts.sankey, 'iterations', 1, 32, 1).onFinishChange(applyLayout);
    layoutFolder
      .add(canvasOptions.layouts.sankey, 'nodeAlign', ['justify', 'left', 'right', 'center'])
      .onChange(applyLayout);

    const style = gui.addFolder('Style');
    style.add(settings, 'linkAlpha', 0, 1, 0.01).onChange(applyEdgeStyling);
    style.add(settings, 'paletteSeed', 0, 9, 1).name('palette rotation').onChange(() => {
      applyNodeStyling();
      applyEdgeStyling();
    });

    const labels = gui.addFolder('Labels');
    labels.add(settings, 'showLabels').onChange(applyNodeStyling);
    labels.add(settings, 'labelFontSize', 6, 20, 1).onChange(applyNodeStyling);

    gui.add({ refit: () => canvas.camera.fitContent(graph.getBounds(), 80) }, 'refit').name('Re-fit camera');
  },
};
