/**
 * **Citation / Research Graph** — Connected-Papers / Litmaps / Elicit-style
 * paper-discovery view. 150 synthetic papers across 5 topics, ~400
 * citation edges, force-laid into topic clusters with a density-contour
 * overlay that brings the clusters forward without any colour key.
 * Node radius scales with citation count so the hubs read immediately;
 * `LabelCollisionBehaviour` keeps the top-cited papers labelled at any
 * zoom while letting the periphery's labels appear only when the user
 * zooms in.
 *
 * Exercises: `D3ForceLayout` + `DensityContourFillLayer` composition,
 * data-driven node radius (resolver on `shape`), priority-driven
 * `LabelCollisionBehaviour`, `BrushSelectBehaviour`, year-range filter
 * that re-`setData` and re-runs the layout.
 */

import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  BackgroundLayer,
  Canvas,
  DragPanBehaviour,
  WheelZoomBehaviour,
} from '@invana/canvas';
import {
  BrushSelectBehaviour,
  ClickSelectBehaviour,
  DragNodeBehaviour,
  GraphLayer,
  HoverActivateBehaviour,
  LabelCollisionBehaviour,
  type EdgeData,
  type GraphNode,
  type NodeData,
} from '@invana/graph';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { DensityContourFillLayer } from '@invana/graph-layer-d3-contour';
import {
  citations,
  type CitationsEdgeData,
  type CitationsNodeData,
  type CitationsTopic,
} from '@invana/graph-datasets/usecase-demos';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../div-util';

const meta: Meta = { title: 'Usecases/Citation Graph' };
export default meta;
type Story = StoryObj;

