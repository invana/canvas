/**
 * **Cora citation network** — the canonical ML benchmark dataset, 2,708
 * papers with 10,556 `CITES` edges, rendered as a force-directed graph
 * with tiny dots and translucent bezier ribbons. The dense overlay of
 * low-alpha curves produces the "watercolor" effect that lets the
 * cluster topology read at a glance — same picture style as the
 * Connected-Papers / Gephi force-atlas screenshots people share for
 * Cora.
 *
 * Exercises: `D3ForceLayout` on a real dataset at scale (~2.7k nodes,
 * ~10k edges), bezier edges with low alpha for the additive-blending
 * look, optional colour-by-subject mode, optional density contour
 * overlay to bring the topic clusters forward.
 */

import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  BackgroundLayer,
  Canvas,
  DragPanBehaviour,
  WheelZoomBehaviour,
} from '@invana/canvas';
import {
  DragNodeBehaviour,
  // EdgeSizeLODBehaviour,
  GraphLayer,
  HoverActivateBehaviour,
  // NodeSizeLODBehaviour,
  type GraphNode,
} from '@invana/graph';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { DensityContourFillLayer } from '@invana/graph-layer-d3-contour';
import { cora, type CoraNodeData, type CoraSubject } from '@invana/graph-datasets/usecase-demos';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../div-util';

const meta: Meta = { title: 'Usecases/Cora Citation Network' };
export default meta;
type Story = StoryObj;

