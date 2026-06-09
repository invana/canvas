import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { GraphCanvas, DragNodeBehaviour, GraphLayer, type GraphNode } from '@invana/graph';
import { lesMiserables } from '@invana/graph-datasets';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'canvas/graph/Layer/Basic' };
export default meta;
type Story = StoryObj;

export const Basic: Story = {
  render: () => createContainer({ id: 'graph-layer-basic' }),

  play: async ({ canvasElement }) => {
    // Eleven distinct hues, one per Les Mis "group" id (0–10). Picked to
    // be readable on the default light Storybook background.
    const groupColors = [
      0x9ca3af, 0xef4444, 0xf59e0b, 0xeab308, 0x10b981, 0x06b6d4,
      0x3b82f6, 0x8b5cf6, 0xec4899, 0x14b8a6, 0xa3e635,
    ];

    // Place each node on a circle, seeded deterministically from its index so
    // the story doesn't depend on a layout running. Each node gets a
    // fill colour derived from its group. Per-item style is *content* — it
    // rides on `initData`, not the serialisable config.
    const N = lesMiserables.nodes.length;
    const R = 260;
    const nodes: GraphNode[] = lesMiserables.nodes.map((n, i) => {
      const theta = (i / N) * Math.PI * 2;
      return {
        id: n.id,
        position: { x: Math.cos(theta) * R, y: Math.sin(theta) * R },
        data: {
          group: n.data.group,
        },
        style: {
          shape: { kind: 'circle', radius: 9 },
          bgFill: groupColors[n.data.group % groupColors.length],
        },
      };
    });

    // ── Add everything, then init() last ─────────────────────────────────
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-layer-basic')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    // Wiring only — ids + initial content. All settings live in the config below.
    const graph = new GraphLayer({
      id: 'graph',
      options: { initData: { nodes, edges: lesMiserables.edges } },
    });
    canvas.layers.add(graph);
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new DragNodeBehaviour({ id: 'drag-node', targetLayerId: 'graph' }));

    // The whole serialisable state, keyed by id. No layout — node positions are
    // static (set above), so the graph renders as laid out the moment data loads.
    const canvasOptions = {
      layers: {
        graph: {
          edge: { style: { strokeColor: 0xcbd5e1, strokeWidth: 1, arrowTargetShape: 'none' } },
        },
      },
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
        'drag-node': { enabled: true },
      },
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    canvas.camera.fitContent(graph.getBounds(), 80);
  },
};
