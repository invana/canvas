/**
 * **RAG Embedding Explorer** — vector-DB topology view in the style of
 * Pinecone / Weaviate / LangSmith's embedding explorer. ~400 synthetic
 * 2D-projected chunks land on the canvas; a `DensityContourFillLayer`
 * paints the cluster topology beneath them; hover reveals the chunk
 * text; the lasso pulls a sub-cluster into a selection set.
 *
 * Exercises: `DensityContourFillLayer` + `GraphLayer` composition,
 * pre-positioned data (no layout pass), `HoverActivateBehaviour` with a
 * label-on-hover overlay, `LassoSelectBehaviour`, `MiniMapLayer`. Built
 * the new way: register layers/behaviours by id, then a single
 * serialisable `canvasOptions` object, then `init()` last. Node
 * positions ride on `initData`, so there's no layout.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  BackgroundLayer,
  DragPanBehaviour,
  WheelZoomBehaviour,
} from '@invana/canvas';
import {
  ClickSelectBehaviour,
  GraphCanvas,
  GraphLayer,
  HoverActivateBehaviour,
  LassoSelectBehaviour,
  MiniMapLayer,
  type GraphNode,
  type NodeData,
} from '@invana/graph';
import { DensityContourFillLayer } from '@invana/graph-layer-d3-contour';
import {
  ragEmbeddings,
  type RagEmbeddingsCluster,
  type RagEmbeddingsNodeData,
} from '@invana/graph-datasets/usecase-demos';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../div-util';

const meta: Meta = { title: 'Usecases/RAG Embedding Explorer' };
export default meta;
type Story = StoryObj;

export const RAGEmbeddingExplorer: Story = {
  render: () => createContainer({ id: 'usecase-rag-embeddings' }),

  play: async ({ canvasElement }) => {
    const CLUSTER_FILL: Record<RagEmbeddingsCluster, number> = {
      auth:    0x6366f1, // indigo
      billing: 0x10b981, // emerald
      search:  0xf59e0b, // amber
      infra:   0xf43f5e, // rose
      ml:      0x8b5cf6, // violet
    };

    const settings = {
      bandwidth: 32,
      thresholds: 12,
      cellSize: 4,
      fillOpacity: 0.45,
      palette: 'magma' as const,
      showAllLabels: false,
      lassoAdditive: false,
    };

    // Pre-positioned chunks — positions ride on `initData`, no layout.
    const nodes: NodeData<RagEmbeddingsNodeData>[] = ragEmbeddings.nodes.map((p) => ({
      id: p.id,
      position: p.position,
      data: p.data,
    }));

    // ── Canvas setup ─────────────────────────────────────────────────────
    const container = canvasElement.querySelector<HTMLDivElement>('#usecase-rag-embeddings')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    // ── Layers ──────────────────────────────────────────────────────────
    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: {} }));

    // Contour goes first (lowest zIndex) so points paint over it. The
    // cross-layer `graphLayerId` stays in the constructor; the literal
    // density params live in config.
    const contour = new DensityContourFillLayer({
      id: 'density',
      zIndex: -1,
      options: { graphLayerId: 'graph' },
    });
    canvas.layers.add(contour);

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        initData: { nodes, edges: [] },
        node: {
          // Resolver fields stay in the constructor; literal style fields
          // live in config and shallow-merge at init.
          style: {
            bgFill: (n: GraphNode) => CLUSTER_FILL[(n.data as RagEmbeddingsNodeData).cluster],
            // By default labels stay hidden until the zoom passes 1.5;
            // hover + selected states force them on regardless.
            labelText: (n: GraphNode) => truncate((n.data as RagEmbeddingsNodeData).text, 36),
          },
          state: {
            hovered: {
              shape: { kind: 'circle', radius: 6 },
              bgStrokeColor: 0xfbbf24,
              bgStrokeWidth: 1.5,
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
    });
    canvas.layers.add(graph);

    canvas.layers.add(
      new MiniMapLayer({ id: 'minimap', options: { graphLayerId: 'graph' } }),
    );

    // ── Behaviours ──────────────────────────────────────────────────────
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(
      new HoverActivateBehaviour({
        id: 'hover',
        layerId: 'graph',
        state: 'hovered',
        // Single-node hover, no neighbour expansion — there are no edges.
        degree: 0,
      }),
    );
    canvas.behaviours.register(
      new ClickSelectBehaviour({
        id: 'select',
        layerId: 'graph',
        multiple: true,
        trigger: ['shift'],
        clearOnBackground: true,
      }),
    );
    const lasso = new LassoSelectBehaviour({
      id: 'lasso',
      layerId: 'graph',
      // Hand selected ids over to the ClickSelect behaviour by sharing the
      // `selected` state name (its default). This is the recommended
      // composition path per the LassoSelectBehaviour docs.
      clickSelectId: 'select',
      immediately: false,
      clearOnBackground: false,
    });
    canvas.behaviours.register(lasso);

    // ── Config ──────────────────────────────────────────────────────────
    const canvasOptions = {
      layers: {
        bg: { type: 'solid', color: '#0b1220' },
        density: {
          bandwidth: settings.bandwidth,
          thresholds: settings.thresholds,
          cellSize: settings.cellSize,
          fillOpacity: settings.fillOpacity,
          padding: 80,
          palette: settings.palette,
        },
        graph: {
          node: {
            style: {
              shape: { kind: 'circle', radius: 4 },
              bgAlpha: 0.95,
              bgStrokeColor: 0x0b1220,
              bgStrokeWidth: 0.5,
              labelColor: 0xf8fafc,
              labelFontSize: 10,
              labelPlacement: 'bottom',
              labelOffsetY: 4,
              labelBackgroundFill: 0x111827,
              labelBackgroundAlpha: 0.8,
              labelBackgroundPadding: 3,
              labelBackgroundCornerRadius: 3,
              labelMinZoom: 1.5,
            },
          },
        },
        minimap: { position: 'bottom-right', width: 220, height: 160, backgroundColor: 0x111827 },
      },
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
        hover: { enabled: true },
        select: { enabled: true },
        lasso: { enabled: true },
      },
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    // Contour bootstraps from the initial data; explicit recompute costs
    // nothing and guarantees the bands are present before the camera
    // fits, so the user sees the full picture immediately.
    contour.recompute();
    canvas.camera.fitContent(graph.getBounds(), 80);

    // ── GUI ─────────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'RAG Embedding Explorer' });
    onStoryTeardown(() => gui.destroy());

    const contourFolder = gui.addFolder('Density contour');
    const rebuildContour = (): void => {
      canvas.update({ layers: { density: canvasOptions.layers.density } });
      contour.recompute();
    };
    contourFolder.add(canvasOptions.layers.density, 'bandwidth', 8, 80, 1).onChange(rebuildContour);
    contourFolder.add(canvasOptions.layers.density, 'thresholds', 3, 24, 1).onChange(rebuildContour);
    contourFolder.add(canvasOptions.layers.density, 'fillOpacity', 0, 1, 0.05).onChange(rebuildContour);

    const labelsFolder = gui.addFolder('Labels');
    labelsFolder
      .add(settings, 'showAllLabels')
      .name('always show labels')
      .onChange((on: boolean) => {
        // Drop the per-node style overlay (forces re-resolve) and patch
        // the layer template's `labelMinZoom`. 1.5 = "wait until zoomed",
        // 0 = "always show".
        for (const node of graph.store.nodes()) {
          graph.store.updateNode(node.id, { style: undefined });
        }
        canvasOptions.layers.graph.node.style.labelMinZoom = on ? 0 : 1.5;
        canvas.update({ layers: { graph: { node: { style: { labelMinZoom: on ? 0 : 1.5 } } } } });
      });

    const lassoFolder = gui.addFolder('Lasso');
    lassoFolder
      .add(settings, 'lassoAdditive')
      .name('additive (else replace)')
      .onChange((additive: boolean) => {
        lasso.setOptions({ trigger: additive ? [] : ['shift'] });
      });

    gui
      .add({ fit: () => canvas.camera.fitContent(graph.getBounds(), 80) }, 'fit')
      .name('Fit to content');

    /** Clip a chunk snippet to N chars for the default-label rendering. */
    function truncate(s: string, n: number): string {
      return s.length > n ? `${s.slice(0, n - 1)}…` : s;
    }
  },
};
