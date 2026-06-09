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

import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  BackgroundLayer,
  DragPanBehaviour,
  WheelZoomBehaviour,
} from '@invana/canvas';
import {
  BrushSelectBehaviour,
  ClickSelectBehaviour,
  DragNodeBehaviour,
  GraphCanvas,
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

    // ── Project dataset → graph (with year + min-citation filters) ──────
    // Pure data shaping (content, not config). Used both for the initial
    // `initData` and for the GUI year/min-citation re-filters.
    const projectData = (): {
      nodes: NodeData<CitationsNodeData>[];
      edges: EdgeData<CitationsEdgeData>[];
    } => {
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

      return { nodes, edges };
    };

    // ── Add everything, then init() last ─────────────────────────────────
    const container = canvasElement.querySelector<HTMLDivElement>('#usecase-citations')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: {} }));

    // Cross-layer `graphLayerId` stays in the constructor; literal contour
    // opts move into `canvasOptions`.
    const contour = new DensityContourFillLayer({
      id: 'density',
      zIndex: -1,
      options: { graphLayerId: 'graph' },
    });
    canvas.layers.add(contour);

    // Resolver fields (shape / bgFill / labelText / labelPriority) are
    // non-serialisable → they stay in the constructor. Literal node/edge
    // style + state configs live in `canvasOptions` below.
    const graph = new GraphLayer({
      id: 'graph',
      options: {
        initData: projectData(),
        node: {
          style: {
            shape: (n: GraphNode) => ({
              kind: 'circle',
              // log scales 1 → 900 citations into ~3 → 11 px radius.
              radius: 3 + Math.log10((n.data as CitationsNodeData).citationsCount + 1) * 3,
            }),
            bgFill: (n: GraphNode) => TOPIC_FILL[(n.data as CitationsNodeData).topic],
            labelText: (n: GraphNode) => (n.data as CitationsNodeData).title,
            labelPriority: (n: GraphNode) => (n.data as CitationsNodeData).citationsCount,
          },
        },
      },
    });
    canvas.layers.add(graph);

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new DragNodeBehaviour({ id: 'drag-node', layerId: 'graph' }));
    canvas.behaviours.register(
      new HoverActivateBehaviour({
        id: 'hover', layerId: 'graph',
        state: 'hovered', inactiveState: 'dimmed',
        degree: 1, direction: 'both',
      }),
    );
    canvas.behaviours.register(
      new ClickSelectBehaviour({
        id: 'select', layerId: 'graph',
        multiple: true, trigger: ['shift'],
      }),
    );
    canvas.behaviours.register(
      new BrushSelectBehaviour({
        id: 'brush', layerId: 'graph',
        clickSelectId: 'select',
        enableElements: ['shape'],
      }),
    );
    canvas.behaviours.register(
      new LabelCollisionBehaviour({
        id: 'label-collision', layerId: 'graph',
        strategy: 'hide',
        flickerGuardMs: 120,
      }),
    );

    const forceLayout = new D3ForceLayout({ id: 'force', targetLayerId: 'graph' });
    canvas.layouts.add(forceLayout);

    const canvasOptions = {
      layers: {
        bg: { type: 'solid', color: '#0b1220' },
        density: {
          bandwidth: settings.bandwidth,
          thresholds: settings.thresholds,
          cellSize: 4,
          fillOpacity: settings.fillOpacity,
          padding: 80,
          palette: 'inferno',
        },
        graph: {
          node: {
            style: {
              bgAlpha: 0.95,
              bgStrokeColor: 0x0b1220,
              bgStrokeWidth: 0.5,
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
      },
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
        'drag-node': { enabled: true },
        hover: { enabled: true },
        select: { enabled: true },
        brush: { enabled: true },
        'label-collision': { enabled: true },
      },
      layouts: {
        force: {
          link: { distance: 36 },
          charge: { strength: -80 },
          collide: { radius: 12 },
          center: { x: 0, y: 0 },
        },
      },
      activeLayout: 'force',
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });
    // initData loads on mount and the active 'force' layout auto-runs.

    // Fit + recompute the density overlay once the force sim settles.
    onStoryTeardown(
      forceLayout.events.on('end', () => {
        canvas.camera.fitContent(graph.getBounds(), 80);
        contour.recompute();
      }),
    );
    onStoryTeardown(() => forceLayout.stop());

    // Re-filter the visible subgraph (year / min-citation) — this is a
    // data change, so it re-feeds the graph and re-heats the layout.
    const reproject = (): void => {
      graph.setData(projectData());
      canvas.update({ layouts: { force: canvasOptions.layouts.force } });
    };

    // ── GUI ─────────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'Citation Graph' });
    onStoryTeardown(() => gui.destroy());

    const contourFolder = gui.addFolder('Density contour');
    const applyContour = (): void => {
      canvas.update({
        layers: {
          density: {
            bandwidth: canvasOptions.layers.density.bandwidth,
            thresholds: canvasOptions.layers.density.thresholds,
            fillOpacity: canvasOptions.layers.density.fillOpacity,
          },
        },
      });
      contour.recompute();
    };
    contourFolder.add(canvasOptions.layers.density, 'fillOpacity', 0, 1, 0.05).onChange(applyContour);
    contourFolder.add(canvasOptions.layers.density, 'bandwidth', 8, 80, 1).onChange(applyContour);
    contourFolder.add(canvasOptions.layers.density, 'thresholds', 4, 24, 1).onChange(applyContour);

    const labelsFolder = gui.addFolder('Labels');
    labelsFolder
      .add(settings, 'minCitationsToLabel', 0, 400, 5)
      .name('min citations to label')
      .onChange(() => graph.setData(projectData()));

    const yearFolder = gui.addFolder('Year filter');
    yearFolder.add(settings, 'yearFrom', 2018, 2025, 1).name('from').onChange(() => {
      if (settings.yearFrom > settings.yearTo) settings.yearTo = settings.yearFrom;
      reproject();
    });
    yearFolder.add(settings, 'yearTo', 2018, 2025, 1).name('to').onChange(() => {
      if (settings.yearTo < settings.yearFrom) settings.yearFrom = settings.yearTo;
      reproject();
    });

    gui
      .add({ fit: () => canvas.camera.fitContent(graph.getBounds(), 80) }, 'fit')
      .name('Fit to content');
  },
};
