import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { DragNodeBehaviour, GraphLayer, type GraphNode } from '@invana/graph';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { lesMiserables } from '@invana/graph-datasets';
import { createContainer } from '../div-util';

const meta: Meta = { title: 'graph-layouts-force-d3/LesMiserables' };
export default meta;
type Story = StoryObj;

export const LesMiserables: Story = {
  render: () => createContainer({ id: 'graph-d3-force' }),

  play: async ({ canvasElement }) => {
    // Eleven distinct hues, one per Les Mis "group" id (0–10).
    const groupColors = [
      0x9ca3af, 0xef4444, 0xf59e0b, 0xeab308, 0x10b981, 0x06b6d4,
      0x3b82f6, 0x8b5cf6, 0xec4899, 0x14b8a6, 0xa3e635,
    ];

    // Map the dataset into GraphNodes with group-derived fill colour. We
    // leave `position` unset so the layout chooses an initial scatter.
    const nodes: GraphNode[] = lesMiserables.nodes.map((n) => ({
      id: n.id,
      data: {
        group: n.data.group,
        fill: groupColors[n.data.group % groupColors.length],
        size: 18,
      },
    }));

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-d3-force')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        edgeDefaults: { stroke: 0xcbd5e1, strokeWidth: 1, arrow: false },
      },
    });
    canvas.layers.add(graph);

    graph.setData({ nodes, edges: lesMiserables.edges });

    // Drag a node: store.setPosition fires, layout respects the now-pinned
    // node so released nodes stay where you drop them.
    canvas.behaviours.register(
      new DragNodeBehaviour({ id: 'drag-node', layerId: 'graph', enabled: true }),
    );

    // Initial fit — nodes scatter near the origin so this is mostly to set a
    // reasonable starting zoom.
    canvas.camera.fitContent(graph.getBounds(), 80);

    const layout = new D3ForceLayout({
      charge: -120,
      linkDistance: 50,
      linkStrength: 0.5,
      collide: 14,
      // Camera tracks the spreading cluster every tick; final tight fit on settle.
      onTick: () => canvas.camera.fitContent(graph.getBounds(), 80),
      onEnd: () => canvas.camera.fitContent(graph.getBounds(), 80),
    });

    // Animated apply — resolves when alpha settles. We don't await; the
    // user can pan / zoom while the simulation runs.
    void layout.apply(graph);
  },
};