export const CoraCitationNetwork: Story = {
  render: () => createContainer({ id: 'usecase-cora' }),

  play: async ({ canvasElement }) => {
    // Subject palette — used only when the GUI toggles `colorBySubject`
    // on. Default is the single-blue "watercolor" look that matches the
    // reference screenshot.
    const SUBJECT_FILL: Record<CoraSubject, number> = {
      Neural_Networks:         0x2563eb, // blue
      Rule_Learning:           0xdc2626, // red
      Reinforcement_Learning:  0xf59e0b, // amber
      Probabilistic_Methods:   0x10b981, // emerald
      Theory:                  0x8b5cf6, // violet
      Genetic_Algorithms:      0xec4899, // pink
      Case_Based:              0x14b8a6, // teal
    };
    const DEFAULT_FILL = 0x3b82f6; // blue-500 — matches the screenshot

    const settings = {
      colorBySubject: true,
      edgeAlpha: 0.6,
      edgeWidth: 1,
      nodeRadius: 10,
      // D3-force tuning. Cora is dense; weaker charge + shorter links
      // pack the clusters more tightly than the LesMis defaults.
      chargeStrength: -28,
      // linkDistance: 22,
      collideRadius: 20,
      showDensity: false,
      pixelConstantSizing: true,
    };

    // ── Canvas setup ─────────────────────────────────────────────────────
    const container = canvasElement.querySelector<HTMLDivElement>('#usecase-cora')!;
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
            shape: { kind: 'circle', radius: settings.nodeRadius },
            bgFill: (n: GraphNode) =>
              settings.colorBySubject
                ? SUBJECT_FILL[(n.data as CoraNodeData).subject]
                : DEFAULT_FILL,
            bgAlpha: 0.95,
            // No stroke at base scale — keeps the dots looking like
            // pinpoints rather than rings (matches the screenshot).
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
            // watercolor / Gephi-style bundled appearance — the path
            // type itself doesn't bundle.
            shape: { pathType: 'bezier', sourceAnchor: "boundary", targetAnchor: "boundary", 
              pathStyleOpts: { axis: 'h', tension: 0.5 } },
            strokeColor: DEFAULT_FILL,
            strokeWidth: settings.edgeWidth,
            strokeAlpha: settings.edgeAlpha,
            arrowTargetShape: 'none',
          },
          state: {
            highlighted: { strokeColor: 0xfbbf24, strokeAlpha: 0.9, strokeWidth: 1.2 },
            dimmed: { strokeAlpha: 0.04 },
          },
        },
      },
    });
    canvas.layers.add(graph);

    // Density overlay below the graph; off by default — toggle it via the
    // GUI to see where the citation hubs sit.
    const contour = new DensityContourFillLayer({
      id: 'density',
      zIndex: -1,
      visible: false,
      options: {
        graphLayerId: 'graph',
        bandwidth: 20,
        thresholds: 10,
        cellSize: 4,
        fillOpacity: 0.4,
        padding: 80,
        palette: 'blues',
      },
    });
    canvas.layers.add(contour);

    graph.setData({ nodes: cora.nodes.map((n) => ({ ...n })), edges: cora.edges.map((e) => ({ ...e })) });

    // ── Behaviours ──────────────────────────────────────────────────────
    canvas.behaviours.register(
      new DragNodeBehaviour({ id: 'drag-node', layerId: 'graph', enabled: true }),
    );
    canvas.behaviours.register(
      new HoverActivateBehaviour({
        id: 'hover', layerId: 'graph', enabled: true,
        state: 'hovered',
        // `inactiveState: 'dimmed'` would force a per-hover walk over
        // all 2,708 nodes + 10,556 edges (HoverActivateBehaviour calls
        // `setNodeState` per item, each triggering a sync `rerenderNode`).
        // Skip the dim entirely on this dataset — the highlighted
        // neighbourhood reads fine against the watercolor background
        // without it.
        degree: 1,
        direction: 'both',
      }),
    );

    // const nodeSizeLOD = new NodeSizeLODBehaviour({
    //   id: 'node-size-lod', enabled: settings.pixelConstantSizing,
    //   layers: [{ layerId: 'graph', sizePx: () => settings.nodeRadius * 2 }],
    // });
    // const edgeSizeLOD = new EdgeSizeLODBehaviour({
    //   id: 'edge-size-lod', enabled: settings.pixelConstantSizing,
    //   layers: [{ layerId: 'graph', strokeWidthPx: () => settings.edgeWidth }],
    // });
    // canvas.behaviours.register(nodeSizeLOD);
    // canvas.behaviours.register(edgeSizeLOD);

    // ── Layout ──────────────────────────────────────────────────────────
    let layout: D3ForceLayout | null = null;
    const runLayout = async (): Promise<void> => {
      layout?.stop();
      layout = new D3ForceLayout({
        // 2,708 nodes / 10,556 edges — per-tick writeback dominates run
        // cost. `animate: false` skips intermediate renders and flushes
        // positions once on `sim.on('end')`, so the user sees the
        // settled picture appear rather than watching the slow scatter.
        animate: false,
        // link: { distance: settings.linkDistance },
        // charge: { strength: settings.chargeStrength },
        // collide: { radius: settings.collideRadius },
        link: {},
        charge: {},
        center: { x: 0, y: 0 },
      });
      layout.events.on('end', () => {
        canvas.camera.fitContent(graph.getBounds(), 60);
        if (settings.showDensity) contour.recompute();
      });
      await layout.apply(graph);
    };
    void runLayout();
    onStoryTeardown(() => layout?.stop());

    // Wipe per-instance styles so layer-template resolvers (bgFill in
    // particular) re-resolve against the new settings.
    const rerenderAll = (): void => {
      graph.store.batch(() => {
        for (const n of graph.store.nodes()) graph.store.updateNode(n.id, { style: undefined });
        for (const e of graph.store.edges()) graph.store.updateEdge(e.id, { style: undefined });
      });
    };

    // ── GUI ─────────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'Cora citation network' });
    onStoryTeardown(() => gui.destroy());

    const styleFolder = gui.addFolder('Style');
    styleFolder
      .add(settings, 'colorBySubject')
      .name('colour by subject')
      .onChange(rerenderAll);
    styleFolder
      .add(settings, 'edgeAlpha', 0, 1, 0.01)
      .name('edge alpha')
      .onChange(rerenderAll);
    // styleFolder
    //   .add(settings, 'edgeWidth', 0.1, 2, 0.05)
    //   .name('edge width (px)')
    //   .onChange(() => {
    //     rerenderAll();
    //     if (settings.pixelConstantSizing) edgeSizeLOD.reflow();
    //   });
    // styleFolder
    //   .add(settings, 'nodeRadius', 0.5, 6, 0.1)
    //   .name('node radius (px)')
    //   .onChange(() => {
    //     rerenderAll();
    //     if (settings.pixelConstantSizing) nodeSizeLOD.reflow();
    //   });
    // styleFolder
    //   .add(settings, 'pixelConstantSizing')
    //   .name('px-constant sizing')
    //   .onChange((on: boolean) => {
    //     if (on) { nodeSizeLOD.enable(); edgeSizeLOD.enable(); }
    //     else    { nodeSizeLOD.disable(); edgeSizeLOD.disable(); }
    //   });

    const forceFolder = gui.addFolder('D3-force');
    forceFolder.add(settings, 'chargeStrength', -200, 0, 1).onFinishChange(() => void runLayout());
    // forceFolder.add(settings, 'linkDistance', 1, 80, 1).onFinishChange(() => void runLayout());
    forceFolder.add(settings, 'collideRadius', 0, 12, 0.1).onFinishChange(() => void runLayout());

    const overlayFolder = gui.addFolder('Density overlay');
    overlayFolder
      .add(settings, 'showDensity')
      .name('show density')
      .onChange((v: boolean) => {
        contour.visible = v;
        if (v) contour.recompute();
      });

    gui.add(
      { nodes: cora.nodes.length, edges: cora.edges.length },
      'nodes',
    ).disable();
    gui.add(
      { nodes: cora.nodes.length, edges: cora.edges.length },
      'edges',
    ).disable();

    gui
      .add({ refit: () => canvas.camera.fitContent(graph.getBounds(), 60) }, 'refit')
      .name('Re-fit camera');
  },
};