export const CitationGraph: Story = {
  render: () => createContainer({ id: 'usecase-citations' }),

  play: async ({ canvasElement }) => {
    const TOPIC_FILL: Record<CitationsTopic, number> = {
      'transformers':           0x6366f1, // indigo
      'diffusion-models':       0x10b981, // emerald
      'reinforcement-learning': 0xf59e0b, // amber
      'graph-neural-networks':  0xec4899, // pink
      'vision-language':        0x8b5cf6, // violet
    };

    const settings = {
      fillOpacity: 0.4,
      bandwidth: 30,
      thresholds: 12,
      minCitationsToLabel: 80,
      yearFrom: 2018,
      yearTo: 2025,
    };

    // ── Canvas setup ─────────────────────────────────────────────────────
    const container = canvasElement.querySelector<HTMLDivElement>('#usecase-citations')!;
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
          mode: 'dark',
          color: { light: '#0b1220', dark: '#0b1220' },
        },
      }),
    );

    const contour = new DensityContourFillLayer({
      id: 'density',
      zIndex: -1,
      options: {
        graphLayerId: 'graph',
        bandwidth: settings.bandwidth,
        thresholds: settings.thresholds,
        cellSize: 4,
        fillOpacity: settings.fillOpacity,
        padding: 80,
        palette: 'inferno',
      },
    });
    canvas.layers.add(contour);

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        node: {
          style: {
            shape: (n: GraphNode) => ({
              kind: 'circle',
              // log scales 1 → 900 citations into ~3 → 11 px radius.
              radius: 3 + Math.log10((n.data as CitationsNodeData).citationsCount + 1) * 3,
            }),
            bgFill: (n: GraphNode) => TOPIC_FILL[(n.data as CitationsNodeData).topic],
            bgAlpha: 0.95,
            bgStrokeColor: 0x0b1220,
            bgStrokeWidth: 0.5,
            labelText: (n: GraphNode) => (n.data as CitationsNodeData).title,
            labelColor: 0xf8fafc,
            labelFontSize: 10,
            labelPlacement: 'bottom',
            labelOffsetY: 4,
            labelBackgroundFill: 0x111827,
            labelBackgroundAlpha: 0.8,
            labelBackgroundPadding: 2,
            labelBackgroundCornerRadius: 2,
            // Min-zoom set so peripheral labels stay hidden until the
            // viewer zooms in; high-priority labels (top-cited) push
            // through `LabelCollisionBehaviour` and remain visible.
            labelMinZoom: 0.6,
            labelPriority: (n: GraphNode) => (n.data as CitationsNodeData).citationsCount,
          },
          state: {
            hovered: {
              bgStrokeColor: 0xfbbf24,
              bgStrokeWidth: 2,
              labelForceShow: true,
              labelFontSize: 12,
            },
            selected: {
              bgStrokeColor: 0xffffff,
              bgStrokeWidth: 1.5,
              labelForceShow: true,
            },
            dimmed: { bgAlpha: 0.15 },
          },
        },
        edge: {
          style: {
            strokeColor: 0xcbd5e1,
            strokeWidth: 0.6,
            strokeAlpha: 0.25,
            arrowTargetShape: 'none',
          },
          state: {
            highlighted: { strokeColor: 0xfbbf24, strokeWidth: 1.2, strokeAlpha: 0.9 },
          },
        },
      },
    });
    canvas.layers.add(graph);

    // ── Project dataset → graph (with year + min-citation filters) ──────
    const project = (): void => {
      const inRange = citations.nodes.filter(
        (n) =>
          n.data.year >= settings.yearFrom &&
          n.data.year <= settings.yearTo,
      );
      const idSet = new Set(inRange.map((n) => n.id));
      const edges: EdgeData<CitationsEdgeData>[] = citations.edges
        .filter((e) => idSet.has(e.source) && idSet.has(e.target))
        .map((e) => ({ id: e.id, source: e.source, target: e.target, data: e.data }));

      // The dataset-level filter shapes the visible subgraph; the
      // per-label-min threshold is applied via labelForceShow override
      // so the layer template's resolver still owns the actual
      // labelText / minZoom / priority fields.
      const nodes: NodeData<CitationsNodeData>[] = inRange.map((n) => ({
        id: n.id,
        data: n.data,
        ...(n.data.citationsCount >= settings.minCitationsToLabel
          ? { style: { labelForceShow: true } }
          : {}),
      }));

      graph.setData({ nodes, edges });
    };
    project();

    // ── Behaviours ──────────────────────────────────────────────────────
    canvas.behaviours.register(
      new DragNodeBehaviour({ id: 'drag-node', layerId: 'graph', enabled: true }),
    );
    canvas.behaviours.register(
      new HoverActivateBehaviour({
        id: 'hover', layerId: 'graph', enabled: true,
        state: 'hovered', inactiveState: 'dimmed',
        degree: 1, direction: 'both',
      }),
    );
    canvas.behaviours.register(
      new ClickSelectBehaviour({
        id: 'select', layerId: 'graph', enabled: true,
        multiple: true, trigger: ['shift'],
      }),
    );
    canvas.behaviours.register(
      new BrushSelectBehaviour({
        id: 'brush', layerId: 'graph', enabled: true,
        clickSelectId: 'select',
        enableElements: ['shape'],
      }),
    );
    canvas.behaviours.register(
      new LabelCollisionBehaviour({
        id: 'label-collision', layerId: 'graph', enabled: true,
        strategy: 'hide',
        flickerGuardMs: 120,
      }),
    );

    // ── Layout ──────────────────────────────────────────────────────────
    let layout: D3ForceLayout | null = null;
    const runLayout = async (): Promise<void> => {
      layout?.stop();
      layout = new D3ForceLayout({
        link: { distance: 36 },
        charge: { strength: -80 },
        collide: { radius: 12 },
        center: { x: 0, y: 0 },
      });
      layout.events.on('end', () => {
        canvas.camera.fitContent(graph.getBounds(), 80);
        contour.recompute();
      });
      await layout.apply(graph);
    };
    void runLayout();
    onStoryTeardown(() => layout?.stop());

    // ── GUI ─────────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'Citation Graph' });
    onStoryTeardown(() => gui.destroy());

    const contourFolder = gui.addFolder('Density contour');
    const rebuildContour = (): void => {
      const o = contour.options as unknown as Record<string, unknown>;
      o.bandwidth = settings.bandwidth;
      o.thresholds = settings.thresholds;
      o.fillOpacity = settings.fillOpacity;
      contour.recompute();
    };
    contourFolder.add(settings, 'fillOpacity', 0, 1, 0.05).onChange(rebuildContour);
    contourFolder.add(settings, 'bandwidth', 8, 80, 1).onChange(rebuildContour);
    contourFolder.add(settings, 'thresholds', 4, 24, 1).onChange(rebuildContour);

    const labelsFolder = gui.addFolder('Labels');
    labelsFolder
      .add(settings, 'minCitationsToLabel', 0, 400, 5)
      .name('min citations to label')
      .onChange(project);

    const yearFolder = gui.addFolder('Year filter');
    yearFolder.add(settings, 'yearFrom', 2018, 2025, 1).name('from').onChange(() => {
      if (settings.yearFrom > settings.yearTo) settings.yearTo = settings.yearFrom;
      project();
      void runLayout();
    });
    yearFolder.add(settings, 'yearTo', 2018, 2025, 1).name('to').onChange(() => {
      if (settings.yearTo < settings.yearFrom) settings.yearFrom = settings.yearTo;
      project();
      void runLayout();
    });

    gui
      .add({ fit: () => canvas.camera.fitContent(graph.getBounds(), 80) }, 'fit')
      .name('Fit to content');
  },
};
