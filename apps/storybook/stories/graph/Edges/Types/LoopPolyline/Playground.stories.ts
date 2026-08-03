import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  DragNodeBehaviour, GraphCanvas, GraphLayer,
  type GraphEdge, type GraphNode,
} from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'graph/Edges/Types/LoopPolyline/Playground' };
export default meta;
type Story = StoryObj;

/**
 * Graph-side counterpart to
 * `Canvas/Connectors/PathStyles/LoopPolyline/Playground`.
 *
 * Single `loop-polyline` self-edge with every opt exposed via lil-gui.
 * Use this to interactively explore how `side`, `baseOffset`,
 * `baseOffsetX/Y`, `stubLength`, and `gap` interact across both
 * geometries — switch `side` between a cardinal and a corner value to
 * see the U-bracket / wrap dispatch flip live.
 *
 * Implementation note: lil-gui wiring follows the field-resolver
 * pattern from `Stroke/Interactive` — `options.edge.style.shape` is a
 * **function** closing over the `settings` object, so each render reads
 * the latest knob values. Because the templates are resolver functions
 * (not literals) they stay in the layer constructor `options`, not in
 * the serialisable config. `rerenderAll()` calls `updateEdge` with the
 * existing style to force re-resolution.
 */
export const Playground: Story = {
  render: () => createContainer({ id: 'graph-edge-loop-polyline-playground' }),

  play: async ({ canvasElement }) => {
    const NODE_ID = 'host';
    const EDGE_ID = 'loop';

    const sideOptions = [
      'top', 'top-right', 'right', 'bottom-right',
      'bottom', 'bottom-left', 'left', 'top-left',
    ] as const;

    const settings = {
      side: 'top-right' as typeof sideOptions[number],
      baseOffset: 40,
      baseOffsetX: 40,
      baseOffsetY: 25,
      stubLength: 18,
      gap: 18,
      strokeColor: 0x111827,
      strokeWidth: 2,
      showArrow: true,
    };

    const nodes: GraphNode[] = [
      { type: 'node', id: NODE_ID, position: { x: 0, y: 0 },
        style: {
          shape: { kind: 'rect', width: 80, height: 50 },
          bgFill: 0x4f9cf9, bgStrokeColor: 0x1e40af, bgStrokeWidth: 2,
        } },
    ];

    const edges: GraphEdge[] = [
      { type: 'edge', id: EDGE_ID, source: NODE_ID, target: NODE_ID },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-edge-loop-polyline-playground')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    // Edge templates are field-level resolvers closing over `settings`,
    // so they live in the constructor `options` — data rides on initData.
    const graph = new GraphLayer({
      id: 'graph',
      options: {
        initData: { nodes, edges },
        edge: {
          style: {
            // Field-level resolvers — fire on every render, read the
            // latest `settings`. Switch `side` between cardinals/corners
            // and the corner-only opts are conditionally included.
            shape: () => {
              const isCorner = settings.side.includes('-');
              return {
                pathType: 'loop-polyline',
                sourceAnchor: 'center',
                targetAnchor: 'center',
                pathStyleOpts: {
                  side: settings.side,
                  baseOffset: settings.baseOffset,
                  ...(isCorner ? {
                    baseOffsetX: settings.baseOffsetX,
                    baseOffsetY: settings.baseOffsetY,
                  } : {}),
                  stubLength: settings.stubLength,
                  gap: settings.gap,
                },
              };
            },
            strokeColor: () => settings.strokeColor,
            strokeWidth: () => settings.strokeWidth,
            strokeJoin: 'miter',
            arrowTargetShape: () => settings.showArrow ? 'triangle' : 'none',
          },
        },
      },
    });
    canvas.layers.add(graph);
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new DragNodeBehaviour({ id: 'drag-node', targetLayerId: 'graph' }));

    const canvasOptions = {
      behaviours: { pan: { enabled: true }, zoom: { enabled: true }, 'drag-node': { enabled: true } },
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });
    canvas.camera.fitContent(graph.getBounds(), 120);

    // Force every edge to re-resolve its style. Passing back the existing
    // `style` is enough — the resolvers in the layer template re-fire
    // and read the mutated `settings`.
    const rerenderAll = (): void => {
      for (const edge of graph.store.edges()) {
        graph.store.updateEdge(edge.id, { style: edge.style });
      }
    };

    const gui = new GUI({ title: 'loop-polyline · playground' });
    onStoryTeardown(() => gui.destroy());

    const geom = gui.addFolder('geometry');
    geom.add(settings, 'side', sideOptions as unknown as string[]).onChange(rerenderAll);
    geom.add(settings, 'baseOffset', 0, 120, 1).name('baseOffset (cardinal)').onChange(rerenderAll);
    geom.add(settings, 'baseOffsetX', 0, 120, 1).name('baseOffsetX (corner)').onChange(rerenderAll);
    geom.add(settings, 'baseOffsetY', 0, 120, 1).name('baseOffsetY (corner)').onChange(rerenderAll);
    geom.add(settings, 'stubLength', 0, 80, 1).onChange(rerenderAll);
    geom.add(settings, 'gap', 0, 80, 1).onChange(rerenderAll);

    const strokeFolder = gui.addFolder('stroke').close();
    strokeFolder.addColor(settings, 'strokeColor').onChange(rerenderAll);
    strokeFolder.add(settings, 'strokeWidth', 0.5, 10, 0.5).onChange(rerenderAll);

    const markerFolder = gui.addFolder('marker').close();
    markerFolder.add(settings, 'showArrow').onChange(rerenderAll);
  },
};
