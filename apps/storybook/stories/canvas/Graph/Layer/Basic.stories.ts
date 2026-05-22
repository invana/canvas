import type { Meta, StoryObj } from '@storybook/react-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { DragNodeBehaviour, GraphLayer, type GraphNode } from '@invana/graph';
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
    // fill colour derived from its group.
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

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-layer-basic')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        edge: { style: { strokeColor: 0xcbd5e1, strokeWidth: 1, arrowTargetShape: 'none' } },
      },
    });
    canvas.layers.add(graph);

    graph.setData({ nodes, edges: lesMiserables.edges });

    canvas.behaviours.register(
      new DragNodeBehaviour({ id: 'drag-node', layerId: 'graph', enabled: true }),
    );

    canvas.camera.fitContent(graph.getBounds(), 80);
  },
};
